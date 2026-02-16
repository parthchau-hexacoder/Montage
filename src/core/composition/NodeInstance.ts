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
        _tmpLocalPosition.set(
            this.definition.position.x,
            this.definition.position.y,
            this.definition.position.z
        );
        _tmpRotationEuler.set(rotation.x, rotation.y, rotation.z, "XYZ");
        _tmpModuleQuaternion.setFromEuler(_tmpRotationEuler);
        _tmpLocalPosition.applyQuaternion(_tmpModuleQuaternion);

        return {
            x: position.x + _tmpLocalPosition.x,
            y: position.y + _tmpLocalPosition.y,
            z: position.z + _tmpLocalPosition.z,
        };
    }

    get worldRotation(): Vec3 {
        const nodeRotation = this.definition.rotation;
        const moduleRotation = this.module.transform.rotation;
        _tmpNodeEuler.set(nodeRotation.x, nodeRotation.y, nodeRotation.z, "XYZ");
        _tmpNodeQuaternion.setFromEuler(_tmpNodeEuler);
        _tmpModuleEuler.set(moduleRotation.x, moduleRotation.y, moduleRotation.z, "XYZ");
        _tmpModuleQuaternion.setFromEuler(_tmpModuleEuler);
        _tmpWorldQuaternion.copy(_tmpModuleQuaternion).multiply(_tmpNodeQuaternion);
        _tmpWorldEuler.setFromQuaternion(_tmpWorldQuaternion);

        return {
            x: _tmpWorldEuler.x,
            y: _tmpWorldEuler.y,
            z: _tmpWorldEuler.z,
        };
    }

    isCompatibleWith(other: NodeInstance) {
        return this.definition.compatibleWith.includes(other.definition.type);
    }
}

const _tmpLocalPosition = new Vector3();
const _tmpRotationEuler = new Euler(0, 0, 0, "XYZ");
const _tmpNodeEuler = new Euler(0, 0, 0, "XYZ");
const _tmpModuleEuler = new Euler(0, 0, 0, "XYZ");
const _tmpWorldEuler = new Euler(0, 0, 0, "XYZ");
const _tmpNodeQuaternion = new Quaternion();
const _tmpModuleQuaternion = new Quaternion();
const _tmpWorldQuaternion = new Quaternion();
