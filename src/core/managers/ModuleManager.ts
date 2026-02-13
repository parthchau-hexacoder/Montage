import { ModuleDefinition } from "../composition/ModuleDefinition";
import { ModuleInstance } from "../composition/ModuleInstance";
import { BuildingComposition } from "../composition/BuildingComposition";

export class ModuleManager {
    private definitions: Map<string, ModuleDefinition> = new Map();
    private composition: BuildingComposition;

    constructor(composition: BuildingComposition) {
        this.composition = composition;
    }

    registerDefinition(def: ModuleDefinition) {
        this.definitions.set(def.id, def);
    }

    createModule(typeId: string) {
        const def = this.definitions.get(typeId);
        if (!def) throw new Error("Module definition not found");

        const instance = new ModuleInstance(def);
        this.composition.addModule(instance);

        return instance;
    }

    removeModule(instanceId: string) {
        this.composition.removeModule(instanceId);
    }

    getDefinitions() {
        return Array.from(this.definitions.values());
    }
}
