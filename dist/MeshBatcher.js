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
import { SkeletonMeshMaterial } from "./SkeletonMesh";
import { BufferAttribute, BufferGeometry, CustomBlending, InterleavedBuffer, InterleavedBufferAttribute, Material, Mesh, NormalBlending, OneFactor, OneMinusSrcAlphaFactor, OneMinusSrcColorFactor, SrcAlphaFactor } from "three";
import { ThreeJsTexture } from "./ThreeJsTexture";
export class MeshBatcher extends Mesh {
    constructor(maxVertices = 10920, materialCustomizer = (parameters) => { }) {
        super();
        this.materialCustomizer = materialCustomizer;
        this.verticesLength = 0;
        this.indicesLength = 0;
        this.materialGroups = [];
        if (maxVertices > 10920)
            throw new Error("Can't have more than 10920 triangles per batch: " + maxVertices);
        let vertices = this.vertices = new Float32Array(maxVertices * MeshBatcher.VERTEX_SIZE);
        let indices = this.indices = new Uint16Array(maxVertices * 3);
        let geo = new BufferGeometry();
        let vertexBuffer = this.vertexBuffer = new InterleavedBuffer(vertices, MeshBatcher.VERTEX_SIZE);
        vertexBuffer.usage = WebGLRenderingContext.DYNAMIC_DRAW;
        geo.setAttribute("position", new InterleavedBufferAttribute(vertexBuffer, 3, 0, false));
        geo.setAttribute("color", new InterleavedBufferAttribute(vertexBuffer, 4, 3, false));
        geo.setAttribute("uv", new InterleavedBufferAttribute(vertexBuffer, 2, 7, false));
        geo.setIndex(new BufferAttribute(indices, 1));
        geo.getIndex().usage = WebGLRenderingContext.DYNAMIC_DRAW;
        geo.drawRange.start = 0;
        geo.drawRange.count = 0;
        this.geometry = geo;
        this.material = [new SkeletonMeshMaterial(materialCustomizer)];
    }
    dispose() {
        this.geometry.dispose();
        if (this.material instanceof Material)
            this.material.dispose();
        else if (this.material) {
            for (let i = 0; i < this.material.length; i++) {
                let material = this.material[i];
                if (material instanceof Material)
                    material.dispose();
            }
        }
    }
    clear() {
        let geo = this.geometry;
        geo.drawRange.start = 0;
        geo.drawRange.count = 0;
        geo.clearGroups();
        this.materialGroups = [];
        if (this.material instanceof Material) {
            const meshMaterial = this.material;
            meshMaterial.uniforms.map.value = null;
            meshMaterial.blending = NormalBlending;
        }
        else if (Array.isArray(this.material)) {
            for (let i = 0; i < this.material.length; i++) {
                const meshMaterial = this.material[i];
                meshMaterial.uniforms.map.value = null;
                meshMaterial.blending = NormalBlending;
            }
        }
        return this;
    }
    begin() {
        this.verticesLength = 0;
        this.indicesLength = 0;
    }
    canBatch(verticesLength, indicesLength) {
        if (this.indicesLength + indicesLength >= this.indices.byteLength / 2)
            return false;
        if (this.verticesLength + verticesLength >= this.vertices.byteLength / 2)
            return false;
        return true;
    }
    batch(vertices, verticesLength, indices, indicesLength, z = 0) {
        let indexStart = this.verticesLength / MeshBatcher.VERTEX_SIZE;
        let vertexBuffer = this.vertices;
        let i = this.verticesLength;
        let j = 0;
        for (; j < verticesLength;) {
            vertexBuffer[i++] = vertices[j++];
            vertexBuffer[i++] = vertices[j++];
            vertexBuffer[i++] = z;
            vertexBuffer[i++] = vertices[j++];
            vertexBuffer[i++] = vertices[j++];
            vertexBuffer[i++] = vertices[j++];
            vertexBuffer[i++] = vertices[j++];
            vertexBuffer[i++] = vertices[j++];
            vertexBuffer[i++] = vertices[j++];
        }
        this.verticesLength = i;
        let indicesArray = this.indices;
        for (i = this.indicesLength, j = 0; j < indicesLength; i++, j++)
            indicesArray[i] = indices[j] + indexStart;
        this.indicesLength += indicesLength;
    }
    end() {
        this.vertexBuffer.needsUpdate = this.verticesLength > 0;
        this.vertexBuffer.updateRange.offset = 0;
        this.vertexBuffer.updateRange.count = this.verticesLength;
        let geo = this.geometry;
        this.closeMaterialGroups();
        geo.getIndex().needsUpdate = this.indicesLength > 0;
        geo.getIndex().updateRange.offset = 0;
        geo.getIndex().updateRange.count = this.indicesLength;
        geo.drawRange.start = 0;
        geo.drawRange.count = this.indicesLength;
    }
    addMaterialGroup(indicesLength, materialGroup) {
        const currentGroup = this.materialGroups[this.materialGroups.length - 1];
        if (currentGroup === undefined || currentGroup[2] !== materialGroup) {
            this.materialGroups.push([this.indicesLength, indicesLength, materialGroup]);
        }
        else {
            currentGroup[1] += indicesLength;
        }
    }
    closeMaterialGroups() {
        const geometry = this.geometry;
        for (let i = 0; i < this.materialGroups.length; i++) {
            const [startIndex, count, materialGroup] = this.materialGroups[i];
            geometry.addGroup(startIndex, count, materialGroup);
        }
    }
    findMaterialGroup(slotTexture, slotBlendMode) {
        const blending = ThreeJsTexture.toThreeJsBlending(slotBlendMode);
        let group = -1;
        if (Array.isArray(this.material)) {
            for (let i = 0; i < this.material.length; i++) {
                const meshMaterial = this.material[i];
                if (meshMaterial.uniforms.map.value === null) {
                    updateMeshMaterial(meshMaterial, slotTexture, blending);
                    return i;
                }
                if (meshMaterial.uniforms.map.value === slotTexture && meshMaterial.blending === blending) {
                    return i;
                }
            }
            const meshMaterial = new SkeletonMeshMaterial(this.materialCustomizer);
            updateMeshMaterial(meshMaterial, slotTexture, blending);
            this.material.push(meshMaterial);
            group = this.material.length - 1;
        }
        else {
            throw new Error("MeshBatcher.material needs to be an array for geometry groups to work");
        }
        return group;
    }
}
MeshBatcher.VERTEX_SIZE = 9;
function updateMeshMaterial(meshMaterial, slotTexture, blending) {
    meshMaterial.uniforms.map.value = slotTexture;
    meshMaterial.blending = blending;
    meshMaterial.blendDst = blending === CustomBlending ? OneMinusSrcColorFactor : OneMinusSrcAlphaFactor;
    meshMaterial.blendSrc = blending === CustomBlending ? OneFactor : SrcAlphaFactor;
    meshMaterial.needsUpdate = true;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWVzaEJhdGNoZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvTWVzaEJhdGNoZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzsrRUEyQitFO0FBRS9FLE9BQU8sRUFBRSxvQkFBb0IsRUFBNEMsTUFBTSxnQkFBZ0IsQ0FBQztBQUNoRyxPQUFPLEVBQVksZUFBZSxFQUFFLGNBQWMsRUFBRSxjQUFjLEVBQUUsaUJBQWlCLEVBQUUsMEJBQTBCLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxjQUFjLEVBQUUsU0FBUyxFQUFFLHNCQUFzQixFQUFFLHNCQUFzQixFQUFFLGNBQWMsRUFBVyxNQUFNLE9BQU8sQ0FBQTtBQUNwUCxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sa0JBQWtCLENBQUM7QUFHbEQsTUFBTSxPQUFPLFdBQVksU0FBUSxJQUFJO0lBU3BDLFlBQVksY0FBc0IsS0FBSyxFQUFVLHFCQUErRCxDQUFDLFVBQVUsRUFBRSxFQUFFLEdBQUcsQ0FBQztRQUNsSSxLQUFLLEVBQUUsQ0FBQztRQUR3Qyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQWdFO1FBTDNILG1CQUFjLEdBQUcsQ0FBQyxDQUFDO1FBRW5CLGtCQUFhLEdBQUcsQ0FBQyxDQUFDO1FBQ2xCLG1CQUFjLEdBQStCLEVBQUUsQ0FBQztRQUl2RCxJQUFJLFdBQVcsR0FBRyxLQUFLO1lBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyxrREFBa0QsR0FBRyxXQUFXLENBQUMsQ0FBQztRQUMzRyxJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksWUFBWSxDQUFDLFdBQVcsR0FBRyxXQUFXLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDdkYsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLFdBQVcsQ0FBQyxXQUFXLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDOUQsSUFBSSxHQUFHLEdBQUcs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