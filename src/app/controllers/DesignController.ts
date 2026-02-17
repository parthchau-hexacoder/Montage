import { makeAutoObservable, runInAction } from "mobx";
import { BuildingComposition } from "../../core/composition/BuildingComposition";
import { ModuleManager } from "../../core/managers/ModuleManager";
import { ModuleDefinition } from "../../core/composition/ModuleDefinition";
import { NodeManager } from "../../core/managers/NodeManager";
import { SNAP_THRESHOLD, SnapManager } from "../../core/managers/SnapManager";
import { ModuleInstance } from "../../core/composition/ModuleInstance";
import type { Bounds3 } from "../../core/composition/types";
import type { BackendModule } from "../models/backendModule";
import { CompositionHistory } from "./CompositionHistory";
import { fetchBackendModules } from "../api/modulesApi";
const DISJOINT_OFFSET_STEP = 0.4;
const DISJOINT_OFFSET_TRIES = 8;
const QUARTER_TURN_RADIANS = Math.PI / 2;
const SNAP_COMMIT_DISTANCE = SNAP_THRESHOLD;
const MAGNET_MIN_STRENGTH = 0.25;
const MAGNET_MAX_STRENGTH = 0.75;
const DRAG_DETACH_DISTANCE = 0.6;

export class DesignController {
    composition: BuildingComposition;
    moduleManager: ModuleManager;
    nodeManager: NodeManager;
    snapManager: SnapManager;
    moduleDefinitions: ModuleDefinition[] = [];
    isModulesLoading = false;
    private canvasLoadCount = 0;
    modulesLoadError: string | null = null;
    private hasLoadedModules = false;
    private history: CompositionHistory;

    constructor() {
        this.composition = new BuildingComposition();
        this.moduleManager = new ModuleManager(this.composition);
        this.nodeManager = new NodeManager(this.composition);
        this.snapManager = new SnapManager(this.nodeManager);
        this.history = new CompositionHistory(this.composition, this.moduleManager);

        makeAutoObservable(this, {}, { autoBind: true });
    }

    initializeFromBackendModules(modules: BackendModule[]) {
        const definitions = modules
            .map((module) => new ModuleDefinition(module))
            .filter((definition) => definition.glbPath.trim().length > 0);

        this.moduleDefinitions = definitions;
        this.moduleManager.clearDefinitions();

        definitions.forEach((definition) => {
            this.moduleManager.registerDefinition(definition);
        });
    }

    loadModulesFromBackend = async (force = false) => {
        if (this.isModulesLoading) return;
        if (this.hasLoadedModules && !force) return;

        runInAction(() => {
            this.isModulesLoading = true;
            this.modulesLoadError = null;
        });

        try {
            const modules = await fetchBackendModules();

            runInAction(() => {
                this.initializeFromBackendModules(modules);
                this.hasLoadedModules = true;
            });
        } catch (error) {
            runInAction(() => {
                this.modulesLoadError = getErrorMessage(error);
            });
        } finally {
            runInAction(() => {
                this.isModulesLoading = false;
            });
        }
    };

    get canUndo() {
        return this.history.canUndo;
    }

    get canRedo() {
        return this.history.canRedo;
    }

    get availableModuleDefinitions() {
        return this.moduleDefinitions;
    }

    get isCanvasLoading() {
        return this.canvasLoadCount > 0;
    }

    beginCanvasLoad = () => {
        this.canvasLoadCount += 1;
    };

    endCanvasLoad = () => {
        this.canvasLoadCount = Math.max(0, this.canvasLoadCount - 1);
    };

    addModule = (typeId: string) => {
        return this.history.recordChange(() => {
            const module = this.moduleManager.createModule(typeId);
            this.composition.setSelectedModule(module.instanceId);
            return module;
        });
    };

    removeModule = (id: string) => {
        this.history.recordChange(() => {
            this.nodeManager.disjointModule(id);
            this.moduleManager.removeModule(id);
        });
    };

    selectModule = (moduleId: string | null) => {
        this.composition.setSelectedModule(moduleId);
    };

    moveModuleGroup = (
        module: ModuleInstance,
        targetX: number,
        targetY: number,
        targetZ: number
    ) => {
        const dx = targetX - module.transform.position.x;
        const dy = targetY - module.transform.position.y;
        const dz = targetZ - module.transform.position.z;
        if (dx === 0 && dy === 0 && dz === 0) {
            return;
        }
        const activeConnections =
            this.composition.graph.getConnectionsForModule(module.instanceId);
        if (activeConnections.length > 0) {
            const pullDistanceSq = dx * dx + dy * dy + dz * dz;

            if (pullDistanceSq < DRAG_DETACH_DISTANCE * DRAG_DETACH_DISTANCE) {
                return;
            }

            this.nodeManager.disjointModule(module.instanceId);
        }

        module.setPosition(
            module.transform.position.x + dx,
            module.transform.position.y + dy,
            module.transform.position.z + dz
        );
    };

    rotateModuleQuarter = (module: ModuleInstance, direction: "cw" | "ccw") => {
        if (!this.canRotateModule(module)) return;

        this.beginInteraction();

        const delta = direction === "cw" ? QUARTER_TURN_RADIANS : -QUARTER_TURN_RADIANS;
        const nextY = module.transform.rotation.y + delta;

        module.setRotation(
            module.transform.rotation.x,
            nextY,
            module.transform.rotation.z
        );

        this.endInteraction();
    };

    canRotateModule = (module: ModuleInstance): boolean => {
        return this.composition.graph.getConnectionsForModule(module.instanceId).length === 0;
    };

    disjointSelectedModule = () => {
        const selectedModuleId = this.composition.selectedModuleId;

        if (!selectedModuleId) return;

        this.history.recordChange(() => {
            const removedConnections = this.nodeManager.disjointModule(selectedModuleId);

            if (removedConnections > 0) {
                const module = this.composition.modules.get(selectedModuleId);
                if (module) {
                    this.offsetDisjointedModule(module);
                }
            }
        });
    };

    trySnap = (module: ModuleInstance) => {
        const result = this.snapManager.findSnapTarget(module);

        if (!result) {
            return;
        }

        const previousPosition = { ...module.transform.position };
        const newPos = this.snapManager.computeSnapTransform(
            module,
            result.sourceWorldPosition,
            result.targetWorldPosition
        );

        const offsetX = newPos.x - module.transform.position.x;
        const offsetY = newPos.y - module.transform.position.y;
        const offsetZ = newPos.z - module.transform.position.z;
        const shouldCommitSnap = result.distance <= SNAP_COMMIT_DISTANCE;

        if (shouldCommitSnap) {
            module.setPosition(newPos.x, newPos.y, newPos.z);
        } else {
            const normalizedDistance = Math.min(result.distance / SNAP_THRESHOLD, 1);
            const magnetStrength =
                MAGNET_MIN_STRENGTH +
                (1 - normalizedDistance) * (MAGNET_MAX_STRENGTH - MAGNET_MIN_STRENGTH);

            module.setPosition(
                module.transform.position.x + offsetX * magnetStrength,
                module.transform.position.y + offsetY * magnetStrength,
                module.transform.position.z + offsetZ * magnetStrength
            );
        }

        const overlapping = this.getOverlappingModules(module, 0.01);

        if (overlapping.length > 0) {
            module.setPosition(
                previousPosition.x,
                previousPosition.y,
                previousPosition.z
            );
            return;
        }

        if (shouldCommitSnap) {
            this.nodeManager.markOccupied(result.source, result.target);
            return;
        }
    };

    calculateBoundingBox = (module: ModuleInstance): Bounds3 | null => {
        return this.moduleManager.calculateBoundingBox(module);
    };

    hasOverlappedWithOtherModule = (
        module: ModuleInstance,
        epsilon = 0
    ): boolean => {
        return this.moduleManager.hasOverlappedWithOtherModule(module, epsilon);
    };

    getOverlappingModules = (
        module: ModuleInstance,
        epsilon = 0
    ): ModuleInstance[] => {
        return this.moduleManager.getOverlappingModules(module, epsilon);
    };

    beginInteraction = () => {
        this.history.beginInteraction();
    };

    endInteraction = () => {
        this.history.endInteraction();
    };

    undo = () => {
        this.history.undo();
    };

    redo = () => {
        this.history.redo();
    };

    private offsetDisjointedModule(module: ModuleInstance) {
        const start = { ...module.transform.position };
        const directions = [
            { x: 1, z: 0 },
            { x: -1, z: 0 },
            { x: 0, z: 1 },
            { x: 0, z: -1 },
        ];

        for (let step = 1; step <= DISJOINT_OFFSET_TRIES; step++) {
            for (const direction of directions) {
                module.setPosition(
                    start.x + direction.x * DISJOINT_OFFSET_STEP * step,
                    start.y,
                    start.z + direction.z * DISJOINT_OFFSET_STEP * step
                );

                if (!this.hasOverlappedWithOtherModule(module)) {
                    return;
                }
            }
        }
    }

}

function getErrorMessage(error: unknown) {
    if (error instanceof Error && error.message.trim()) {
        return error.message;
    }

    return "Failed to load modules.";
}
