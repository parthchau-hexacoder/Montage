import { NodeInstance } from "../composition/NodeInstance";
import { NodeManager } from "./NodeManager";
import { ModuleInstance } from "../composition/ModuleInstance";

export const SNAP_THRESHOLD = 0.3;
const SNAP_THRESHOLD_SQ = SNAP_THRESHOLD * SNAP_THRESHOLD;

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

    findSnapTarget(
        movingModule: ModuleInstance,
        excludeModuleIds?: Set<string>
    ): SnapTarget | null {
        return this.findSnapTargets(movingModule, excludeModuleIds)[0] ?? null;
    }

    findSnapTargets(
        movingModule: ModuleInstance,
        excludeModuleIds?: Set<string>
    ): SnapTarget[] {
        const candidates: Array<SnapTarget> = [];
        const movingBounds = movingModule.worldBounds;
        const allModules = this.nodeManager.getAllModules(); 

        for (const targetModule of allModules) {
            if (targetModule === movingModule) continue;
            if (excludeModuleIds?.has(targetModule.instanceId)) continue;

            if (movingBounds && targetModule.worldBounds) {
                const minX = targetModule.worldBounds.min.x - SNAP_THRESHOLD;
                const maxX = targetModule.worldBounds.max.x + SNAP_THRESHOLD;
                const minZ = targetModule.worldBounds.min.z - SNAP_THRESHOLD;
                const maxZ = targetModule.worldBounds.max.z + SNAP_THRESHOLD;

                const mMinX = movingBounds.min.x;
                const mMaxX = movingBounds.max.x;
                const mMinZ = movingBounds.min.z;
                const mMaxZ = movingBounds.max.z;

                if (
                    mMaxX < minX || mMinX > maxX ||
                    mMaxZ < minZ || mMinZ > maxZ
                ) {
                    continue;
                }
            }

            for (const sourceNode of movingModule.nodes) {
                if (sourceNode.occupied) continue;

                const sourceWorldPosition = sourceNode.worldPosition;

                for (const targetNode of targetModule.nodes) {
                    const targetWorldPosition = targetNode.worldPosition;
                    const dx = targetWorldPosition.x - sourceWorldPosition.x;
                    const dy = targetWorldPosition.y - sourceWorldPosition.y;
                    const dz = targetWorldPosition.z - sourceWorldPosition.z;
                    const distanceSq = dx * dx + dy * dy + dz * dz;

                    if (distanceSq > SNAP_THRESHOLD_SQ) {
                        continue;
                    }

                    candidates.push({
                        source: sourceNode,
                        target: targetNode,
                        distance: Math.sqrt(distanceSq),
                        sourceWorldPosition,
                        targetWorldPosition,
                    });
                }
            }
        }

        candidates.sort((a, b) => a.distance - b.distance);
        return candidates;
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

}
