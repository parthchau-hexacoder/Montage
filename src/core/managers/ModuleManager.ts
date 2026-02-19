import { reaction, type IReactionDisposer } from "mobx";
import { ModuleDefinition } from "../composition/ModuleDefinition";
import { ModuleInstance } from "../composition/ModuleInstance";
import { BuildingComposition } from "../composition/BuildingComposition";
import type { Bounds3 } from "../composition/types";
import { ModuleOverlapManager } from "./ModuleOverlapManager";

export class ModuleManager {
    private definitions: Map<string, ModuleDefinition> = new Map();
    private composition: BuildingComposition;
    private overlapManager: ModuleOverlapManager;
    private disposers = new Map<string, IReactionDisposer>();

    constructor(composition: BuildingComposition) {
        this.composition = composition;
        this.overlapManager = new ModuleOverlapManager(composition);
    }

    registerDefinition(def: ModuleDefinition) {
        this.definitions.set(def.id, def);
    }

    clearDefinitions() {
        this.definitions.clear();
    }

    createModule(typeId: string) {
        const def = this.definitions.get(typeId);
        if (!def) throw new Error("Module definition not found");

        const instance = new ModuleInstance(def);
        return this.addModuleInstance(instance, { enableOverlapResolution: true });
    }

    addModuleInstance(
        instance: ModuleInstance,
        options: { enableOverlapResolution?: boolean } = {}
    ) {
        const enableOverlapResolution = options.enableOverlapResolution ?? true;
        this.attachModule(instance, { enableOverlapResolution });
        return instance;
    }

    replaceModules(modules: ModuleInstance[]) {
        this.disposeAllModuleReactions();
        this.composition.modules.clear();

        modules.forEach((module) => {
            // History restore should preserve exact snapshot transforms.
            this.addModuleInstance(module, { enableOverlapResolution: false });
        });
    }

    removeModule(instanceId: string) {
        const disposer = this.disposers.get(instanceId);
        if (disposer) {
            disposer();
            this.disposers.delete(instanceId);
        }
        this.composition.removeModule(instanceId);
    }

    getDefinitions() {
        return Array.from(this.definitions.values());
    }

    calculateBoundingBox(module: ModuleInstance): Bounds3 | null {
        return this.overlapManager.calculateBoundingBox(module);
    }

    getOverlappingModules(
        module: ModuleInstance,
        epsilon = 0
    ): ModuleInstance[] {
        return this.overlapManager.getOverlappingModules(module, epsilon);
    }

    hasOverlappedWithOtherModule(
        module: ModuleInstance,
        epsilon = 0
    ): boolean {
        return this.overlapManager.hasOverlappedWithOtherModule(module, epsilon);
    }

    hasBlockingOverlap(
        module: ModuleInstance,
        epsilon = 0,
        ignoreModuleId?: string
    ): boolean {
        return this.overlapManager.hasBlockingOverlap(module, epsilon, ignoreModuleId);
    }

    private attachModule(
        instance: ModuleInstance,
        options: { enableOverlapResolution: boolean }
    ) {
        const existingDisposer = this.disposers.get(instance.instanceId);
        if (existingDisposer) {
            existingDisposer();
        }

        this.composition.addModule(instance);
        if (options.enableOverlapResolution) {
            this.disposers.set(
                instance.instanceId,
                this.bindModuleOverlapResolution(instance)
            );
            return;
        }

        this.disposers.delete(instance.instanceId);
    }

    private bindModuleOverlapResolution(instance: ModuleInstance): IReactionDisposer {
        return reaction(
            () => instance.localBounds,
            (bounds) => {
                if (bounds) {
                    this.overlapManager.resolveModuleOverlapByOffset(instance);
                }
            },
            { fireImmediately: true }
        );
    }

    private disposeAllModuleReactions() {
        this.disposers.forEach((disposer) => disposer());
        this.disposers.clear();
    }
}
