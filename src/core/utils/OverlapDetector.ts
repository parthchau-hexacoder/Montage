import type { Bounds3 } from "../composition/types";
import { ModuleInstance } from "../composition/ModuleInstance";

export function calculateModuleBoundingBox(
    module: ModuleInstance
): Bounds3 | null {
    return module.worldBounds;
}

export function doBoundingBoxesOverlap(
    a: Bounds3,
    b: Bounds3,
    epsilon = 0
): boolean {
    return (
        a.min.x < b.max.x - epsilon &&
        a.max.x > b.min.x + epsilon &&
        a.min.y < b.max.y - epsilon &&
        a.max.y > b.min.y + epsilon &&
        a.min.z < b.max.z - epsilon &&
        a.max.z > b.min.z + epsilon
    );
}

export function findOverlappingModules(
    module: ModuleInstance,
    candidates: Iterable<ModuleInstance>,
    epsilon = 0
): ModuleInstance[] {
    const moduleBounds = calculateModuleBoundingBox(module);
    if (!moduleBounds) {
        return [];
    }

    const overlapping: ModuleInstance[] = [];

    for (const candidate of candidates) {
        if (candidate.instanceId === module.instanceId) continue;

        const candidateBounds = calculateModuleBoundingBox(candidate);
        if (!candidateBounds) continue;

        if (doBoundingBoxesOverlap(moduleBounds, candidateBounds, epsilon)) {
            overlapping.push(candidate);
        }
    }

    return overlapping;
}

export function hasBlockingOverlap(
    module: ModuleInstance,
    candidates: Iterable<ModuleInstance>,
    epsilon = 0,
    ignoreModuleId?: string
): boolean {
    const moduleBounds = calculateModuleBoundingBox(module);
    if (!moduleBounds) {
        return false;
    }

    for (const candidate of candidates) {
        if (candidate.instanceId === module.instanceId) continue;
        if (ignoreModuleId && candidate.instanceId === ignoreModuleId) continue;

        const candidateBounds = calculateModuleBoundingBox(candidate);
        if (!candidateBounds) continue;

        if (doBoundingBoxesOverlap(moduleBounds, candidateBounds, epsilon)) {
            return true;
        }
    }

    return false;
}
