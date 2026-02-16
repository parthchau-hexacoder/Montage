import { NodeInstance } from "../composition/NodeInstance";
import type { Vec3 } from "../composition/types";
import { NodeManager } from "./NodeManager";
import { ModuleInstance } from "../composition/ModuleInstance";
import { Euler, Quaternion, Vector3 } from "three";
import {
    calculateModuleBoundingBox,
    doBoundingBoxesOverlap,
} from "../utils/OverlapDetector";

const SNAP_THRESHOLD = 0.3;
const SNAP_CLEARANCE = 0.02;
const PARALLEL_DOT_TOLERANCE = 1e-4;

export class SnapManager {
    private nodeManager: NodeManager;

    constructor(nodeManager: NodeManager) {
        this.nodeManager = nodeManager;
    }

    findSnapTarget(
        movingModule: ModuleInstance
    ): { source: NodeInstance; target: NodeInstance } | null {
        const freeNodes = this.nodeManager.getAllFreeNodes();
        let bestMatch: { source: NodeInstance; target: NodeInstance } | null = null;
        let bestDistance = Number.POSITIVE_INFINITY;

        for (const sourceNode of movingModule.nodes) {
            if (sourceNode.occupied) continue;

            for (const targetNode of freeNodes) {
                if (targetNode.module === movingModule) continue;
                if (targetNode.occupied) continue;
                if (!this.areNodesParallel(sourceNode, targetNode)) continue;

                const sourcePos = sourceNode.worldPosition;
                const targetPos = targetNode.worldPosition;
                const dist = this.distance(sourcePos, targetPos);

                if (dist < SNAP_THRESHOLD && dist < bestDistance) {
                    bestDistance = dist;
                    bestMatch = { source: sourceNode, target: targetNode };
                }
            }
        }

        return bestMatch;
    }

    computeSnapTransform(
        movingModule: ModuleInstance,
        source: NodeInstance,
        target: NodeInstance
    ) {
        const approach = this.normalize({
            x: source.worldPosition.x - target.worldPosition.x,
            y: source.worldPosition.y - target.worldPosition.y,
            z: source.worldPosition.z - target.worldPosition.z,
        });
        const dx = target.worldPosition.x - source.worldPosition.x;
        const dy = target.worldPosition.y - source.worldPosition.y;
        const dz = target.worldPosition.z - source.worldPosition.z;

        const snapped = {
            x: movingModule.transform.position.x + dx,
            y: movingModule.transform.position.y + dy,
            z: movingModule.transform.position.z + dz,
        };

        return this.applyNonOverlapOffset(
            movingModule,
            target.module,
            snapped,
            approach
        );
    }

    private distance(a: Vec3, b: Vec3) {
        return Math.sqrt(
            (a.x - b.x) ** 2 +
            (a.y - b.y) ** 2 +
            (a.z - b.z) ** 2
        );
    }

    private applyNonOverlapOffset(
        movingModule: ModuleInstance,
        targetModule: ModuleInstance,
        snapped: Vec3,
        approach: Vec3
    ): Vec3 {
        const original = { ...movingModule.transform.position };
        movingModule.setPosition(snapped.x, snapped.y, snapped.z);

        const movingBounds = calculateModuleBoundingBox(movingModule);
        const targetBounds = calculateModuleBoundingBox(targetModule);

        movingModule.setPosition(original.x, original.y, original.z);

        if (!movingBounds || !targetBounds) {
            return snapped;
        }

        if (!doBoundingBoxesOverlap(movingBounds, targetBounds)) {
            return snapped;
        }

        const overlapX =
            Math.min(movingBounds.max.x, targetBounds.max.x) -
            Math.max(movingBounds.min.x, targetBounds.min.x);
        const overlapZ =
            Math.min(movingBounds.max.z, targetBounds.max.z) -
            Math.max(movingBounds.min.z, targetBounds.min.z);

        const useXAxis = Math.abs(approach.x) >= Math.abs(approach.z);
        const offset = (useXAxis ? overlapX : overlapZ) + SNAP_CLEARANCE;

        if (offset <= 0) {
            return snapped;
        }

        if (useXAxis) {
            return {
                ...snapped,
                x: snapped.x + Math.sign(approach.x || 1) * offset,
            };
        }

        return {
            ...snapped,
            z: snapped.z + Math.sign(approach.z || 1) * offset,
        };
    }

    private normalize(v: Vec3): Vec3 {
        const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);

        if (len < 1e-6) {
            return { x: 1, y: 0, z: 0 };
        }

        return {
            x: v.x / len,
            y: v.y / len,
            z: v.z / len,
        };
    }

    private areNodesParallel(a: NodeInstance, b: NodeInstance): boolean {
        const dirA = this.getNodeDirection(a);
        const dirB = this.getNodeDirection(b);
        const dot = dirA.x * dirB.x + dirA.y * dirB.y + dirA.z * dirB.z;
        const absDot = Math.abs(dot);

        // Strict parallel check: same or opposite direction only.
        return Math.abs(1 - absDot) <= PARALLEL_DOT_TOLERANCE;
    }

    private getNodeDirection(node: NodeInstance): Vec3 {
        const boundsDirection = this.getNodeDirectionFromBounds(node);

        if (boundsDirection) {
            return boundsDirection;
        }

        return this.getNodeDirectionFromRotation(node);
    }

    private getNodeDirectionFromBounds(node: NodeInstance): Vec3 | null {
        const bounds = node.module.localBounds;

        if (!bounds) {
            return null;
        }

        const localPosition = node.definition.position;
        const distances = [
            { normal: new Vector3(-1, 0, 0), distance: Math.abs(localPosition.x - bounds.min.x) },
            { normal: new Vector3(1, 0, 0), distance: Math.abs(bounds.max.x - localPosition.x) },
            { normal: new Vector3(0, 0, -1), distance: Math.abs(localPosition.z - bounds.min.z) },
            { normal: new Vector3(0, 0, 1), distance: Math.abs(bounds.max.z - localPosition.z) },
        ];
        const closest = distances.reduce((best, item) =>
            item.distance < best.distance ? item : best
        );
        const moduleRotation = node.module.transform.rotation;
        const moduleQuaternion = new Quaternion().setFromEuler(
            new Euler(moduleRotation.x, moduleRotation.y, moduleRotation.z, "XYZ")
        );
        const worldNormal = closest.normal.applyQuaternion(moduleQuaternion).normalize();

        return {
            x: worldNormal.x,
            y: worldNormal.y,
            z: worldNormal.z,
        };
    }

    private getNodeDirectionFromRotation(node: NodeInstance): Vec3 {
        const nodeRotation = node.definition.rotation;
        const moduleRotation = node.module.transform.rotation;
        const nodeQuaternion = new Quaternion().setFromEuler(
            new Euler(nodeRotation.x, nodeRotation.y, nodeRotation.z, "XYZ")
        );
        const moduleQuaternion = new Quaternion().setFromEuler(
            new Euler(moduleRotation.x, moduleRotation.y, moduleRotation.z, "XYZ")
        );
        const worldQuaternion = moduleQuaternion.multiply(nodeQuaternion);
        const forward = new Vector3(0, 0, 1).applyQuaternion(worldQuaternion).normalize();

        return { x: forward.x, y: forward.y, z: forward.z };
    }
}
