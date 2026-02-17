import { NodeInstance } from "../composition/NodeInstance";
import { NodeManager } from "./NodeManager";
import { ModuleInstance } from "../composition/ModuleInstance";
import { Euler, Quaternion, Vector3 } from "three";


export const SNAP_THRESHOLD = 0.3;
const SNAP_THRESHOLD_SQ = SNAP_THRESHOLD * SNAP_THRESHOLD;
const PARALLEL_DOT_TOLERANCE = 1e-2;

type RuntimeNode = {
    node: NodeInstance;
    position: Vector3;
    direction: Vector3;
};

export class SnapManager {
    private nodeManager: NodeManager;

    constructor(nodeManager: NodeManager) {
        this.nodeManager = nodeManager;
    }

    findSnapTarget(
        movingModule: ModuleInstance
    ): { source: NodeInstance; target: NodeInstance; distance: number } | null {
        const freeNodes = this.nodeManager.getAllFreeNodes();
        const moduleQuaternionCache = new Map<string, Quaternion>();
        const sourceRuntime: RuntimeNode[] = [];
        const targetRuntime: RuntimeNode[] = [];
        let bestMatch: { source: NodeInstance; target: NodeInstance } | null = null;
        let bestDistanceSq = Number.POSITIVE_INFINITY;

        for (const sourceNode of movingModule.nodes) {
            if (sourceNode.occupied) continue;
            sourceRuntime.push(
                this.buildRuntimeNode(sourceNode, moduleQuaternionCache)
            );
        }

        for (const targetNode of freeNodes) {
            if (targetNode.module === movingModule) continue;
            if (targetNode.occupied) continue;

            targetRuntime.push(
                this.buildRuntimeNode(targetNode, moduleQuaternionCache)
            );
        }

        for (const source of sourceRuntime) {
            for (const target of targetRuntime) {
                const dot = source.direction.dot(target.direction);
                const absDot = Math.abs(dot);

                // Strict parallel check: same or opposite direction only.
                if (Math.abs(1 - absDot) > PARALLEL_DOT_TOLERANCE) continue;

                const distSq = source.position.distanceToSquared(target.position);
                if (distSq >= SNAP_THRESHOLD_SQ || distSq >= bestDistanceSq) continue;

                bestDistanceSq = distSq;
                bestMatch = { source: source.node, target: target.node };
            }
        }

        if (!bestMatch) {
            return null;
        }

        return {
            ...bestMatch,
            distance: Math.sqrt(bestDistanceSq),
        };
    }

    computeSnapTransform(
        movingModule: ModuleInstance,
        source: NodeInstance,
        target: NodeInstance
    ) {
        const dx = target.worldPosition.x - source.worldPosition.x;
        const dy = target.worldPosition.y - source.worldPosition.y;
        const dz = target.worldPosition.z - source.worldPosition.z;

        return {
            x: movingModule.transform.position.x + dx,
            y: movingModule.transform.position.y + dy,
            z: movingModule.transform.position.z + dz,
        };
    }

    private buildRuntimeNode(
        node: NodeInstance,
        moduleQuaternionCache: Map<string, Quaternion>
    ): RuntimeNode {
        const position = new Vector3();
        const direction = new Vector3();
        const moduleQuaternion = this.getModuleQuaternion(
            node.module,
            moduleQuaternionCache
        );

        this.writeWorldNodePosition(node, moduleQuaternion, position);
        this.writeNodeDirection(node, moduleQuaternion, direction);

        return { node, position, direction };
    }

    private getModuleQuaternion(
        module: ModuleInstance,
        moduleQuaternionCache: Map<string, Quaternion>
    ): Quaternion {
        const cached = moduleQuaternionCache.get(module.instanceId);
        if (cached) return cached;

        const rotation = module.transform.rotation;
        const quaternion = new Quaternion().setFromEuler(
            new Euler(rotation.x, rotation.y, rotation.z, "XYZ")
        );

        moduleQuaternionCache.set(module.instanceId, quaternion);
        return quaternion;
    }

    private writeWorldNodePosition(
        node: NodeInstance,
        moduleQuaternion: Quaternion,
        out: Vector3
    ) {
        const local = node.definition.position;
        const modulePosition = node.module.transform.position;
        out.set(local.x, local.y, local.z)
            .applyQuaternion(moduleQuaternion)
            .add(
                _tmpModulePosition.set(
                    modulePosition.x,
                    modulePosition.y,
                    modulePosition.z
                )
            );
    }

    private writeNodeDirection(
        node: NodeInstance,
        moduleQuaternion: Quaternion,
        out: Vector3
    ) {
        const boundsDirection = this.writeNodeDirectionFromBounds(
            node,
            moduleQuaternion,
            out
        );

        if (boundsDirection) {
            return;
        }

        this.writeNodeDirectionFromRotation(node, moduleQuaternion, out);
    }

    private writeNodeDirectionFromBounds(
        node: NodeInstance,
        moduleQuaternion: Quaternion,
        out: Vector3
    ): boolean {
        const bounds = node.module.localBounds;

        if (!bounds) {
            return false;
        }

        const localPosition = node.definition.position;
        const distanceMinX = Math.abs(localPosition.x - bounds.min.x);
        const distanceMaxX = Math.abs(bounds.max.x - localPosition.x);
        const distanceMinZ = Math.abs(localPosition.z - bounds.min.z);
        const distanceMaxZ = Math.abs(bounds.max.z - localPosition.z);

        let axis: "minX" | "maxX" | "minZ" | "maxZ" = "minX";
        let minDistance = distanceMinX;

        if (distanceMaxX < minDistance) {
            minDistance = distanceMaxX;
            axis = "maxX";
        }
        if (distanceMinZ < minDistance) {
            minDistance = distanceMinZ;
            axis = "minZ";
        }
        if (distanceMaxZ < minDistance) {
            axis = "maxZ";
        }

        if (axis === "minX") out.set(-1, 0, 0);
        if (axis === "maxX") out.set(1, 0, 0);
        if (axis === "minZ") out.set(0, 0, -1);
        if (axis === "maxZ") out.set(0, 0, 1);

        out.applyQuaternion(moduleQuaternion).normalize();
        return true;
    }

    private writeNodeDirectionFromRotation(
        node: NodeInstance,
        moduleQuaternion: Quaternion,
        out: Vector3
    ) {
        const nodeRotation = node.definition.rotation;
        const nodeQuaternion = _tmpNodeQuaternion.setFromEuler(
            new Euler(nodeRotation.x, nodeRotation.y, nodeRotation.z, "XYZ")
        );
        _tmpWorldQuaternion.copy(moduleQuaternion).multiply(nodeQuaternion);
        out.set(0, 0, 1).applyQuaternion(_tmpWorldQuaternion).normalize();
    }
}

const _tmpModulePosition = new Vector3();
const _tmpNodeQuaternion = new Quaternion();
const _tmpWorldQuaternion = new Quaternion();
