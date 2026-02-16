import * as THREE from "three";
import type { Bounds3, Vec3 } from "../composition/types";
import { ModuleInstance } from "../composition/ModuleInstance";

export function calculateModuleBoundingBox(
    module: ModuleInstance
): Bounds3 | null {
    if (!module.localBounds) {
        return null;
    }

    const { min, max } = module.localBounds;
    const corners = getCorners(min, max);
    const rotation = new THREE.Euler(
        module.transform.rotation.x,
        module.transform.rotation.y,
        module.transform.rotation.z,
        "XYZ"
    );
    const position = module.transform.position;
    const worldPoint = new THREE.Vector3();

    const worldMin: Vec3 = {
        x: Number.POSITIVE_INFINITY,
        y: Number.POSITIVE_INFINITY,
        z: Number.POSITIVE_INFINITY,
    };
    const worldMax: Vec3 = {
        x: Number.NEGATIVE_INFINITY,
        y: Number.NEGATIVE_INFINITY,
        z: Number.NEGATIVE_INFINITY,
    };

    for (const corner of corners) {
        worldPoint
            .set(corner.x, corner.y, corner.z)
            .applyEuler(rotation)
            .add(new THREE.Vector3(position.x, position.y, position.z));

        worldMin.x = Math.min(worldMin.x, worldPoint.x);
        worldMin.y = Math.min(worldMin.y, worldPoint.y);
        worldMin.z = Math.min(worldMin.z, worldPoint.z);
        worldMax.x = Math.max(worldMax.x, worldPoint.x);
        worldMax.y = Math.max(worldMax.y, worldPoint.y);
        worldMax.z = Math.max(worldMax.z, worldPoint.z);
    }

    return {
        min: worldMin,
        max: worldMax,
    };
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
    candidates: ModuleInstance[],
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

function getCorners(min: Vec3, max: Vec3): Vec3[] {
    return [
        { x: min.x, y: min.y, z: min.z },
        { x: min.x, y: min.y, z: max.z },
        { x: min.x, y: max.y, z: min.z },
        { x: min.x, y: max.y, z: max.z },
        { x: max.x, y: min.y, z: min.z },
        { x: max.x, y: min.y, z: max.z },
        { x: max.x, y: max.y, z: min.z },
        { x: max.x, y: max.y, z: max.z },
    ];
}
