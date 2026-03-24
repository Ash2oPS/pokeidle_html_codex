Custom combat VFX assets live here.

The runtime auto-uses these files if they are present and loaded.
If a file is missing, the game keeps the current procedural VFX.

Supported paths:

- `assets/vfx-custom/projectiles/<type>/variant-0.png`
- `assets/vfx-custom/projectiles/<type>/variant-1.png`
- `assets/vfx-custom/projectiles/<type>/variant-2.png`
- `assets/vfx-custom/projectile-trails/<type>/stamp.png`
- `assets/vfx-custom/projectile-trails/<type>/stamp-<trailStampKind>.png`
- `assets/vfx-custom/lasers/<type>/beam.png`
- `assets/vfx-custom/lasers/<type>/beam-<beamPattern>.png`

Examples:

- `assets/vfx-custom/projectiles/electric/variant-0.png`
- `assets/vfx-custom/projectile-trails/fire/stamp-ember_spark.png`
- `assets/vfx-custom/lasers/water/beam-water_band.png`

Recommended source sizes with the current config:

- projectile sprite: `32x32`
- projectile trail stamp: `18x18`
- laser beam texture: `128x24`

Type folder names should match the normalized in-game type keys:

- `normal`
- `fire`
- `water`
- `grass`
- `electric`
- `ice`
- `rock`
- `ground`
- `psychic`
- `dark`
- `fairy`
- `steel`
- `dragon`
- `ghost`
- `poison`
- `bug`
- `flying`
- `fighting`

Notes:

- Projectiles can define multiple variants with `variant-0`, `variant-1`, etc.
- Trails and lasers support a generic file (`stamp.png`, `beam.png`) or a more specific profile file.
- No extra manifest is required for this first pass.
