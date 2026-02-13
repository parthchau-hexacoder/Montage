import { makeAutoObservable } from "mobx";
import type { ModuleInstance } from "./ModuleInstance";
import { ConnectionGraph } from "./ConnectionGraph";

export class BuildingComposition{
    modules: Map<string, ModuleInstance> = new Map();
    graph = new ConnectionGraph();

    constructor() {
        makeAutoObservable(this);
    }

    addModule(instance: ModuleInstance){
        this.modules.set(instance.instanceId, instance);
    }

    removeModule(instanceId: string){
        this.modules.delete(instanceId)
    }

    get totalBeds(){
        return Array.from(this.modules.values()).reduce((sum, m) => sum + m.metrics.beds, 0);
    }

    get totalSqft(){
        return Array.from(this.modules.values()).reduce((sum, m) => sum + m.metrics.sqft, 0);
    }

    get totalBaths(){
        return Array.from(this.modules.values()).reduce((sum, m) => sum + m.metrics.baths, 0);
    }

    get totalCost(){
        return Array.from(this.modules.values()).reduce((sum, m) => sum + m.baseCost, 0);
    }
}