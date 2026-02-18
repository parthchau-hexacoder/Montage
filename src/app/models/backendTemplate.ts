import type { BackendModule, BackendModuleImageTuple } from "./backendModule";

export type BackendTemplateImageTuple = [string, string];

export type BackendTemplateModulePlacement = {
  id: string;
  moduleId: number | string;
  position?: number[] | null;
  rotation?: number | number[] | { x?: number; y?: number; z?: number } | null;
  module?: BackendModule | null;
};

export type BackendTemplate = {
  id: string;
  fileName?: string | null;
  name: string;
  description?: string | null;
  price?: number | string | null;
  isTemplate?: boolean | null;
  status?: string | null;
  isDefault?: boolean | null;
  keyWords?: unknown[] | null;
  designedBy?: string | null;
  isPopular?: boolean | null;
  isPremium?: boolean | null;
  templateImage?: string | null;
  imageFile?: BackendTemplateImageTuple[] | BackendModuleImageTuple[] | null;
  noOfBathrooms?: number | string | null;
  noOfBedrooms?: number | string | null;
  size?: number | string | null;
  constructionCost?: {
    totalConstructionCost?: number | string | null;
  } | null;
  designData?: {
    modulesData?: BackendTemplateModulePlacement[] | null;
  } | null;
};
