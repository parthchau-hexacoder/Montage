import { makeAutoObservable } from "mobx";
import type { NodeDefinition, Vec3 } from "./types";
import { ModuleInstance } from "./ModuleInstance";
import { Euler, Quaternion, Vector3 } from "three";

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
        const { rotation } = this.module.transform;
        const local = new Vector3(
            this.definition.position.x,
            this.definition.position.y,
            this.definition.position.z
        );
        const moduleQuaternion = new Quaternion().setFromEuler(
            new Euler(rotation.x, rotation.y, rotation.z, "XYZ")
        );
        const worldOffset = local.applyQuaternion(moduleQuaternion);

        return {
            x: position.x + worldOffset.x,
            y: position.y + worldOffset.y,
            z: position.z + worldOffset.z,
        };
    }

    get worldRotation(): Vec3 {
        const nodeRotation = this.definition.rotation;
        const moduleRotation = this.module.transform.rotation;
        const nodeQuaternion = new Quaternion().setFromEuler(
            new Euler(nodeRotation.x, nodeRotation.y, nodeRotation.z, "XYZ")
        );
        const moduleQuaternion = new Quaternion().setFromEuler(
            new Euler(moduleRotation.x, moduleRotation.y, moduleRotation.z, "XYZ")
        );
        const worldQuaternion = moduleQuaternion.multiply(nodeQuaternion);
        const worldEuler = new Euler(0, 0, 0, "XYZ").setFromQuaternion(worldQuaternion);

        return {
            x: worldEuler.x,
            y: worldEuler.y,
            z: worldEuler.z,
        };
    }

    isCompatibleWith(other: NodeInstance) {
        return this.definition.compatibleWith.includes(other.definition.type);
    }
}
