import { NodeInstance } from "../composition/NodeInstance";
import type { Vec3 } from "../composition/types";
import { NodeManager } from "./NodeManager";
import { ModuleInstance } from "../composition/ModuleInstance";

const SNAP_THRESHOLD = 0.3;

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
        const dx = target.worldPosition.x - source.worldPosition.x;
        const dy = target.worldPosition.y - source.worldPosition.y;
        const dz = target.worldPosition.z - source.worldPosition.z;

        return {
            x: movingModule.transform.position.x + dx,
            y: movingModule.transform.position.y + dy,
            z: movingModule.transform.position.z + dz,
        };
    }

    private distance(a: Vec3, b: Vec3) {
        return Math.sqrt(
            (a.x - b.x) ** 2 +
            (a.y - b.y) ** 2 +
            (a.z - b.z) ** 2
        );
    }
}
