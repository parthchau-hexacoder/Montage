export type BackendModuleImageTuple = [string, string];

export type BackendModule = {
  id: number;
  moduleBuildingId: string;
  name: string;
  fileName: string;
  glbFile: string;
  moduleImage: string;
  images: BackendModuleImageTuple[];
  noOfBedrooms: number;
  noOfBathrooms: number;
  size: number;
  price: number;
  pricePerSqft: number;
  unitType: string;
  status: string;
};
