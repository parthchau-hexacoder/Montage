import { BuildingComposition } from "../composition/BuildingComposition";
import { ModuleInstance } from "../composition/ModuleInstance";
import type { Bounds3 } from "../composition/types";
import {
    calculateModuleBoundingBox,
    hasBlockingOverlap as detectBlockingOverlap,
    findOverlappingModules,
} from "../utils/OverlapDetector";

export class ModuleOverlapManager {
    private composition: BuildingComposition;

    constructor(composition: BuildingComposition) {
        this.composition = composition;
    }

    calculateBoundingBox(module: ModuleInstance): Bounds3 | null {
        return calculateModuleBoundingBox(module);
    }

    getOverlappingModules(
        module: ModuleInstance,
        epsilon = 0
    ): ModuleInstance[] {
        return findOverlappingModules(
            module,
            this.composition.modules.values(),
            epsilon
        );
    }

    hasOverlappedWithOtherModule(
        module: ModuleInstance,
        epsilon = 0
    ): boolean {
        return detectBlockingOverlap(module, this.composition.modules.values(), epsilon);
    }

    hasBlockingOverlap(
        module: ModuleInstance,
        epsilon = 0,
        ignoreModuleId?: string
    ): boolean {
        return detectBlockingOverlap(
            module,
            this.composition.modules.values(),
            epsilon,
            ignoreModuleId
        );
    }
    resolveModuleOverlapByOffset(module: ModuleInstance) {
        const start = { ...module.transform.position };
        const spacing = this.getSuggestedOffsetSpacing(module);

        for (let attempt = 0; attempt < NEW_MODULE_OFFSET_TRIES; attempt++) {
            if (!this.isModuleBlockedByOverlapOrStacking(module)) {
                return;
            }

            const index = attempt + 1;
            module.setPosition(start.x + spacing * index, start.y, start.z);
        }
    }

    private isModuleBlockedByOverlapOrStacking(module: ModuleInstance) {
        if (this.hasOverlappedWithOtherModule(module)) {
            return true;
        }

        const tolerance = 0.01;

        return Array.from(this.composition.modules.values()).some((other) => {
            if (other.instanceId === module.instanceId) {
                return false;
            }

            const dx = Math.abs(other.transform.position.x - module.transform.position.x);
            const dy = Math.abs(other.transform.position.y - module.transform.position.y);
            const dz = Math.abs(other.transform.position.z - module.transform.position.z);

            return dx < tolerance && dy < tolerance && dz < tolerance;
        });
    }

    private getSuggestedOffsetSpacing(module: ModuleInstance) {
        const bounds = this.calculateBoundingBox(module);
        if (!bounds) {
            return NEW_MODULE_OFFSET_STEP;
        }

        const width = bounds.max.x - bounds.min.x;
        const depth = bounds.max.z - bounds.min.z;

        return Math.max(width, depth, NEW_MODULE_OFFSET_STEP) + NEW_MODULE_OFFSET_STEP;
    }
}

const NEW_MODULE_OFFSET_STEP = 0.5;
const NEW_MODULE_OFFSET_TRIES = 80;
