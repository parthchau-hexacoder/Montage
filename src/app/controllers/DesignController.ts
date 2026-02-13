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
        this.moduleManager.removeModule(id);
    };

    trySnap(module: ModuleInstance) {
        const result = this.snapManager.findSnapTarget(module);

        if (!result) return;

        const newPos = this.snapManager.computeSnapTransform(
            module,
            result.source,
            result.target
        );

        module.setPosition(newPos.x, newPos.y, newPos.z);

        this.nodeManager.markOccupied(result.source, result.target);
    }
}
