import { makeAutoObservable, runInAction } from "mobx";
import { BuildingComposition } from "../../core/composition/BuildingComposition";
import { ModuleManager } from "../../core/managers/ModuleManager";
import { ModuleDefinition } from "../../core/composition/ModuleDefinition";
import { NodeManager } from "../../core/managers/NodeManager";
import { SnapManager } from "../../core/managers/SnapManager";
import { ModuleInstance } from "../../core/composition/ModuleInstance";
import type { Bounds3 } from "../../core/composition/types";
import type { BackendModule } from "../models/backendModule";
import type {
    BackendTemplate,
    BackendTemplateModulePlacement,
} from "../models/backendTemplate";
import { CompositionHistory } from "./CompositionHistory";
import { fetchBackendModules } from "../api/modulesApi";
import { fetchBackendTemplates } from "../api/templatesApi";
const DISJOINT_OFFSET_STEP = 0.4;
const DISJOINT_OFFSET_TRIES = 8;
const QUARTER_TURN_RADIANS = Math.PI / 2;
const SNAP_OVERLAP_EPSILON = 0.01;
const DRAG_DETACH_DISTANCE = 0.15;

type SnapAttemptResult = {
    snapped: boolean;
    magnetActive: boolean;
};

type MoveModuleGroupResult = {
    moved: boolean;
    disconnectedIds: Set<string> | null;
};

export class DesignController {
    composition: BuildingComposition;
    moduleManager: ModuleManager;
    nodeManager: NodeManager;
    snapManager: SnapManager;
    moduleDefinitions: ModuleDefinition[] = [];
    templates: BackendTemplate[] = [];
    private templateModuleDefinitions: ModuleDefinition[] = [];
    isModulesLoading = false;
    isTemplatesLoading = false;
    private canvasLoadCount = 0;
    modulesLoadError: string | null = null;
    templatesLoadError: string | null = null;
    private hasLoadedModules = false;
    private hasLoadedTemplates = false;
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
        this.registerCatalogDefinitions();
    }

    initializeFromBackendTemplates(templates: BackendTemplate[]) {
        this.templates = templates;
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

    loadTemplatesFromBackend = async (force = false) => {
        if (this.isTemplatesLoading) return;
        if (this.hasLoadedTemplates && !force) return;

        runInAction(() => {
            this.isTemplatesLoading = true;
            this.templatesLoadError = null;
        });

        try {
            const templates = await fetchBackendTemplates();

            runInAction(() => {
                this.initializeFromBackendTemplates(templates);
                this.hasLoadedTemplates = true;
            });
        } catch (error) {
            runInAction(() => {
                this.templatesLoadError = getErrorMessage(error, "Failed to load templates.");
            });
        } finally {
            runInAction(() => {
                this.isTemplatesLoading = false;
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

    get availableTemplates() {
        return this.templates;
    }

    loadTemplateIntoCanvas = (templateId: string) => {
        const template = this.templates.find(
            (candidate) => String(candidate.id) === String(templateId)
        );
        if (!template) return;

        const templateModules = this.createTemplateModuleInstances(template);

        if (templateModules.length === 0) {
            return;
        }

        this.history.recordChange(() => {
            this.moduleManager.replaceModules(templateModules);
            this.composition.graph.replaceConnections([]);
            const lastModule = templateModules.at(-1) ?? null;
            this.composition.setSelectedModule(lastModule?.instanceId ?? null);
        });
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
    ): MoveModuleGroupResult => {
        const dx = targetX - module.transform.position.x;
        const dy = targetY - module.transform.position.y;
        const dz = targetZ - module.transform.position.z;
        if (dx === 0 && dy === 0 && dz === 0) {
            return { moved: false, disconnectedIds: null };
        }
        const activeConnections =
            this.composition.graph.getConnectionsForModule(module.instanceId);
        if (activeConnections.length > 0) {
            const pullDistanceSq = dx * dx + dy * dy + dz * dz;

            if (pullDistanceSq < DRAG_DETACH_DISTANCE * DRAG_DETACH_DISTANCE) {
                return { moved: false, disconnectedIds: null };
            }

            const disconnected = this.nodeManager.disjointModule(module.instanceId);

            module.setPosition(
                module.transform.position.x + dx,
                module.transform.position.y + dy,
                module.transform.position.z + dz
            );

            return { moved: true, disconnectedIds: disconnected };
        }

        module.setPosition(
            module.transform.position.x + dx,
            module.transform.position.y + dy,
            module.transform.position.z + dz
        );

        return { moved: true, disconnectedIds: null };
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

            if (removedConnections.size > 0) {
                const module = this.composition.modules.get(selectedModuleId);
                if (module) {
                    this.offsetDisjointedModule(module);
                }
            }
        });
    };

    trySnap = (
        module: ModuleInstance,
        options: {
            commit?: boolean;
            excludeModuleIds?: Set<string>;
        } = {}
    ): SnapAttemptResult => {
        const candidates = this.snapManager.findSnapTargets(
            module,
            options.excludeModuleIds
        );

        if (candidates.length === 0) {
            return { snapped: false, magnetActive: false };
        }

        const startPosition = { ...module.transform.position };
        for (const candidate of candidates) {
            const snapPosition = this.snapManager.computeSnapTransform(
                startPosition,
                candidate.sourceWorldPosition,
                candidate.targetWorldPosition
            );
            module.setPosition(snapPosition.x, snapPosition.y, snapPosition.z);

            const blockingOverlap = this.moduleManager.hasBlockingOverlap(
                module,
                SNAP_OVERLAP_EPSILON,
                candidate.target.module.instanceId
            );

            if (blockingOverlap) {
                continue;
            }

            if (options.commit) {
                const connected = this.nodeManager.markOccupied(
                    candidate.source,
                    candidate.target
                );

                if (connected) {
                    return { snapped: true, magnetActive: true };
                }

                // If connection failed (e.g. target occupied), we still accept the visual snap.
                return { snapped: true, magnetActive: true };
            }

            return { snapped: false, magnetActive: true };
        }

        module.setPosition(startPosition.x, startPosition.y, startPosition.z);
        return { snapped: false, magnetActive: false };
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

    private registerCatalogDefinitions() {
        this.moduleManager.clearDefinitions();

        [...this.moduleDefinitions, ...this.templateModuleDefinitions].forEach((definition) => {
            this.moduleManager.registerDefinition(definition);
        });
    }

    private createTemplateModuleInstances(template: BackendTemplate) {
        const modulesData = template.designData?.modulesData;
        if (!Array.isArray(modulesData) || modulesData.length === 0) {
            return [];
        }

        const discoveredDefinitions: ModuleDefinition[] = [];
        const modules = modulesData
            .map((moduleData, index) =>
                this.buildModuleInstanceFromTemplateEntry(moduleData, index, discoveredDefinitions)
            )
            .filter((module): module is ModuleInstance => module !== null);

        if (discoveredDefinitions.length > 0) {
            this.mergeTemplateModuleDefinitions(discoveredDefinitions);
        }

        return modules;
    }

    private buildModuleInstanceFromTemplateEntry(
        moduleData: BackendTemplateModulePlacement,
        index: number,
        discoveredDefinitions: ModuleDefinition[]
    ) {
        const source = moduleData.module;
        if (!source) {
            return null;
        }

        const definition = new ModuleDefinition(source);
        if (!definition.glbPath.trim()) {
            return null;
        }

        discoveredDefinitions.push(definition);

        const module = new ModuleInstance(definition);
        const position = parseTemplateModulePosition(moduleData.position, index);
        const rotationY = parseTemplateModuleRotationY(moduleData.rotation);

        module.setPosition(position.x, position.y, position.z);
        module.setRotation(0, rotationY, 0);

        return module;
    }

    private mergeTemplateModuleDefinitions(definitions: ModuleDefinition[]) {
        const merged = new Map(
            this.templateModuleDefinitions.map((definition) => [definition.id, definition])
        );

        definitions.forEach((definition) => {
            merged.set(definition.id, definition);
        });

        this.templateModuleDefinitions = Array.from(merged.values());
        this.registerCatalogDefinitions();
    }
}

function getErrorMessage(error: unknown, fallbackMessage = "Failed to load modules.") {
    if (error instanceof Error && error.message.trim()) {
        return error.message;
    }

    return fallbackMessage;
}

function parseTemplateModulePosition(
    position: BackendTemplateModulePlacement["position"],
    index: number
) {
    if (Array.isArray(position) && position.length >= 3) {
        const x = asFiniteNumber(position[0], index * 3);
        const y = asFiniteNumber(position[1], 0);
        const z = asFiniteNumber(position[2], 0);
        return { x, y, z };
    }

    return { x: index * 3, y: 0, z: 0 };
}

function parseTemplateModuleRotationY(
    rotation: BackendTemplateModulePlacement["rotation"]
) {
    if (typeof rotation === "number") {
        return normalizeRotation(asFiniteNumber(rotation, 0));
    }

    if (Array.isArray(rotation) && rotation.length >= 2) {
        return normalizeRotation(asFiniteNumber(rotation[1], 0));
    }

    if (rotation && typeof rotation === "object" && !Array.isArray(rotation)) {
        return normalizeRotation(asFiniteNumber(rotation.y, 0));
    }

    return 0;
}

function asFiniteNumber(value: unknown, fallback: number) {
    const parsed =
        typeof value === "number" ? value : Number.parseFloat(String(value));

    return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeRotation(value: number) {
    if (Math.abs(value) > Math.PI * 2 + 0.001) {
        return (value * Math.PI) / 180;
    }

    return value;
}
