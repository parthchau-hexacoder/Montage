export type Vec3 = {
  x: number;
  y: number;
  z: number;
};

export type Transform = {
  position: Vec3;
  rotation: Vec3;
};

export type ModuleMetrics = {
  beds: number;
  baths: number;
  sqft: number;
};

export type NodeDefinition = {
  id: string;
  position: Vec3;
  type: string;
  compatibleWith: string[];
};
    