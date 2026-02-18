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
    distanceSq: number;
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
        const sourceNodes = movingModule.nodes.filter((node) => !node.occupied);

        if (sourceNodes.length === 0) {
            return candidates;
        }

        const sourceNodesWithPosition = sourceNodes.map((node) => ({
            node,
            worldPosition: node.worldPosition,
        }));

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

            const targetNodesWithPosition = targetModule.nodes
                .filter((node) => !node.occupied)
                .map((node) => ({
                    node,
                    worldPosition: node.worldPosition,
                }));

            if (targetNodesWithPosition.length === 0) {
                continue;
            }

            for (const source of sourceNodesWithPosition) {
                for (const target of targetNodesWithPosition) {
                    if (!source.node.isCompatibleWith(target.node)) continue;

                    const dx = target.worldPosition.x - source.worldPosition.x;
                    const dy = target.worldPosition.y - source.worldPosition.y;
                    const dz = target.worldPosition.z - source.worldPosition.z;
                    const distanceSq = dx * dx + dy * dy + dz * dz;

                    if (distanceSq > SNAP_THRESHOLD_SQ) continue;

                    candidates.push({
                        source: source.node,
                        target: target.node,
                        distanceSq,
                        sourceWorldPosition: source.worldPosition,
                        targetWorldPosition: target.worldPosition,
                    });
                }
            }
        }

        if (candidates.length > 1) {
            candidates.sort((a, b) => a.distanceSq - b.distanceSq);
        }

        return candidates;
    }

    computeSnapTransform(
        basePosition: WorldPoint,
        sourceWorldPosition: WorldPoint,
        targetWorldPosition: WorldPoint
    ) {
        const dx = targetWorldPosition.x - sourceWorldPosition.x;
        const dy = targetWorldPosition.y - sourceWorldPosition.y;
        const dz = targetWorldPosition.z - sourceWorldPosition.z;

        return {
            x: basePosition.x + dx,
            y: basePosition.y + dy,
            z: basePosition.z + dz,
        };
    }

}
