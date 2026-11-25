# Technique assets and licenses

## Mannequin and rig

- Source: **Desk Break**, Shlomy Reshef (`shlomorsh/desk-break`).
- Source asset: `library/mannequin.blend` and its parametric mesh/rig.
- License: MIT, Copyright (c) 2026 Shlomy Reshef (parametric.co.il). The complete notice is preserved in `assets/technique/LICENSE-desk-break.txt`.
- PEACH modifications: matte porcelain/graphite material treatment, texture-free optimized GLB, custom exercise posing and animation, original gym equipment, lighting, camera and interaction layer. The source computer-mouse prop is hidden and unused.
- No Desk Break exercise clip is presented as a PEACH equipped exercise. All eight PEACH movement definitions are original to this integration.

## Three.js

- Three.js r180, GLTFLoader, RoomEnvironment and SkeletonUtils, bundled locally in `technique3d.js`.
- License: MIT. The complete notice is preserved in `assets/technique/LICENSE-three.txt`.
- No runtime CDN or third-party network service is used.

## Technique honesty

The visualization is an instructional 3D schematic, not a recording or digital representation of a human trainer. Exercise instructions and safety copy remain in the accessible DOM alongside the scene. The previous local SVG technique remains available as a fallback if WebGL or the model cannot load.
