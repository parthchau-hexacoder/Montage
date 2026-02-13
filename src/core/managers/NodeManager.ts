import { BuildingComposition } from "../composition/BuildingComposition";
import { NodeInstance } from "../composition/NodeInstance";

export class NodeManager {
    private composition: BuildingComposition;

    constructor(composition: BuildingComposition) {
        this.composition = composition;
    }

    getAllFreeNodes(): NodeInstance[] {
        const nodes: NodeInstance[] = [];

        this.composition.modules.forEach((module) => {
            module.nodes.forEach((node) => {
                if (!node.occupied) {
                    nodes.push(node);
                }
            });
        });

        return nodes;
    }

    markOccupied(a: NodeInstance, b: NodeInstance) {
        a.occupied = true;
        b.occupied = true;

        this.composition.graph.addConnection({
            fromModuleId: a.module.instanceId,
            fromNodeId: a.definition.id,
            toModuleId: b.module.instanceId,
            toNodeId: b.definition.id,
        });
    }

    disjointModule(moduleId: string) {
        const removed = this.composition.graph.removeConnectionsForModule(moduleId);

        removed.forEach((connection) => {
            const fromNode = this.findNode(
                connection.fromModuleId,
                connection.fromNodeId
            );
            const toNode = this.findNode(
                connection.toModuleId,
                connection.toNodeId
            );

            if (fromNode) fromNode.occupied = false;
            if (toNode) toNode.occupied = false;
        });
    }

    private findNode(moduleId: string, nodeId: string): NodeInstance | undefined {
        const module = this.composition.modules.get(moduleId);

        if (!module) return undefined;

        return module.nodes.find((node) => node.definition.id === nodeId);
    }
}
