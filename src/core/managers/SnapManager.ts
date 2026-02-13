import { NodeInstance } from "../composition/NodeInstance";
import { NodeManager } from "./NodeManager";
import { ModuleInstance } from "../composition/ModuleInstance";

const SNAP_THRESHOLD = 2;

export class SnapManager {
    private nodeManager: NodeManager;

    constructor(nodeManager: NodeManager) {
        this.nodeManager = nodeManager;
    }

    findSnapTarget(
        movingModule: ModuleInstance
    ): { source: NodeInstance; target: NodeInstance } | null {
            const freeNodes = this.nodeManager.getAllFreeNodes();

            for (const sourceNode of movingModule.nodes) {
                if (sourceNode.occupied) continue;

                for (const targetNode of freeNodes) {
                    if (targetNode.module === movingModule) continue;
                    if (targetNode.occupied) continue;

                    if (!sourceNode.isCompatibleWith(targetNode)) continue;

                    const dist = this.distance(
                        sourceNode.worldPosition,
                        targetNode.worldPosition
                    );

                    if (dist < SNAP_THRESHOLD) {
                    return { source: sourceNode, target: targetNode };
                }
            }
        }

        return null;
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

    private distance(a: any, b: any) {
        return Math.sqrt(
            (a.x - b.x) ** 2 +
            (a.y - b.y) ** 2 +
            (a.z - b.z) ** 2
        );
    }
}
