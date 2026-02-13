import { makeAutoObservable } from "mobx";
import { ModuleDefinition } from "./ModuleDefinition";
import type { NodeDefinition, NodeType, Transform } from "./types";
import { NodeInstance } from "./NodeInstance";
import type { Object3D } from "three";
import * as THREE from "three";

let idCounter = 0;

export class ModuleInstance {
    readonly instanceId: string;
    readonly definition: ModuleDefinition;
    nodes: NodeInstance[] = [];
    private nodesRegisteredFromScene = false;

    transform: Transform;

    constructor(definition: ModuleDefinition) {
        this.instanceId = `module_${idCounter++}`;
        this.definition = definition;

        this.transform = {
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
        };

        this.nodes = definition.nodes.map(
            (nodeDef) => new NodeInstance(nodeDef, this)
        );

        makeAutoObservable(this);
    }

    registerNodesFromScene(scene: Object3D) {
        if (this.nodesRegisteredFromScene) return;

        if (this.nodes.length > 0) {
            this.nodesRegisteredFromScene = true;
            return;
        }

        const nodeDefs = extractNodeDefinitions(scene);

        this.nodes = nodeDefs.map((nodeDef) => new NodeInstance(nodeDef, this));
        this.nodesRegisteredFromScene = true;
    }

    setPosition(x: number, y: number, z: number) {
        this.transform.position = { x, y, z };
    }

    setRotation(x: number, y: number, z: number) {
        this.transform.rotation = { x, y, z };
    }

    get metrics() {
        return this.definition.metrics;
    }

    get baseCost() {
        return this.definition.baseCost;
    }
}

const SUPPORTED_NODE_TYPES: readonly NodeType[] = ["WALL", "DOOR", "ROOF"];

function isNodeType(value: string): value is NodeType {
    return SUPPORTED_NODE_TYPES.includes(value as NodeType);
}

function parseNodeMarker(
    name: string
): { type: NodeType; id: string } | null {
    if (name.startsWith("NODE_")) {
        const parts = name.split("_");

        if (parts.length >= 3) {
            const typeToken = parts[1].toUpperCase();
            const type = isNodeType(typeToken) ? typeToken : "WALL";
            const id = parts.slice(2).join("_");

            if (id) {
                return { type, id };
            }
        }
    }

    const legacyMatch = /^Node(\d+)$/i.exec(name);

    if (legacyMatch) {
        return { type: "WALL", id: legacyMatch[1] };
    }

    return null;
}

function extractNodeDefinitions(scene: Object3D): NodeDefinition[] {
    const nodes: NodeDefinition[] = [];
    const idCounts = new Map<string, number>();
    const worldPos = new THREE.Vector3();
    const localPos = new THREE.Vector3();
    const worldQuat = new THREE.Quaternion();
    const worldEuler = new THREE.Euler(0, 0, 0, "XYZ");
    const localCenter = new THREE.Vector3();
    const objectBounds = new THREE.Box3();

    scene.updateWorldMatrix(true, true);

    scene.traverse((child) => {
        const marker = parseNodeMarker(child.name);

        if (!marker) return;

        getAnchorWorldPosition(child, worldPos, localCenter, objectBounds);
        localPos.copy(worldPos);
        scene.worldToLocal(localPos);

        child.getWorldQuaternion(worldQuat);
        worldEuler.setFromQuaternion(worldQuat);

        const seenCount = idCounts.get(marker.id) ?? 0;
        idCounts.set(marker.id, seenCount + 1);
        const uniqueId = seenCount === 0 ? marker.id : `${marker.id}_${seenCount}`;

        nodes.push({
            id: uniqueId,
            type: marker.type,
            position: {
                x: localPos.x,
                y: localPos.y,
                z: localPos.z,
            },
            rotation: {
                x: worldEuler.x,
                y: worldEuler.y,
                z: worldEuler.z,
            },
            compatibleWith: [marker.type],
        });
    });

    return nodes;
}

function getAnchorWorldPosition(
    object: Object3D,
    out: THREE.Vector3,
    localCenter: THREE.Vector3,
    objectBounds: THREE.Box3
) {
    const mesh = object as THREE.Mesh;

    if (mesh.isMesh && mesh.geometry) {
        if (!mesh.geometry.boundingBox) {
            mesh.geometry.computeBoundingBox();
        }

        if (mesh.geometry.boundingBox) {
            localCenter.copy(mesh.geometry.boundingBox.getCenter(localCenter));
            mesh.localToWorld(out.copy(localCenter));
            return;
        }
    }

    objectBounds.setFromObject(object);

    if (!objectBounds.isEmpty()) {
        objectBounds.getCenter(out);
        return;
    }

    object.getWorldPosition(out);
}
