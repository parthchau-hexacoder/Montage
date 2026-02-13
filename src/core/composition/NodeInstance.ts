import { makeAutoObservable } from "mobx";
import type { NodeDefinition, Vec3 } from "./types";
import { ModuleInstance } from "./ModuleInstance";

export class NodeInstance {
    readonly definition: NodeDefinition;
    readonly module: ModuleInstance;

    occupied: boolean = false;

    constructor(def: NodeDefinition, module: ModuleInstance) {
        this.definition = def;
        this.module = module;

        makeAutoObservable(this);
    }

    get worldPosition(): Vec3 {
        const { position } = this.module.transform;

        return {
            x: position.x + this.definition.position.x,
            y: position.y + this.definition.position.y,
            z: position.z + this.definition.position.z,
        };
    }

    get worldRotation(): Vec3 {
        return this.definition.rotation;
    }

    isCompatibleWith(other: NodeInstance) {
        return this.definition.compatibleWith.includes(other.definition.type);
    }
}
