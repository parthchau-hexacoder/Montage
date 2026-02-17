import type { ModuleMetrics, NodeDefinition } from "./types";

type BackendModuleImageTuple = [string, string];

export type AreaBreakdown = {
    bathroom_tile_area?: string | null;
    exterior_accent_area?: string | null;
    exterior_finish_area?: string | null;
    kitchen_casework_area?: string | null;
    bathroom_casework_area?: string | null;
    kitchen_countertops_area?: string | null;
    kitchen_tile_finish_area?: string | null;
    interior_wall_finish_area?: string | null;
    interior_floor_finish_area?: string | null;
};

type BackendModuleLike = {
    id: number | string;
    moduleBuildingId?: string | null;
    name?: string | null;
    description?: string | null;
    fileName?: string | null;
    glbFile?: string | null;
    moduleImage?: string | null;
    images?: BackendModuleImageTuple[];
    noOfBedrooms?: number | string | null;
    noOfBathrooms?: number | string | null;
    size?: number | string | null;
    width?: number | string | null;
    length?: number | string | null;
    height?: number | string | null;
    price?: number | string | null;
    pricePerSqft?: number | string | null;
    unitType?: string | null;
    status?: string | null;
    moduleType?: { name?: string | null } | null;
    designedBy?: string | null;
    isPremium?: boolean | null;
    areaObj?: AreaBreakdown | null;
};

type ModuleDefinitionParams = {
    id: string;
    name: string;
    description: string;
    glbPath: string;
    previewImage: string | null;
    metrics: ModuleMetrics;
    nodes: NodeDefinition[];
    baseCost: number;
    backendId?: string | null;
    moduleBuildingId?: string | null;
    fileName?: string | null;
    unitType?: string | null;
    status?: string | null;
    pricePerSqft?: number;
    moduleTypeName?: string | null;
    designedBy?: string | null;
    isPremium?: boolean;
    areaObj?: AreaBreakdown | null;
    width?: number;
    length?: number;
    height?: string | null;
};

export class ModuleDefinition {
    readonly id: string;
    readonly backendId: string | null;
    readonly moduleBuildingId: string | null;
    readonly name: string;
    readonly description: string;
    readonly fileName: string | null;
    readonly glbPath: string;
    readonly previewImage: string | null;
    readonly metrics: ModuleMetrics;
    readonly nodes: NodeDefinition[];
    readonly baseCost: number;
    readonly pricePerSqft: number;
    readonly unitType: string | null;
    readonly status: string | null;
    readonly moduleTypeName: string | null;
    readonly designedBy: string | null;
    readonly isPremium: boolean;
    readonly areaObj: AreaBreakdown | null;
    readonly width: number;
    readonly length: number;
    readonly height: string | null;

    constructor(params: ModuleDefinitionParams | BackendModuleLike) {
        if (isModuleDefinitionParams(params)) {
            this.id = params.id;
            this.backendId = params.backendId ?? null;
            this.moduleBuildingId = params.moduleBuildingId ?? null;
            this.name = params.name;
            this.description = params.description;
            this.fileName = params.fileName ?? null;
            this.glbPath = params.glbPath;
            this.previewImage = params.previewImage;
            this.metrics = params.metrics;
            this.nodes = params.nodes;
            this.baseCost = params.baseCost;
            this.pricePerSqft = params.pricePerSqft ?? 0;
            this.unitType = params.unitType ?? null;
            this.status = params.status ?? null;
            this.moduleTypeName = params.moduleTypeName ?? null;
            this.designedBy = params.designedBy ?? null;
            this.isPremium = params.isPremium ?? false;
            this.areaObj = params.areaObj ?? null;
            this.width = params.width ?? 0;
            this.length = params.length ?? 0;
            this.height = params.height ?? null;
            return;
        }

        const moduleId =
            coerceNonEmptyString(params.moduleBuildingId) ??
            coerceNonEmptyString(params.id) ??
            "unknown-module";

        this.id = moduleId;
        this.backendId = coerceNonEmptyString(params.id);
        this.moduleBuildingId = coerceNonEmptyString(params.moduleBuildingId);
        this.name = coerceNonEmptyString(params.name) ?? moduleId;
        this.description = coerceNonEmptyString(params.description) ?? "";
        this.fileName = coerceNonEmptyString(params.fileName);
        this.glbPath = resolveGlbPath(params.glbFile, this.fileName);
        this.previewImage = resolvePreviewImage(params.moduleImage, params.images);
        this.metrics = {
            beds: toFiniteNumber(params.noOfBedrooms),
            baths: toFiniteNumber(params.noOfBathrooms),
            sqft: resolveSqft(params),
        };
        this.nodes = [];
        this.baseCost = firstFiniteNumber(params.price, params.pricePerSqft);
        this.pricePerSqft = toFiniteNumber(params.pricePerSqft);
        this.unitType = coerceNonEmptyString(params.unitType);
        this.status = coerceNonEmptyString(params.status);
        this.moduleTypeName = coerceNonEmptyString(params.moduleType?.name);
        this.designedBy = coerceNonEmptyString(params.designedBy);
        this.isPremium = !!params.isPremium;
        this.areaObj = params.areaObj ?? null;
        this.width = toFiniteNumber(params.width);
        this.length = toFiniteNumber(params.length);
        this.height = coerceNonEmptyString(params.height);
    }
}

function isModuleDefinitionParams(value: ModuleDefinitionParams | BackendModuleLike): value is ModuleDefinitionParams {
    return "glbPath" in value;
}

function toFiniteNumber(value: unknown, fallback = 0): number {
    if (value === null || value === undefined || value === "") {
        return fallback;
    }

    const numberValue =
        typeof value === "number" ? value : Number.parseFloat(String(value));

    return Number.isFinite(numberValue) ? numberValue : fallback;
}

function firstFiniteNumber(...values: unknown[]): number {
    for (const value of values) {
        const parsed = toFiniteNumber(value, Number.NaN);
        if (Number.isFinite(parsed)) {
            return parsed;
        }
    }

    return 0;
}

function coerceNonEmptyString(value: unknown): string | null {
    if (value === null || value === undefined) {
        return null;
    }

    const normalized = String(value).trim();
    return normalized.length > 0 ? normalized : null;
}

function resolveGlbPath(glbFile: unknown, fileName: unknown): string {
    const directPath = coerceNonEmptyString(glbFile);
    if (directPath) {
        return directPath;
    }

    const fileNamePath = coerceNonEmptyString(fileName);
    if (fileNamePath && /\.glb($|\?)/i.test(fileNamePath)) {
        return fileNamePath;
    }

    return "";
}

function resolvePreviewImage(
    moduleImage: unknown,
    images: BackendModuleImageTuple[] | undefined
): string | null {
    const directPreview = coerceNonEmptyString(moduleImage);
    if (directPreview) {
        return directPreview;
    }

    if (!Array.isArray(images)) {
        return null;
    }

    for (const imageTuple of images) {
        if (!Array.isArray(imageTuple) || imageTuple.length < 2) {
            continue;
        }

        const previewPath = coerceNonEmptyString(imageTuple[1]);
        if (previewPath) {
            return previewPath;
        }
    }

    return null;
}

function resolveSqft(module: BackendModuleLike): number {
    const explicitSqft = toFiniteNumber(module.size, Number.NaN);
    if (Number.isFinite(explicitSqft) && explicitSqft > 0) {
        return explicitSqft;
    }

    const width = toFiniteNumber(module.width, Number.NaN);
    const length = toFiniteNumber(module.length, Number.NaN);

    if (Number.isFinite(width) && Number.isFinite(length) && width > 0 && length > 0) {
        return width * length;
    }

    return 0;
}
