import type { ModuleMetrics, NodeDefinition } from "./types";

export class ModuleDefinition {
    readonly id: string;
    readonly name: string;
    readonly glbPath: string;
    readonly metrics: ModuleMetrics;
    readonly nodes: NodeDefinition[];
    readonly baseCost: number;

    constructor(params: {
        id: string;
        name: string;
        glbPath: string;
        metrics: ModuleMetrics;
        nodes: NodeDefinition[];
        baseCost: number;
    }) {
        this.id = params.id;
        this.name = params.name;
        this.glbPath = params.glbPath;
        this.metrics = params.metrics;
        this.nodes = params.nodes;
        this.baseCost = params.baseCost;
    }
}
