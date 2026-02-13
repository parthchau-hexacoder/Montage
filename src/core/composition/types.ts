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

export type NodeType = "WALL" | "DOOR" | "ROOF";

export type NodeDefinition = {
  id: string;
  position: Vec3;
  rotation: Vec3;
  type: NodeType;
  compatibleWith: NodeType[];
};
    