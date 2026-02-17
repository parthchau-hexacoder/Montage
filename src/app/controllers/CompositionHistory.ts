import type { ConnectionRecord } from "../../core/composition/ConnectionGraph";
import { makeAutoObservable } from "mobx";
import { BuildingComposition } from "../../core/composition/BuildingComposition";
import { ModuleInstance } from "../../core/composition/ModuleInstance";
import { NodeInstance } from "../../core/composition/NodeInstance";
import type { NodeDefinition, Transform } from "../../core/composition/types";
import { ModuleManager } from "../../core/managers/ModuleManager";

type ModuleSnapshot = {
  instanceId: string;
  definitionId: string;
  transform: Transform;
  nodes: Array<{
    definition: NodeDefinition;
    occupied: boolean;
  }>;
};

type CompositionSnapshot = {
  modules: ModuleSnapshot[];
  connections: ConnectionRecord[];
  selectedModuleId: string | null;
};

const HISTORY_LIMIT = 100;

export class CompositionHistory {
  private undoStack: CompositionSnapshot[] = [];
  private redoStack: CompositionSnapshot[] = [];
  private interactionStartSnapshot: CompositionSnapshot | null = null;
  private composition: BuildingComposition;
  private moduleManager: ModuleManager;

  constructor(composition: BuildingComposition, moduleManager: ModuleManager) {
    this.composition = composition;
    this.moduleManager = moduleManager;
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get canUndo() {
    return this.undoStack.length > 0;
  }

  get canRedo() {
    return this.redoStack.length > 0;
  }

  recordChange<T>(action: () => T): T {
    const before = this.captureSnapshot();
    const result = action();
    this.trackStateChange(before);
    return result;
  }

  beginInteraction() {
    if (this.interactionStartSnapshot) return;
    this.interactionStartSnapshot = this.captureSnapshot();
  }

  endInteraction() {
    if (!this.interactionStartSnapshot) return;
    this.trackStateChange(this.interactionStartSnapshot);
    this.interactionStartSnapshot = null;
  }

  undo() {
    const previous = this.undoStack.pop();
    if (!previous) return;

    const current = this.captureSnapshot();
    this.redoStack.push(current);
    this.restoreSnapshot(previous);
  }

  redo() {
    const next = this.redoStack.pop();
    if (!next) return;

    const current = this.captureSnapshot();
    this.undoStack.push(current);
    this.restoreSnapshot(next);
  }

  private trackStateChange(before = this.captureSnapshot()) {
    const current = this.captureSnapshot();

    if (this.isSameSnapshot(before, current)) {
      return;
    }

    this.undoStack.push(before);
    if (this.undoStack.length > HISTORY_LIMIT) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }

  private captureSnapshot(): CompositionSnapshot {
    const modules = Array.from(this.composition.modules.values())
      .map((module) => ({
        instanceId: module.instanceId,
        definitionId: module.definition.id,
        transform: {
          position: { ...module.transform.position },
          rotation: { ...module.transform.rotation },
        },
        nodes: module.nodes.map((node) => ({
          definition: {
            id: node.definition.id,
            type: node.definition.type,
            position: { ...node.definition.position },
            rotation: { ...node.definition.rotation },
            compatibleWith: [...node.definition.compatibleWith],
          },
          occupied: node.occupied,
        })),
      }))
      .sort((a, b) => a.instanceId.localeCompare(b.instanceId));

    return {
      modules,
      connections: this.composition.graph.connections.map((connection) => ({
        ...connection,
      })),
      selectedModuleId: this.composition.selectedModuleId,
    };
  }

  private restoreSnapshot(snapshot: CompositionSnapshot) {
    const definitions = new Map(
      this.moduleManager.getDefinitions().map((definition) => [definition.id, definition])
    );
    const restoredModules: ModuleInstance[] = [];

    snapshot.modules.forEach((moduleSnapshot) => {
      const definition = definitions.get(moduleSnapshot.definitionId);
      if (!definition) return;

      const module = new ModuleInstance(definition);
      (module as unknown as { instanceId: string }).instanceId = moduleSnapshot.instanceId;

      module.setPosition(
        moduleSnapshot.transform.position.x,
        moduleSnapshot.transform.position.y,
        moduleSnapshot.transform.position.z
      );
      module.setRotation(
        moduleSnapshot.transform.rotation.x,
        moduleSnapshot.transform.rotation.y,
        moduleSnapshot.transform.rotation.z
      );

      module.nodes = moduleSnapshot.nodes.map((nodeSnapshot) => {
        const node = new NodeInstance(
          {
            ...nodeSnapshot.definition,
            position: { ...nodeSnapshot.definition.position },
            rotation: { ...nodeSnapshot.definition.rotation },
            compatibleWith: [...nodeSnapshot.definition.compatibleWith],
          },
          module
        );

        node.occupied = nodeSnapshot.occupied;

        return node;
      });

      restoredModules.push(module);
    });

    this.moduleManager.replaceModules(restoredModules);

    this.composition.graph.replaceConnections(
      snapshot.connections.map((connection) => ({
        ...connection,
      }))
    );
    this.composition.setSelectedModule(snapshot.selectedModuleId);
  }

  private isSameSnapshot(a: CompositionSnapshot, b: CompositionSnapshot) {
    return JSON.stringify(a) === JSON.stringify(b);
  }
}
