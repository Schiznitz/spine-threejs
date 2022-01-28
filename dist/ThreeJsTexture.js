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
import { BlendMode, Texture, TextureFilter, TextureWrap } from "@esotericsoftware/spine-core";
import { AdditiveBlending, ClampToEdgeWrapping, CustomBlending, LinearFilter, LinearMipMapLinearFilter, LinearMipMapNearestFilter, MirroredRepeatWrapping, MultiplyBlending, NearestFilter, NearestMipMapLinearFilter, NearestMipMapNearestFilter, NormalBlending, RepeatWrapping, Texture as THREETexture } from "three";
export class ThreeJsTexture extends Texture {
    constructor(image) {
        super(image);
        this.texture = new THREETexture(image);
        this.texture.flipY = false;
        this.texture.needsUpdate = true;
    }
    setFilters(minFilter, magFilter) {
        this.texture.minFilter = ThreeJsTexture.toThreeJsTextureFilter(minFilter);
        this.texture.magFilter = ThreeJsTexture.toThreeJsTextureFilter(magFilter);
    }
    setWraps(uWrap, vWrap) {
        this.texture.wrapS = ThreeJsTexture.toThreeJsTextureWrap(uWrap);
        this.texture.wrapT = ThreeJsTexture.toThreeJsTextureWrap(vWrap);
    }
    dispose() {
        this.texture.dispose();
    }
    static toThreeJsTextureFilter(filter) {
        if (filter === TextureFilter.Linear)
            return LinearFilter;
        else if (filter === TextureFilter.MipMap)
            return LinearMipMapLinearFilter; // also includes TextureFilter.MipMapLinearLinear
        else if (filter === TextureFilter.MipMapLinearNearest)
            return LinearMipMapNearestFilter;
        else if (filter === TextureFilter.MipMapNearestLinear)
            return NearestMipMapLinearFilter;
        else if (filter === TextureFilter.MipMapNearestNearest)
            return NearestMipMapNearestFilter;
        else if (filter === TextureFilter.Nearest)
            return NearestFilter;
        else
            throw new Error("Unknown texture filter: " + filter);
    }
    static toThreeJsTextureWrap(wrap) {
        if (wrap === TextureWrap.ClampToEdge)
            return ClampToEdgeWrapping;
        else if (wrap === TextureWrap.MirroredRepeat)
            return MirroredRepeatWrapping;
        else if (wrap === TextureWrap.Repeat)
            return RepeatWrapping;
        else
            throw new Error("Unknown texture wrap: " + wrap);
    }
    static toThreeJsBlending(blend) {
        if (blend === BlendMode.Normal)
            return NormalBlending;
        else if (blend === BlendMode.Additive)
            return AdditiveBlending;
        else if (blend === BlendMode.Multiply)
            return MultiplyBlending;
        else if (blend === BlendMode.Screen)
            return CustomBlending;
        else
            throw new Error("Unknown blendMode: " + blend);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVGhyZWVKc1RleHR1cmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvVGhyZWVKc1RleHR1cmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzsrRUEyQitFO0FBRS9FLE9BQU8sRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLGFBQWEsRUFBRSxXQUFXLEVBQUUsTUFBTSw4QkFBOEIsQ0FBQztBQUM5RixPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsbUJBQW1CLEVBQUUsY0FBYyxFQUFFLFlBQVksRUFBRSx3QkFBd0IsRUFBRSx5QkFBeUIsRUFBRSxzQkFBc0IsRUFBRSxnQkFBZ0IsRUFBRSxhQUFhLEVBQUUseUJBQXlCLEVBQUUsMEJBQTBCLEVBQUUsY0FBYyxFQUFFLGNBQWMsRUFBRSxPQUFPLElBQUksWUFBWSxFQUFFLE1BQU0sT0FBTyxDQUFDO0FBRTFULE1BQU0sT0FBTyxjQUFlLFNBQVEsT0FBTztJQUcxQyxZQUFZLEtBQXVCO1FBQ2xDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNiLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDdkMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBQzNCLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztJQUNqQyxDQUFDO0lBRUQsVUFBVSxDQUFDLFNBQXdCLEVBQUUsU0FBd0I7UUFDNUQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEdBQUcsY0FBYyxDQUFDLHNCQUFzQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzFFLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxHQUFHLGNBQWMsQ0FBQyxzQkFBc0IsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUMzRSxDQUFDO0lBRUQsUUFBUSxDQUFDLEtBQWtCLEVBQUUsS0FBa0I7UUFDOUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEdBQUcsY0FBYyxDQUFDLG9CQUFvQixDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2hFLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxHQUFHLGNBQWMsQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNqRSxDQUFDO0lBRUQsT0FBTztRQUNOLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDeEIsQ0FBQztJQUVELE1BQU0sQ0FBQyxzQkFBc0IsQ0FBQyxNQUFxQjtRQUNsRCxJQUFJLE1BQU0sS0FBSyxhQUFhLENBQUMsTUFBTTtZQUFFLE9BQU8sWUFBWSxDQUFDO2FBQ3BELElBQUksTUFBTSxLQUFLLGFBQWEsQ0FBQyxNQUFNO1lBQUUsT0FBTyx3QkFBd0IsQ0FBQyxDQUFDLGlEQUFpRDthQUN2SCxJQUFJLE1BQU0sS0FBSyxhQUFhLENBQUMsbUJBQW1CO1lBQUUsT0FBTyx5QkFBeUIsQ0FBQzthQUNuRixJQUFJLE1BQU0sS0FBSyxhQUFhLENBQUMsbUJBQW1CO1lBQUUsT0FBTyx5QkFBeUIsQ0FBQzthQUNuRixJQUFJLE1BQU0sS0FBSyxhQUFhLENBQUMsb0JBQW9CO1lBQUUsT0FBTywwQkFBMEIsQ0FBQzthQUNyRixJQUFJLE1BQU0sS0FBSyxhQUFhLENBQUMsT0FBTztZQUFFLE9BQU8sYUFBYSxDQUFDOztZQUMzRCxNQUFNLElBQUksS0FBSyxDQUFDLDBCQUEwQixHQUFHLE1BQU0sQ0FBQyxDQUFDO0lBQzNELENBQUM7SUFFRCxNQUFNLENBQUMsb0JBQW9CLENBQUMsSUFBaUI7UUFDNUMsSUFBSSxJQUFJLEtBQUssV0FBVyxDQUFDLFdBQVc7WUFBRSxPQUFPLG1CQUFtQixDQUFDO2FBQzVELElBQUksSUFBSSxLQUFLLFdBQVcsQ0FBQyxjQUFjO1lBQUUsT0FBTyxzQkFBc0IsQ0FBQzthQUN2RSxJQUFJLElBQUksS0FBSyxXQUFXLENBQUMsTUFBTTtZQUFFLE9BQU8sY0FBYyxDQUFDOztZQUN2RCxNQUFNLElBQUksS0FBSyxDQUFDLHdCQUF3QixHQUFHLElBQUksQ0FBQyxDQUFDO0lBQ3ZELENBQUM7SUFFRCxNQUFNLENBQUMsaUJBQWlCLENBQUMsS0FBZ0I7UUFDeEMsSUFBSSxLQUFLLEtBQUssU0FBUyxDQUFDLE1BQU07WUFBRSxPQUFPLGNBQWMsQ0FBQzthQUNqRCxJQUFJLEtBQUssS0FBSyxTQUFTLENBQUMsUUFBUTtZQUFFLE9BQU8sZ0JBQWdCLENBQUM7YUFDMUQsSUFBSSxLQUFLLEtBQUssU0FBUyxDQUFDLFFBQVE7WUFBRSxPQUFPLGdCQUFnQixDQUFDO2FBQzFELElBQUksS0FBSyxLQUFLLFNBQVMsQ0FBQyxNQUFNO1lBQUUsT0FBTyxjQUFjLENBQUM7O1lBQ3RELE1BQU0sSUFBSSxLQUFLLENBQUMscUJBQXFCLEdBQUcsS0FBSyxDQUFDLENBQUM7SUFDckQsQ0FBQztDQUNEIn0=