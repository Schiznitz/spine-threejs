/******************************************************************************
 * Spine Runtimes License Agreement
 * Last updated January 1, 2020. Replaces all prior versions.
 *
 * Copyright (c) 2013-2020, Esoteric Software LLC
 *
 * Integration of the Spine Runtimes into software or otherwise creating
 * derivative works of the Spine Runtimes is permitted under the terms and
 * conditions of Section 2 of the Spine Editor License Agreement:
 * http://esotericsoftware.com/spine-editor-license
 *
 * Otherwise, it is permitted to integrate the Spine Runtimes into software
 * or otherwise create derivative works of the Spine Runtimes (collectively,
 * "Products"), provided that each user of the Products must obtain their own
 * Spine Editor license and redistribution of the Products in any form must
 * include this license and copyright notice.
 *
 * THE SPINE RUNTIMES ARE PROVIDED BY ESOTERIC SOFTWARE LLC "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL ESOTERIC SOFTWARE LLC BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES,
 * BUSINESS INTERRUPTION, OR LOSS OF USE, DATA, OR PROFITS) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THE SPINE RUNTIMES, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *****************************************************************************/
import { AnimationState, AnimationStateData, ClippingAttachment, Color, MeshAttachment, RegionAttachment, Skeleton, SkeletonClipping, Utils, Vector2 } from "@esotericsoftware/spine-core";
import { MeshBatcher } from "./MeshBatcher";
import { DoubleSide, Object3D, ShaderMaterial } from "three";
export class SkeletonMeshMaterial extends ShaderMaterial {
    constructor(customizer) {
        let vertexShader = `
			attribute vec4 color;
			varying vec2 vUv;
			varying vec4 vColor;
			void main() {
				vUv = uv;
				vColor = color;
				gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);
			}
		`;
        let fragmentShader = `
			uniform sampler2D map;
			varying vec2 vUv;
			varying vec4 vColor;
			void main(void) {
				gl_FragColor = texture2D(map, vUv)*vColor;
			}
		`;
        let parameters = {
            uniforms: {
                map: { type: "t", value: null }
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            side: DoubleSide,
            transparent: true,
            depthWrite: false,
            alphaTest: 0.5
        };
        customizer(parameters);
        super(parameters);
    }
    ;
}
export class SkeletonMesh extends Object3D {
    constructor(skeletonData) {
        super();
        this.tempPos = new Vector2();
        this.tempUv = new Vector2();
        this.tempLight = new Color();
        this.tempDark = new Color();
        this.zOffset = 0.1;
        this.batches = new Array();
        this.nextBatchIndex = 0;
        this.clipper = new SkeletonClipping();
        this.vertices = Utils.newFloatArray(1024);
        this.tempColor = new Color();
        this.skeleton = new Skeleton(skeletonData);
        let animData = new AnimationStateData(skeletonData);
        this.state = new AnimationState(animData);
    }
    update(deltaTime) {
        let state = this.state;
        let skeleton = this.skeleton;
        state.update(deltaTime);
        state.apply(skeleton);
        skeleton.updateWorldTransform();
        this.updateGeometry();
    }
    dispose() {
        for (var i = 0; i < this.batches.length; i++) {
            this.batches[i].dispose();
        }
    }
    clearBatches() {
        for (var i = 0; i < this.batches.length; i++) {
            this.batches[i].clear();
            this.batches[i].visible = false;
        }
        this.nextBatchIndex = 0;
    }
    nextBatch() {
        if (this.batches.length == this.nextBatchIndex) {
            let batch = new MeshBatcher();
            this.add(batch);
            this.batches.push(batch);
        }
        let batch = this.batches[this.nextBatchIndex++];
        batch.visible = true;
        return batch;
    }
    updateGeometry() {
        this.clearBatches();
        let tempPos = this.tempPos;
        let tempUv = this.tempUv;
        let tempLight = this.tempLight;
        let tempDark = this.tempDark;
        var numVertices = 0;
        var verticesLength = 0;
        var indicesLength = 0;
        let blendMode = null;
        let clipper = this.clipper;
        let vertices = this.vertices;
        let triangles = null;
        let uvs = null;
        let drawOrder = this.skeleton.drawOrder;
        let batch = this.nextBatch();
        batch.begin();
        let z = 0;
        let zOffset = this.zOffset;
        for (let i = 0, n = drawOrder.length; i < n; i++) {
            let vertexSize = clipper.isClipping() ? 2 : SkeletonMesh.VERTEX_SIZE;
            let slot = drawOrder[i];
            if (!slot.bone.active)
                continue;
            let attachment = slot.getAttachment();
            let attachmentColor = null;
            let texture = null;
            let numFloats = 0;
            if (attachment instanceof RegionAttachment) {
                let region = attachment;
                attachmentColor = region.color;
                vertices = this.vertices;
                numFloats = vertexSize * 4;
                region.computeWorldVertices(slot.bone, vertices, 0, vertexSize);
                triangles = SkeletonMesh.QUAD_TRIANGLES;
                uvs = region.uvs;
                texture = region.region.renderObject.page.texture;
            }
            else if (attachment instanceof MeshAttachment) {
                let mesh = attachment;
                attachmentColor = mesh.color;
                vertices = this.vertices;
                numFloats = (mesh.worldVerticesLength >> 1) * vertexSize;
                if (numFloats > vertices.length) {
                    vertices = this.vertices = Utils.newFloatArray(numFloats);
                }
                mesh.computeWorldVertices(slot, 0, mesh.worldVerticesLength, vertices, 0, vertexSize);
                triangles = mesh.triangles;
                uvs = mesh.uvs;
                texture = mesh.region.renderObject.page.texture;
            }
            else if (attachment instanceof ClippingAttachment) {
                let clip = (attachment);
                clipper.clipStart(slot, clip);
                continue;
            }
            else
                continue;
            if (texture != null) {
                let skeleton = slot.bone.skeleton;
                let skeletonColor = skeleton.color;
                let slotColor = slot.color;
                let alpha = skeletonColor.a * slotColor.a * attachmentColor.a;
                let color = this.tempColor;
                color.set(skeletonColor.r * slotColor.r * attachmentColor.r, skeletonColor.g * slotColor.g * attachmentColor.g, skeletonColor.b * slotColor.b * attachmentColor.b, alpha);
                let finalVertices;
                let finalVerticesLength;
                let finalIndices;
                let finalIndicesLength;
                if (clipper.isClipping()) {
                    clipper.clipTriangles(vertices, numFloats, triangles, triangles.length, uvs, color, null, false);
                    let clippedVertices = clipper.clippedVertices;
                    let clippedTriangles = clipper.clippedTriangles;
                    if (this.vertexEffect != null) {
                        let vertexEffect = this.vertexEffect;
                        let verts = clippedVertices;
                        for (let v = 0, n = clippedVertices.length; v < n; v += vertexSize) {
                            tempPos.x = verts[v];
                            tempPos.y = verts[v + 1];
                            tempLight.setFromColor(color);
                            tempDark.set(0, 0, 0, 0);
                            tempUv.x = verts[v + 6];
                            tempUv.y = verts[v + 7];
                            vertexEffect.transform(tempPos, tempUv, tempLight, tempDark);
                            verts[v] = tempPos.x;
                            verts[v + 1] = tempPos.y;
                            verts[v + 2] = tempLight.r;
                            verts[v + 3] = tempLight.g;
                            verts[v + 4] = tempLight.b;
                            verts[v + 5] = tempLight.a;
                            verts[v + 6] = tempUv.x;
                            verts[v + 7] = tempUv.y;
                        }
                    }
                    finalVertices = clippedVertices;
                    finalVerticesLength = clippedVertices.length;
                    finalIndices = clippedTriangles;
                    finalIndicesLength = clippedTriangles.length;
                }
                else {
                    let verts = vertices;
                    if (this.vertexEffect != null) {
                        let vertexEffect = this.vertexEffect;
                        for (let v = 0, u = 0, n = numFloats; v < n; v += vertexSize, u += 2) {
                            tempPos.x = verts[v];
                            tempPos.y = verts[v + 1];
                            tempLight.setFromColor(color);
                            tempDark.set(0, 0, 0, 0);
                            tempUv.x = uvs[u];
                            tempUv.y = uvs[u + 1];
                            vertexEffect.transform(tempPos, tempUv, tempLight, tempDark);
                            verts[v] = tempPos.x;
                            verts[v + 1] = tempPos.y;
                            verts[v + 2] = tempLight.r;
                            verts[v + 3] = tempLight.g;
                            verts[v + 4] = tempLight.b;
                            verts[v + 5] = tempLight.a;
                            verts[v + 6] = tempUv.x;
                            verts[v + 7] = tempUv.y;
                        }
                    }
                    else {
                        for (let v = 2, u = 0, n = numFloats; v < n; v += vertexSize, u += 2) {
                            verts[v] = color.r;
                            verts[v + 1] = color.g;
                            verts[v + 2] = color.b;
                            verts[v + 3] = color.a;
                            verts[v + 4] = uvs[u];
                            verts[v + 5] = uvs[u + 1];
                        }
                    }
                    finalVertices = vertices;
                    finalVerticesLength = numFloats;
                    finalIndices = triangles;
                    finalIndicesLength = triangles.length;
                }
                if (finalVerticesLength == 0 || finalIndicesLength == 0)
                    continue;
                // Start new batch if this one can't hold vertices/indices
                if (!batch.canBatch(finalVerticesLength, finalIndicesLength)) {
                    batch.end();
                    batch = this.nextBatch();
                    batch.begin();
                }
                const slotBlendMode = slot.data.blendMode;
                const slotTexture = texture.texture;
                const materialGroup = batch.findMaterialGroup(slotTexture, slotBlendMode);
                batch.addMaterialGroup(finalIndicesLength, materialGroup);
                batch.batch(finalVertices, finalVerticesLength, finalIndices, finalIndicesLength, z);
                z += zOffset;
            }
            clipper.clipEndWithSlot(slot);
        }
        clipper.clipEnd();
        batch.end();
    }
}
SkeletonMesh.QUAD_TRIANGLES = [0, 1, 2, 2, 3, 0];
SkeletonMesh.VERTEX_SIZE = 2 + 2 + 4;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2tlbGV0b25NZXNoLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL1NrZWxldG9uTWVzaC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OytFQTJCK0U7QUFFL0UsT0FBTyxFQUFFLGNBQWMsRUFBRSxrQkFBa0IsRUFBYSxrQkFBa0IsRUFBRSxLQUFLLEVBQUUsY0FBYyxFQUFtQixnQkFBZ0IsRUFBRSxRQUFRLEVBQUUsZ0JBQWdCLEVBQW9DLEtBQUssRUFBRSxPQUFPLEVBQWdCLE1BQU0sOEJBQThCLENBQUM7QUFDdlEsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUM1QyxPQUFPLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBRSxjQUFjLEVBQTRCLE1BQU0sT0FBTyxDQUFDO0FBT3ZGLE1BQU0sT0FBTyxvQkFBcUIsU0FBUSxjQUFjO0lBQ3ZELFlBQVksVUFBb0Q7UUFDL0QsSUFBSSxZQUFZLEdBQUc7Ozs7Ozs7OztHQVNsQixDQUFDO1FBQ0YsSUFBSSxjQUFjLEdBQUc7Ozs7Ozs7R0FPcEIsQ0FBQztRQUVGLElBQUksVUFBVSxHQUE2QjtZQUMxQyxRQUFRLEVBQUU7Z0JBQ1QsR0FBRyxFQUFFLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFTO2FBQ3RDO1lBQ0QsWUFBWSxFQUFFLFlBQVk7WUFDMUIsY0FBYyxFQUFFLGNBQWM7WUFDOUIsSUFBSSxFQUFFLFVBQVU7WUFDaEIsV0FBVyxFQUFFLElBQUk7WUFDakIsVUFBVSxFQUFFLEtBQUs7WUFDakIsU0FBUyxFQUFFLEdBQUc7U0FDZCxDQUFDO1FBQ0YsVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3ZCLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUNuQixDQUFDO0lBQUEsQ0FBQztDQUNGO0FBRUQsTUFBTSxPQUFPLFlBQWEsU0FBUSxRQUFRO0lBb0J6QyxZQUFZLFlBQTBC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