import { NodeInstance } from "../composition/NodeInstance";
import { NodeManager } from "./NodeManager";
import { ModuleInstance } from "../composition/ModuleInstance";
import { Euler, Quaternion, Vector3 } from "three";


export const SNAP_THRESHOLD = 0.45;
const SNAP_THRESHOLD_SQ = SNAP_THRESHOLD * SNAP_THRESHOLD;
const PARALLEL_DOT_TOLERANCE = 0.2;
const MIN_FACING_DOT = -(1 - PARALLEL_DOT_TOLERANCE);

type RuntimeNode = {
    node: NodeInstance;
    position: Vector3;
    direction: Vector3;
};

type WorldPoint = {
    x: number;
    y: number;
    z: number;
};

export type SnapTarget = {
    source: NodeInstance;
    target: NodeInstance;
    distance: number;
    sourceWorldPosition: WorldPoint;
    targetWorldPosition: WorldPoint;
};

export class SnapManager {
    private nodeManager: NodeManager;

    constructor(nodeManager: NodeManager) {
        this.nodeManager = nodeManager;
    }

    findSnapTarget(movingModule: ModuleInstance): SnapTarget | null {
        return this.findSnapTargets(movingModule)[0] ?? null;
    }

    findSnapTargets(movingModule: ModuleInstance): SnapTarget[] {
        const freeNodes = this.nodeManager.getAllFreeNodes();
        const moduleQuaternionCache = new Map<string, Quaternion>();
        const sourceRuntime: RuntimeNode[] = [];
        const targetRuntime: RuntimeNode[] = [];
        const candidates: Array<{
            source: RuntimeNode;
            target: RuntimeNode;
            distanceSq: number;
        }> = [];

        for (const sourceNode of movingModule.nodes) {
            if (sourceNode.occupied) continue;
            sourceRuntime.push(
                ...this.buildRuntimeNodes(sourceNode, moduleQuaternionCache)
            );
        }

        for (const targetNode of freeNodes) {
            if (targetNode.module === movingModule) continue;
            if (targetNode.occupied) continue;

            targetRuntime.push(
                ...this.buildRuntimeNodes(targetNode, moduleQuaternionCache)
            );
        }

        for (const source of sourceRuntime) {
            for (const target of targetRuntime) {
                if (!this.areNodesCompatible(source.node, target.node)) {
                    continue;
                }

                if (!this.areDirectionsFacingEachOther(source, target)) {
                    continue;
                }

                const distSq = source.position.distanceToSquared(target.position);

                if (distSq > SNAP_THRESHOLD_SQ) {
                    continue;
                }

                candidates.push({ source, target, distanceSq: distSq });
            }
        }

        candidates.sort((a, b) => a.distanceSq - b.distanceSq);

        return candidates.map((candidate) => ({
            source: candidate.source.node,
            target: candidate.target.node,
            distance: Math.sqrt(candidate.distanceSq),
            sourceWorldPosition: {
                x: candidate.source.position.x,
                y: candidate.source.position.y,
                z: candidate.source.position.z,
            },
            targetWorldPosition: {
                x: candidate.target.position.x,
                y: candidate.target.position.y,
                z: candidate.target.position.z,
            },
        }));
    }

    computeSnapTransform(
        movingModule: ModuleInstance,
        sourceWorldPosition: WorldPoint,
        targetWorldPosition: WorldPoint
    ) {
        const dx = targetWorldPosition.x - sourceWorldPosition.x;
        const dy = targetWorldPosition.y - sourceWorldPosition.y;
        const dz = targetWorldPosition.z - sourceWorldPosition.z;

        return {
            x: movingModule.transform.position.x + dx,
            y: movingModule.transform.position.y + dy,
            z: movingModule.transform.position.z + dz,
        };
    }

    private buildRuntimeNodes(
        node: NodeInstance,
        moduleQuaternionCache: Map<string, Quaternion>
    ): RuntimeNode[] {
        const moduleQuaternion = this.getModuleQuaternion(
            node.module,
            moduleQuaternionCache
        );
        const runtimeNode = this.buildRuntimeNode(node, moduleQuaternion);
        const variants: RuntimeNode[] = [runtimeNode];

        if (!this.shouldExpandAmbiguousNode(node)) {
            return variants;
        }

        const bounds = node.module.localBounds;
        if (!bounds) {
            return variants;
        }

        const local = node.definition.position;
        const faces: Array<{ x: number; z: number; dx: number; dz: number }> = [
            { x: bounds.min.x, z: local.z, dx: -1, dz: 0 },
            { x: bounds.max.x, z: local.z, dx: 1, dz: 0 },
            { x: local.x, z: bounds.min.z, dx: 0, dz: -1 },
            { x: local.x, z: bounds.max.z, dx: 0, dz: 1 },
        ];

        for (const face of faces) {
            const position = new Vector3(face.x, local.y, face.z)
                .applyQuaternion(moduleQuaternion)
                .add(
                    _tmpModulePosition.set(
                        node.module.transform.position.x,
                        node.module.transform.position.y,
                        node.module.transform.position.z
                    )
                );
            const direction = new Vector3(face.dx, 0, face.dz)
                .applyQuaternion(moduleQuaternion)
                .normalize();
            variants.push({ node, position, direction });
        }

        return variants;
    }

    private buildRuntimeNode(
        node: NodeInstance,
        moduleQuaternion: Quaternion
    ): RuntimeNode {
        const position = new Vector3();
        const direction = new Vector3();

        this.writeWorldNodePosition(node, moduleQuaternion, position);
        this.writeNodeDirection(node, moduleQuaternion, direction);

        return { node, position, direction };
    }

    private shouldExpandAmbiguousNode(node: NodeInstance): boolean {
        const bounds = node.module.localBounds;
        if (!bounds) return false;

        const width = bounds.max.x - bounds.min.x;
        const depth = bounds.max.z - bounds.min.z;
        if (width <= 0 || depth <= 0) return false;

        const local = node.definition.position;
        const distToX = Math.min(
            Math.abs(local.x - bounds.min.x),
            Math.abs(bounds.max.x - local.x)
        );
        const distToZ = Math.min(
            Math.abs(local.z - bounds.min.z),
            Math.abs(bounds.max.z - local.z)
        );

        const faceEpsilonX = Math.max(width * 0.2, 0.05);
        const faceEpsilonZ = Math.max(depth * 0.2, 0.05);

        return distToX > faceEpsilonX && distToZ > faceEpsilonZ;
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
            minDistance = distanceMaxZ;
            axis = "maxZ";
        }

        const width = Math.max(bounds.max.x - bounds.min.x, 0);
        const depth = Math.max(bounds.max.z - bounds.min.z, 0);
        const faceEpsilonX = Math.max(width * 0.2, 0.05);
        const faceEpsilonZ = Math.max(depth * 0.2, 0.05);
        const isXAxis = axis === "minX" || axis === "maxX";
        const maxDistanceToFace = isXAxis ? faceEpsilonX : faceEpsilonZ;

        if (minDistance > maxDistanceToFace) {
            return false;
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

    private areNodesCompatible(a: NodeInstance, b: NodeInstance): boolean {
        return a.isCompatibleWith(b) && b.isCompatibleWith(a);
    }

    private areDirectionsFacingEachOther(
        source: RuntimeNode,
        target: RuntimeNode
    ): boolean {
        return source.direction.dot(target.direction) <= MIN_FACING_DOT;
    }
}

const _tmpModulePosition = new Vector3();
const _tmpNodeQuaternion = new Quaternion();
const _tmpWorldQuaternion = new Quaternion();
