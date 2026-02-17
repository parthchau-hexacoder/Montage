import * as THREE from "three";

const PLAN_FILL = "#ffffff";
const PLAN_OUTLINE = "#111111";
const PLAN_NODE = "#56cfe1";
const PLAN_DOOR = "#000000";

type NodeState = {
  freeNodeIds: Set<string>;
  enabled: boolean;
};

export function applyPlan2DStyle(scene: THREE.Object3D, state: NodeState) {
  scene.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh || !mesh.material || !mesh.geometry) return;

    const markerId = parseNodeMarkerIdInHierarchy(object);
    const kind = classifyPlanMesh(object, markerId);

    if (kind === "hidden") {
      mesh.visible = false;
      return;
    }

    mesh.visible = true;
    const materials = ensureLocalMaterials(mesh);
    const isFreeNode = markerId ? state.freeNodeIds.has(markerId) : false;
    const fillColor = getFillColor(kind, isFreeNode);

    materials.forEach((material) => {
      setFlatPlanMaterial(material, fillColor);
    });

    if (kind === "node" && isFreeNode) {
      setOutlineVisibility(mesh, false, true);
      setDashedOutlineColor(mesh, PLAN_NODE);
    } else {
      setOutlineVisibility(mesh, true, false);
      setSolidOutlineColor(mesh, PLAN_OUTLINE);
    }
  });
}

type PlanMeshKind = "node" | "door" | "default" | "hidden";

function classifyPlanMesh(
  object: THREE.Object3D,
  markerId: string | null
): PlanMeshKind {
  if (markerId) return "node";

  if (hasNameInHierarchy(object, /roof|ceiling/i)) {
    return "hidden";
  }

  if (hasNameInHierarchy(object, /door|doors/i)) {
    return "door";
  }

  return "default";
}

function getFillColor(kind: PlanMeshKind, isFreeNode: boolean): string {
  if (kind === "door") return PLAN_DOOR;
  if (kind === "node" && isFreeNode) return PLAN_NODE;
  return PLAN_FILL;
}

function hasNameInHierarchy(object: THREE.Object3D, pattern: RegExp): boolean {
  let current: THREE.Object3D | null = object;

  while (current) {
    if (pattern.test(current.name)) {
      return true;
    }

    current = current.parent;
  }

  return false;
}

function ensureLocalMaterials(mesh: THREE.Mesh): THREE.Material[] {
  if (!mesh.userData.__planLocalMaterials) {
    const materials = Array.isArray(mesh.material)
      ? mesh.material.map((material) => createPlanFillMaterial(material))
      : [createPlanFillMaterial(mesh.material)];

    mesh.material = Array.isArray(mesh.material) ? materials : materials[0];
    mesh.userData.__planLocalMaterials = true;
  }

  return Array.isArray(mesh.material) ? mesh.material : [mesh.material];
}

function setFlatPlanMaterial(material: THREE.Material, color: string) {
  const fillMaterial = material as THREE.MeshBasicMaterial;
  fillMaterial.color.set(color);
  fillMaterial.toneMapped = false;
}

function setOutlineVisibility(mesh: THREE.Mesh, solid: boolean, dashed: boolean) {
  const solidOutline = ensureSolidOutline(mesh);
  const dashedOutline = ensureDashedOutline(mesh);

  solidOutline.visible = solid;
  dashedOutline.visible = dashed;
}

function setSolidOutlineColor(mesh: THREE.Mesh, color: string) {
  const line = ensureSolidOutline(mesh);
  const material = line.material as THREE.LineBasicMaterial;
  material.color.set(color);
}

function setDashedOutlineColor(mesh: THREE.Mesh, color: string) {
  const line = ensureDashedOutline(mesh);
  const material = line.material as THREE.LineDashedMaterial;
  material.color.set(color);
}

function ensureSolidOutline(mesh: THREE.Mesh): THREE.LineSegments {
  if (!mesh.userData.__planSolidOutline) {
    const edges = new THREE.EdgesGeometry(mesh.geometry);
    const material = new THREE.LineBasicMaterial({ color: PLAN_OUTLINE });
    const outline = new THREE.LineSegments(edges, material);

    outline.renderOrder = 2;
    mesh.add(outline);
    mesh.userData.__planSolidOutline = outline;
  }

  return mesh.userData.__planSolidOutline as THREE.LineSegments;
}

function ensureDashedOutline(mesh: THREE.Mesh): THREE.LineSegments {
  if (!mesh.userData.__planDashedOutline) {
    const edges = new THREE.EdgesGeometry(mesh.geometry);
    const material = new THREE.LineDashedMaterial({
      color: PLAN_NODE,
      dashSize: 0.08,
      gapSize: 0.05,
    });
    const outline = new THREE.LineSegments(edges, material);

    outline.computeLineDistances();
    outline.renderOrder = 3;
    mesh.add(outline);
    mesh.userData.__planDashedOutline = outline;
  }

  return mesh.userData.__planDashedOutline as THREE.LineSegments;
}

export function parseNodeMarkerId(name: string): string | null {
  if (name.startsWith("Node")) {
    const parts = name.split("_");

    if (parts.length >= 2) {
      const hasType = parts.length >= 3;
      const id = hasType ? parts.slice(2).join("_") : parts.slice(1).join("_");
      return id || null;
    }
  }

  const legacyMatch = /^Node(\d+)$/i.exec(name);
  if (legacyMatch) {
    return legacyMatch[1];
  }

  return null;
}

function createPlanFillMaterial(source: THREE.Material): THREE.MeshBasicMaterial {
  const mat = source as THREE.Material & {
    side?: THREE.Side;
    transparent?: boolean;
    opacity?: number;
    alphaTest?: number;
    depthWrite?: boolean;
    depthTest?: boolean;
  };

  return new THREE.MeshBasicMaterial({
    color: PLAN_FILL,
    side: mat.side,
    transparent: mat.transparent,
    opacity: mat.opacity,
    alphaTest: mat.alphaTest,
    depthWrite: mat.depthWrite,
    depthTest: mat.depthTest,
    toneMapped: false,
  });
}

function parseNodeMarkerIdInHierarchy(object: THREE.Object3D): string | null {
  let current: THREE.Object3D | null = object;

  while (current) {
    const markerId = parseNodeMarkerId(current.name);
    if (markerId) return markerId;
    current = current.parent;
  }

  return null;
}
