import { makeAutoObservable } from "mobx";
import { BuildingComposition } from "../../core/composition/BuildingComposition";
import { ModuleManager } from "../../core/managers/ModuleManager";
import { ModuleDefinition } from "../../core/composition/ModuleDefinition";
import { NodeManager } from "../../core/managers/NodeManager";
import { SnapManager } from "../../core/managers/SnapManager";
import { ModuleInstance } from "../../core/composition/ModuleInstance";
import { NodeInstance } from "../../core/composition/NodeInstance";
import type { ConnectionRecord } from "../../core/composition/ConnectionGraph";
import type { Bounds3, NodeDefinition, Transform } from "../../core/composition/types";

type ModuleSnapshot = {
    instanceId: string;
    definitionId: string;
    transform: Transform;
    nodes: Array<{
        definition: NodeDefinition;
        occupied: boolean;
    }>;
};

type CompositionSnapshot = {
    modules: ModuleSnapshot[];
    connections: ConnectionRecord[];
    selectedModuleId: string | null;
};

const HISTORY_LIMIT = 100;
const DISJOINT_OFFSET_STEP = 0.4;
const DISJOINT_OFFSET_TRIES = 8;
const QUARTER_TURN_RADIANS = Math.PI / 2;

export class DesignController {
    composition: BuildingComposition;
    moduleManager: ModuleManager;
    nodeManager: NodeManager;
    snapManager: SnapManager;
    private undoStack: CompositionSnapshot[] = [];
    private redoStack: CompositionSnapshot[] = [];
    private interactionStartSnapshot: CompositionSnapshot | null = null;

    constructor() {
        this.composition = new BuildingComposition();
        this.moduleManager = new ModuleManager(this.composition);
        this.nodeManager = new NodeManager(this.composition);
        this.snapManager = new SnapManager(this.nodeManager);

        makeAutoObservable(this, {}, { autoBind: true });
    }

    initializeDefaults() {
        const dwelling = new ModuleDefinition({
            id: "dwelling",
            name: "Dwelling",
            glbPath: "assets/Dwelling_tag.glb",
            metrics: { beds: 1, baths: 1, sqft: 900 },
            baseCost: 120000,
            nodes: [],
        });

        const annex = new ModuleDefinition({
            id: "annex",
            name: "Annex",
            glbPath: "assets/Annex_tag.glb",
            metrics: { beds: 0, baths: 0.5, sqft: 250 },
            baseCost: 60000,
            nodes: [],
        });

        const lifestyle = new ModuleDefinition({
            id: "lifestyle",
            name: "Lifestyle",
            glbPath: "assets/Lifestyle_tag.glb",
            metrics: { beds: 0, baths: 0.5, sqft: 250 },
            baseCost: 60000,
            nodes: [],
        });

        this.moduleManager.registerDefinition(dwelling);
        this.moduleManager.registerDefinition(annex);
        this.moduleManager.registerDefinition(lifestyle);
    }

    get canUndo() {
        return this.undoStack.length > 0;
    }

    get canRedo() {
        return this.redoStack.length > 0;
    }

    get availableModuleDefinitions() {
        return this.moduleManager.getDefinitions();
    }

    addModule = (typeId: string) => {
        const before = this.captureSnapshot();
        const module = this.moduleManager.createModule(typeId);
        this.composition.setSelectedModule(module.instanceId);
        this.trackStateChange(before);

        return module;
    };

    removeModule = (id: string) => {
        const before = this.captureSnapshot();
        this.nodeManager.disjointModule(id);
        this.moduleManager.removeModule(id);
        this.trackStateChange(before);
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
        const groupIds = this.composition.graph.getConnectedModuleIds(
            module.instanceId
        );
        const dx = targetX - module.transform.position.x;
        const dy = targetY - module.transform.position.y;
        const dz = targetZ - module.transform.position.z;

        groupIds.forEach((id) => {
            const connectedModule = this.composition.modules.get(id);

            if (!connectedModule) return;

            connectedModule.setPosition(
                connectedModule.transform.position.x + dx,
                connectedModule.transform.position.y + dy,
                connectedModule.transform.position.z + dz
            );
        });
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

        this.endInteraction(module);
    };

    canRotateModule = (module: ModuleInstance): boolean => {
        return this.composition.graph.getConnectionsForModule(module.instanceId).length === 0;
    };

    disjointSelectedModule = () => {
        const selectedModuleId = this.composition.selectedModuleId;

        if (!selectedModuleId) return;

        const before = this.captureSnapshot();
        const removedConnections = this.nodeManager.disjointModule(selectedModuleId);

        if (removedConnections > 0) {
            const module = this.composition.modules.get(selectedModuleId);
            if (module) {
                this.offsetDisjointedModule(module);
            }
        }

        this.trackStateChange(before);
    };

    trySnap = (module: ModuleInstance) => {
        const result = this.snapManager.findSnapTarget(module);

        if (!result) return;

        const previousPosition = { ...module.transform.position };
        const newPos = this.snapManager.computeSnapTransform(
            module,
            result.source,
            result.target
        );

        module.setPosition(newPos.x, newPos.y, newPos.z);

        const isOverlapped = this.hasOverlappedWithOtherModule(module);
        if (isOverlapped) {
            module.setPosition(
                previousPosition.x,
                previousPosition.y,
                previousPosition.z
            );
            return;
        }

        this.nodeManager.markOccupied(result.source, result.target);
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
        if (this.interactionStartSnapshot) return;

        this.interactionStartSnapshot = this.captureSnapshot();
    };

    endInteraction = (_movedModule?: ModuleInstance) => {
        if (!this.interactionStartSnapshot) return;

        this.trackStateChange(this.interactionStartSnapshot);
        this.interactionStartSnapshot = null;
    };

    undo = () => {
        const previous = this.undoStack.pop();
        if (!previous) return;

        const current = this.captureSnapshot();
        this.redoStack.push(current);

        this.restoreSnapshot(previous);
    };

    redo = () => {
        const next = this.redoStack.pop();
        if (!next) return;

        const current = this.captureSnapshot();
        this.undoStack.push(current);

        this.restoreSnapshot(next);
    };

    private trackStateChange(before = this.captureSnapshot()) {
        const current = this.captureSnapshot();

        if (this.isSameSnapshot(before, current)) {
            return;
        }

        this.undoStack.push(before);
        if (this.undoStack.length > HISTORY_LIMIT) {
            this.undoStack.shift();
        }
        this.redoStack = [];
    }

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

    private captureSnapshot(): CompositionSnapshot {
        const modules = Array.from(this.composition.modules.values())
            .map((module) => ({
                instanceId: module.instanceId,
                definitionId: module.definition.id,
                transform: {
                    position: { ...module.transform.position },
                    rotation: { ...module.transform.rotation },
                },
                nodes: module.nodes.map((node) => ({
                    definition: {
                        id: node.definition.id,
                        type: node.definition.type,
                        position: { ...node.definition.position },
                        rotation: { ...node.definition.rotation },
                        compatibleWith: [...node.definition.compatibleWith],
                    },
                    occupied: node.occupied,
                })),
            }))
            .sort((a, b) => a.instanceId.localeCompare(b.instanceId));

        return {
            modules,
            connections: this.composition.graph.connections.map((connection) => ({
                ...connection,
            })),
            selectedModuleId: this.composition.selectedModuleId,
        };
    }

    private restoreSnapshot(snapshot: CompositionSnapshot) {
        const definitions = new Map(
            this.moduleManager.getDefinitions().map((definition) => [definition.id, definition])
        );

        this.composition.modules.clear();

        snapshot.modules.forEach((moduleSnapshot) => {
            const definition = definitions.get(moduleSnapshot.definitionId);
            if (!definition) return;

            const module = new ModuleInstance(definition);
            (module as unknown as { instanceId: string }).instanceId = moduleSnapshot.instanceId;

            module.setPosition(
                moduleSnapshot.transform.position.x,
                moduleSnapshot.transform.position.y,
                moduleSnapshot.transform.position.z
            );
            module.setRotation(
                moduleSnapshot.transform.rotation.x,
                moduleSnapshot.transform.rotation.y,
                moduleSnapshot.transform.rotation.z
            );

            module.nodes = moduleSnapshot.nodes.map((nodeSnapshot) => {
                const node = new NodeInstance(
                    {
                        ...nodeSnapshot.definition,
                        position: { ...nodeSnapshot.definition.position },
                        rotation: { ...nodeSnapshot.definition.rotation },
                        compatibleWith: [...nodeSnapshot.definition.compatibleWith],
                    },
                    module
                );

                node.occupied = nodeSnapshot.occupied;

                return node;
            });

            this.composition.modules.set(module.instanceId, module);
        });

        this.composition.graph.connections = snapshot.connections.map((connection) => ({
            ...connection,
        }));
        this.composition.setSelectedModule(snapshot.selectedModuleId);
    }

    private isSameSnapshot(a: CompositionSnapshot, b: CompositionSnapshot) {
        return JSON.stringify(a) === JSON.stringify(b);
    }

}
