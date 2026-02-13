import { BuildingComposition } from "../../core/composition/BuildingComposition";
import { ModuleManager } from "../../core/managers/ModuleManager";
import { ModuleDefinition } from "../../core/composition/ModuleDefinition";
import { NodeManager } from "../../core/managers/NodeManager";
import { SnapManager } from "../../core/managers/SnapManager";
import type { ModuleInstance } from "../../core/composition/ModuleInstance";

export class DesignController {
    composition: BuildingComposition;
    moduleManager: ModuleManager;
    nodeManager: NodeManager;
    snapManager: SnapManager;

    constructor() {
        this.composition = new BuildingComposition();
        this.moduleManager = new ModuleManager(this.composition);
        this.nodeManager = new NodeManager(this.composition);
        this.snapManager = new SnapManager(this.nodeManager);
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

    addModule = (typeId: string) => {
        return this.moduleManager.createModule(typeId);
    };

    removeModule = (id: string) => {
        this.nodeManager.disjointModule(id);
        this.moduleManager.removeModule(id);
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

    disjointSelectedModule = () => {
        const selectedModuleId = this.composition.selectedModuleId;

        if (!selectedModuleId) return;

        this.nodeManager.disjointModule(selectedModuleId);
    };

    trySnap = (module: ModuleInstance) => {
        const result = this.snapManager.findSnapTarget(module);

        if (!result) return;

        const newPos = this.snapManager.computeSnapTransform(
            module,
            result.source,
            result.target
        );

        module.setPosition(newPos.x, newPos.y, newPos.z);

        this.nodeManager.markOccupied(result.source, result.target);

        if (typeof window !== "undefined") {
            window.alert(
                `Snapped ${result.source.module.instanceId}:${result.source.definition.id} -> ${result.target.module.instanceId}:${result.target.definition.id}`
            );
        }
    };
}
