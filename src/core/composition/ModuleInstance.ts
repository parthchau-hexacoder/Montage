import { makeAutoObservable } from "mobx";
import { ModuleDefinition } from "./ModuleDefinition";
import type { Transform } from "./types";

let idCounter = 0;

export class ModuleInstance {
    readonly instanceId: string;
    readonly definition: ModuleDefinition;

    transform: Transform;

    constructor(definition: ModuleDefinition) {
        this.instanceId = `module_${idCounter++}`;
        this.definition = definition;

        this.transform = {
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
        };

        makeAutoObservable(this);
    }

    setPosition(x: number, y: number, z: number) {
        this.transform.position = { x, y, z };
    }

    setRotation(x: number, y: number, z: number) {
        this.transform.rotation = { x, y, z };
    }

    get metrics() {
        return this.definition.metrics;
    }

    get baseCost() {
        return this.definition.baseCost;
    }
}
