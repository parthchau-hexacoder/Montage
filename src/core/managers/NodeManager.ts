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
}
