import type { ModuleMetrics, NodeDefinition } from "./types";

type ModuleDefinitionParams = {
    id: string;
    name: string;
    glbPath: string;
    previewImage: string | null;
    metrics: ModuleMetrics;
    nodes: NodeDefinition[];
    baseCost: number;
};

type BackendModuleLike = {
    id: number | string;
    moduleBuildingId?: string | null;
    name: string;
    glbFile: string;
    moduleImage?: string | null;
    noOfBedrooms?: number | string | null;
    noOfBathrooms?: number | string | null;
    size?: number | string | null;
    price?: number | string | null;
};

export class ModuleDefinition {
    readonly id: string;
    readonly name: string;
    readonly glbPath: string;
    readonly previewImage: string | null;
    readonly metrics: ModuleMetrics;
    readonly nodes: NodeDefinition[];
    readonly baseCost: number;

    constructor(params: ModuleDefinitionParams | BackendModuleLike) {
        if (isBackendModuleLike(params)) {
            this.id = String(params.id);
            this.name = params.name;
            this.glbPath = params.glbFile;
            this.previewImage = params.moduleImage ?? null;
            this.metrics = {
                beds: toFiniteNumber(params.noOfBedrooms),
                baths: toFiniteNumber(params.noOfBathrooms),
                sqft: toFiniteNumber(params.size),
            };
            this.nodes = [];
            this.baseCost = toFiniteNumber(params.price);
            return;
        }

        this.id = params.id;
        this.name = params.name;
        this.glbPath = params.glbPath;
        this.previewImage = params.previewImage;
        this.metrics = params.metrics;
        this.nodes = params.nodes;
        this.baseCost = params.baseCost;
    }
}

function isBackendModuleLike(value: ModuleDefinitionParams | BackendModuleLike): value is BackendModuleLike {
    return "glbFile" in value;
}

function toFiniteNumber(value: unknown, fallback = 0): number {
    const numberValue =
        typeof value === "number" ? value : Number.parseFloat(String(value));

    return Number.isFinite(numberValue) ? numberValue : fallback;
}
