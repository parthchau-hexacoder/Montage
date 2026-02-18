import { BuildingComposition } from "../composition/BuildingComposition";
import { NodeInstance } from "../composition/NodeInstance";

export class NodeManager {
    private composition: BuildingComposition;

    constructor(composition: BuildingComposition) {
        this.composition = composition;
    }

    getAllModules() {
        return Array.from(this.composition.modules.values());
    }

    getAllNodes(): NodeInstance[] {
        const nodes: NodeInstance[] = [];

        this.composition.modules.forEach((module) => {
            module.nodes.forEach((node) => {
                nodes.push(node);
            });
        });

        return nodes;
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

    markOccupied(a: NodeInstance, b: NodeInstance): boolean {
        if (a === b) {
            return false;
        }

        if (a.module.instanceId === b.module.instanceId) {
            return false;
        }

        if (a.occupied || b.occupied) {
            return false;
        }

        const alreadyConnected = this.composition.graph.connections.some(
            (connection) =>
                (connection.fromModuleId === a.module.instanceId &&
                    connection.fromNodeId === a.definition.id &&
                    connection.toModuleId === b.module.instanceId &&
                    connection.toNodeId === b.definition.id) ||
                (connection.fromModuleId === b.module.instanceId &&
                    connection.fromNodeId === b.definition.id &&
                    connection.toModuleId === a.module.instanceId &&
                    connection.toNodeId === a.definition.id)
        );

        if (alreadyConnected) {
            a.occupied = true;
            b.occupied = true;
            return false;
        }

        a.occupied = true;
        b.occupied = true;

        this.composition.graph.addConnection({
            fromModuleId: a.module.instanceId,
            fromNodeId: a.definition.id,
            toModuleId: b.module.instanceId,
            toNodeId: b.definition.id,
        });

        return true;
    }

    disjointModule(moduleId: string): Set<string> {
        const removed = this.composition.graph.removeConnectionsForModule(moduleId);
        const disconnectedModuleIds = new Set<string>();

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

            if (connection.fromModuleId !== moduleId) {
                disconnectedModuleIds.add(connection.fromModuleId);
            }
            if (connection.toModuleId !== moduleId) {
                disconnectedModuleIds.add(connection.toModuleId);
            }
        });

        return disconnectedModuleIds;
    }

    private findNode(moduleId: string, nodeId: string): NodeInstance | undefined {
        const module = this.composition.modules.get(moduleId);

        if (!module) return undefined;

        return module.nodes.find((node) => node.definition.id === nodeId);
    }
}
