import * as THREE from 'three/webgpu';

// Shared gradient LUT — loaded once, referenced by all atlas materials.
// Mipmaps disabled: the atlas is 32px tall so mip generation would blur the color bands.
const tex = new THREE.TextureLoader().load('./models/atlas.webp');
tex.flipY = false; // GLTF UVs use top-left origin; TextureLoader defaults to bottom-left (flipY=true)
tex.generateMipmaps = false;
tex.minFilter = THREE.LinearFilter;
tex.magFilter = THREE.LinearFilter;
tex.colorSpace = 'srgb';

export const atlasTexture: THREE.Texture = tex;
