import { makeAutoObservable } from "mobx";
import { ModuleDefinition } from "./ModuleDefinition";
import type { Bounds3, NodeDefinition, NodeType, Transform } from "./types";
import { NodeInstance } from "./NodeInstance";
import type { Object3D } from "three";
import * as THREE from "three";

let idCounter = 0;

export class ModuleInstance {
    readonly instanceId: string;
    readonly definition: ModuleDefinition;
    nodes: NodeInstance[] = [];
    private nodesRegisteredFromScene = false;
    localBounds: Bounds3 | null = null;
    worldBounds: Bounds3 | null = null;
    transformVersion = 0;

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

        makeAutoObservable(
            this,
            {
                instanceId: false,
                definition: false,
                worldBounds: false,
                transformVersion: false,
            },
            { autoBind: true }
        );
    }

    registerNodesFromScene(scene: Object3D) {
        if (this.nodesRegisteredFromScene) return;

        this.localBounds = extractSceneLocalBounds(scene);
        this.updateWorldBounds();

        if (this.nodes.length === 0) {
            const nodeDefs = extractNodeDefinitions(scene);
            this.nodes = nodeDefs.map((nodeDef) => new NodeInstance(nodeDef, this));
        }

        this.nodesRegisteredFromScene = true;
    }

    setPosition(x: number, y: number, z: number) {
        const position = this.transform.position;

        if (position.x === x && position.y === y && position.z === z) {
            return;
        }

        position.x = x;
        position.y = y;
        position.z = z;
        this.transformVersion += 1;
        this.updateWorldBounds();
    }

    setRotation(x: number, y: number, z: number) {
        const rotation = this.transform.rotation;

        if (rotation.x === x && rotation.y === y && rotation.z === z) {
            return;
        }

        rotation.x = x;
        rotation.y = y;
        rotation.z = z;
        this.transformVersion += 1;
        this.updateWorldBounds();
    }

    get metrics() {
        return this.definition.metrics;
    }

    get baseCost() {
        return this.definition.baseCost;
    }

    get description() {
        return this.definition.description;
    }

    get designedBy() {
        return this.definition.designedBy;
    }

    get isPremium() {
        return this.definition.isPremium;
    }

    get areaObj() {
        return this.definition.areaObj;
    }

    get width() {
        return this.definition.width;
    }

    get length() {
        return this.definition.length;
    }

    get height() {
        return this.definition.height;
    }

    private updateWorldBounds() {
        if (!this.localBounds) {
            this.worldBounds = null;
            return;
        }

        const { min, max } = this.localBounds;
        const position = this.transform.position;
        const rotation = this.transform.rotation;

        _tmpEuler.set(rotation.x, rotation.y, rotation.z, "XYZ");
        _tmpQuaternion.setFromEuler(_tmpEuler);
        _tmpPosition.set(position.x, position.y, position.z);

        let minX = Number.POSITIVE_INFINITY;
        let minY = Number.POSITIVE_INFINITY;
        let minZ = Number.POSITIVE_INFINITY;
        let maxX = Number.NEGATIVE_INFINITY;
        let maxY = Number.NEGATIVE_INFINITY;
        let maxZ = Number.NEGATIVE_INFINITY;

        for (let xIndex = 0; xIndex < 2; xIndex++) {
            for (let yIndex = 0; yIndex < 2; yIndex++) {
                for (let zIndex = 0; zIndex < 2; zIndex++) {
                    _tmpCorner
                        .set(
                            xIndex === 0 ? min.x : max.x,
                            yIndex === 0 ? min.y : max.y,
                            zIndex === 0 ? min.z : max.z
                        )
                        .applyQuaternion(_tmpQuaternion)
                        .add(_tmpPosition);

                    if (_tmpCorner.x < minX) minX = _tmpCorner.x;
                    if (_tmpCorner.y < minY) minY = _tmpCorner.y;
                    if (_tmpCorner.z < minZ) minZ = _tmpCorner.z;
                    if (_tmpCorner.x > maxX) maxX = _tmpCorner.x;
                    if (_tmpCorner.y > maxY) maxY = _tmpCorner.y;
                    if (_tmpCorner.z > maxZ) maxZ = _tmpCorner.z;
                }
            }
        }

        if (!this.worldBounds) {
            this.worldBounds = {
                min: { x: minX, y: minY, z: minZ },
                max: { x: maxX, y: maxY, z: maxZ },
            };
            return;
        }

        this.worldBounds.min.x = minX;
        this.worldBounds.min.y = minY;
        this.worldBounds.min.z = minZ;
        this.worldBounds.max.x = maxX;
        this.worldBounds.max.y = maxY;
        this.worldBounds.max.z = maxZ;
    }
}

const _tmpEuler = new THREE.Euler(0, 0, 0, "XYZ");
const _tmpQuaternion = new THREE.Quaternion();
const _tmpPosition = new THREE.Vector3();
const _tmpCorner = new THREE.Vector3();

const SUPPORTED_NODE_TYPES: readonly NodeType[] = ["WALL", "DOOR", "ROOF"];

function isNodeType(value: string): value is NodeType {
    return SUPPORTED_NODE_TYPES.includes(value as NodeType);
}

function parseNodeMarker(
    name: string
): { type: NodeType; id: string } | null {
    if (name.startsWith("Node")) {
        const parts = name.split("_");

        if (parts.length >= 2) {
            const hasType = parts.length >= 3;
            const typeToken = hasType ? parts[1].toUpperCase() : "WALL";
            const type = isNodeType(typeToken) ? typeToken : "WALL";
            const id = hasType ? parts.slice(2).join("_") : parts.slice(1).join("_");

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

function extractSceneLocalBounds(scene: Object3D): Bounds3 | null {
    const sceneBounds = new THREE.Box3();

    scene.updateWorldMatrix(true, true);
    sceneBounds.setFromObject(scene);

    if (sceneBounds.isEmpty()) {
        return null;
    }

    return {
        min: {
            x: sceneBounds.min.x,
            y: sceneBounds.min.y,
            z: sceneBounds.min.z,
        },
        max: {
            x: sceneBounds.max.x,
            y: sceneBounds.max.y,
            z: sceneBounds.max.z,
        },
    };
}
