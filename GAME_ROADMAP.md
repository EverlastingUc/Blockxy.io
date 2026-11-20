# Blockxy.io — Master Game Plan & Roadmap

> **Purpose:** The single source of truth for what Blockxy.io is today, what we intend to build, how systems should behave, and what will make the game recognisable as its own product.
>
> **Product direction:** A browser-first voxel world where players can build freely, explore generated places, master creative challenges, share creations, and develop a persistent player identity.
>
> **Status key:** [x] Implemented in the current codebase · [~] Prototype / partial · [ ] Planned

---

## 1. Product identity

Blockxy.io should not be positioned as a Minecraft copy or merely a block-placement demo. It is a **voxel creation and discovery platform**.

### Core pillars

1. **Create** — make structures, landscapes, machines, maps, and interactive experiences.
2. **Explore** — discover generated worlds, unusual terrain, hidden places, and community creations.
3. **Master** — improve through optional challenges, building goals, exploration, and skill-based achievements.
4. **Share** — publish worlds and blueprints so other players can visit, remix, and learn from them.
5. **Belong** — build a player identity through a profile, earned achievements, statistics, and community reputation.

### Design principles

- Browser-first: fast startup, accessible controls, and no mandatory launcher.
- Creative freedom first; progression must never make basic building feel locked.
- No pay-to-win mechanics. Paid cosmetics, if ever introduced, must not affect gameplay power.
- Player creations and skill should matter more than repetitive grinding.
- Systems should work on modest hardware; performance is a feature.
- Multiplayer and social systems must be designed around safety, moderation, and player control.
- Do not advertise a planned feature as available until it is implemented and tested.

---

## 2. Current implementation — honest snapshot

This section records what exists in the repository now. It is not a claim that the full roadmap is complete.

### Browser client and world

- [x] TypeScript + Three.js browser client.
- [x] First-person camera and basic movement.
- [x] A starter floating island with trees.
- [x] Block placement and removal.
- [x] Procedurally generated 16×16 pixel-art block textures, cached for reuse.
- [x] Face-specific texture variations.
- [x] Twenty current block types: grass, dirt, stone, cobblestone, bedrock, sand, sandstone, oak log, oak planks, leaves, bricks, glass, water, coal ore, iron ore, gold ore, diamond ore, snow, ice, and wool.

### Creative and Survival prototypes

- [x] Creative mode is the default mode.
- [x] Creative flight and unlimited block placement.
- [x] Nine-slot hotbar.
- [x] Number keys 1–9 and mouse-wheel hotbar selection.
- [x] Inventory opened with E, with category filters.
- [x] Left click breaks a block; right click places the selected block.
- [~] G toggles Creative / Survival; Survival currently has an early gravity and jumping prototype, not a finished survival system.

### Saving and interface

- [x] Ctrl+S saves the current world to browser local storage.
- [x] Ctrl+L loads the locally saved world.
- [x] Page-leave autosave.
- [x] Basic HUD, crosshair, pause/welcome interface, and feedback toast.

### Engineering foundation

- [x] Vite + TypeScript build setup.
- [x] GitHub Actions build workflow.
- [~] Rust and C++ project scaffolds exist.
- [ ] Rust is not yet integrated into the browser runtime.
- [ ] C++/WASM is not yet integrated into the browser runtime.
- [ ] The current renderer creates a mesh per block. The new chunk mesher is not yet connected to the scene.
- [ ] No online accounts, cloud saves, multiplayer, public world browser, or implemented achievement/profile backend yet.

**Current reality:** Blockxy remains an early playable Creative sandbox prototype. New TypeScript world-core modules now cover numeric block IDs, chunk storage, coordinates, exposed-face meshing, dirty tracking, streaming calculations, versioned save conversion, and edit history. These modules are not yet integrated into the existing playable scene. The live renderer still creates one mesh per block, and the live save path still uses v1. The next milestone is integration and end-to-end verification—not claiming the scalable engine is already running.

---

## 3. Gameplay modes

### 3.1 Creative Mode — first priority

Creative must become a complete building environment, not just a flying player with unlimited blocks.

**Planned features**
- [x] Unlimited block placement and free flight prototype.
- [x] Hotbar and searchable-by-category inventory foundation.
- [ ] Full block catalogue with consistent texture, icon, name, category, and placement rules.
- [ ] Block variants: stairs, slabs, fences, walls, doors, trapdoors, panes, and decorative pieces.
- [ ] Rotate and orient supported blocks.
- [ ] Copy, paste, duplicate, fill, replace, and undo/redo tools.
- [ ] Selection tool for rectangular regions.
- [ ] Blueprint capture, save, import, and placement.
- [ ] World settings: time of day, weather, gravity, and environment presets.
- [ ] Flight speed controls and optional grid snapping.
- [ ] Build protection / locked regions for published worlds.
- [ ] Screenshot and shareable world preview.
- [ ] Optional co-building when multiplayer is ready.

**Creative quality bar**
- Placing and breaking blocks should feel immediate.
- Inventory must remain usable with keyboard and mouse.
- Large edits should be undoable.
- Building tools must clearly show what area they will affect before applying destructive changes.

### 3.2 Survival Mode — after the world core

Survival should be a coherent loop rather than simply Creative with gravity enabled.

**Planned loop**
1. Spawn into a generated world.
2. Gather resources.
3. Craft basic tools and building materials.
4. Build shelter and manage environmental threats.
5. Explore caves, structures, and distinct biomes.
6. Progress through equipment and discoveries.

**Systems**
- [~] Basic gravity and jumping prototype.
- [ ] Reliable player collision and terrain interaction.
- [ ] Health, damage, respawn, and difficulty settings.
- [ ] Mining time, tool tiers, and block drops.
- [ ] Resource gathering and stack-based inventory.
- [ ] Crafting recipes and crafting interface.
- [ ] Hunger only if it adds meaningful decisions; avoid maintenance mechanics for their own sake.
- [ ] Day/night cycle and weather.
- [ ] Hostile and passive creatures with predictable behaviour.
- [ ] Caves, ores, structures, and biome-specific resources.
- [ ] Death and item-drop rules configurable by world owner.
- [ ] World difficulty and optional peaceful mode.

### 3.3 Adventure / Challenge Mode

A structured mode built around authored objectives and community maps.

- [ ] Curated challenge worlds with clear goals.
- [ ] Parkour, puzzle, survival, exploration, and building challenges.
- [ ] Checkpoints, timers, medals, and optional leaderboards.
- [ ] Creator-authored objectives and triggers.
- [ ] Challenge completion records on player profiles.
- [ ] Daily and weekly rotating community challenges, once the backend exists.

### 3.4 Spectator / Visit Mode

- [ ] Visit published worlds without modifying them.
- [ ] Spectator flight with owner-configured permissions.
- [ ] World tour markers and creator notes.
- [ ] Report, block, mute, and leave controls for online spaces.

---

## 4. World generation and exploration

### World foundation
- [ ] Chunk-based world storage, initially 16×16 horizontal columns with a defined vertical section size.
- [ ] Deterministic world seed: the same seed and generator version reproduce the same terrain.
- [ ] Chunk loading and unloading around the player.
- [ ] Exposed-face meshing so hidden block faces are not sent to the GPU.
- [ ] Greedy meshing after correctness and profiling of the simpler mesher.
- [ ] Background chunk generation using Web Workers.
- [ ] Level-of-detail and render-distance settings where appropriate.
- [ ] Save only changed chunks where practical.

### World variety
- [ ] Biomes with distinct terrain, vegetation, colour palettes, and resources.
- [ ] Mountains, plains, forests, deserts, frozen regions, oceans, caves, and rare formations.
- [ ] Natural structures and points of interest.
- [ ] Rivers, lakes, and more convincing water behaviour.
- [ ] Weather and environmental ambience.
- [ ] World presets: floating islands, flat world, survival world, creative plot, and challenge arena.

### World identity
Every world should have:
- A name, description, seed, creator, creation date, and thumbnail.
- Mode and gameplay rules.
- Visibility: private, unlisted, or public.
- Version and compatibility metadata.
- Tags and optional content warnings.
- A unique world identifier that remains stable when its title changes.

---

## 5. Blocks, materials, and visual direction

### Block catalogue roadmap

Organise blocks by function, not just by an ever-growing flat list:

- **Terrain:** grass, dirt, stone, sand, gravel, clay, snow.
- **Wood and plants:** logs, planks, leaves, saplings, flowers, crops.
- **Construction:** bricks, concrete-like palettes, tiles, glass, decorative blocks.
- **Ores and resources:** coal, iron, gold, diamond, and future resource families.
- **Lighting:** torches, lanterns, glow blocks, configurable light sources.
- **Mechanisms:** switches, pressure plates, doors, gates, logic components.
- **Water and environment:** water, ice, transparent and translucent materials.
- **Decoration:** banners, furniture-like blocks, paintings, signs, and display objects.

### Texture pipeline
- [x] Procedural 16×16 pixel-art textures for the initial set.
- [x] Texture caching and nearest-neighbour sampling.
- [ ] A central material registry defining texture, transparency, collision, sound, hardness, and render layer.
- [ ] Consistent top/side/bottom textures for directional blocks.
- [ ] Connected textures where useful.
- [ ] Texture atlas to reduce draw calls and material switches.
- [ ] Optional resource packs with validation and safe fallback textures.
- [ ] Original Blockxy visual identity: coherent palette, readable silhouettes, and recognisable block families.

### Visual polish
- [ ] Ambient occlusion or a performant voxel-friendly approximation.
- [ ] Directional sunlight and torch lighting.
- [ ] Distance fog and atmospheric presets.
- [ ] Water transparency and surface animation.
- [ ] Particle effects for breaking, placing, mining, and environmental events.
- [ ] Footstep, mining, placement, and ambient audio.
- [ ] Accessibility options for camera sensitivity, motion, contrast, and audio.

---

## 6. Player profile and identity

Profiles should represent a player's history and creations, not just a username and level.

### Public profile
- [ ] Unique username and stable player ID.
- [ ] Display name, avatar, and optional biography.
- [ ] Join date and last-active visibility controls.
- [ ] Selected title, profile frame, and earned cosmetics.
- [ ] Featured worlds and blueprint gallery.
- [ ] Achievement showcase with rarity and unlock date.
- [ ] Playtime split by mode.
- [ ] Worlds created, worlds visited, builds published, and challenge completions.
- [ ] Favourite building categories and optional creator tags.
- [ ] Friends/followers only with privacy controls.
- [ ] Report and block actions.

### Player statistics
Track meaningful, abuse-resistant statistics:
- Blocks placed and removed.
- Unique worlds explored.
- Distance explored.
- Worlds published.
- Blueprints shared.
- Challenges completed.
- Best times on verified challenges.
- Time spent in Creative, Survival, and Adventure.
- Collaboration contributions, where attribution can be measured fairly.

Do not use raw block count as the sole measure of skill. It can be inflated and does not measure quality.

### Identity progression
- [ ] XP from varied, legitimate activities.
- [ ] Levels as a lightweight summary of participation, not a power advantage.
- [ ] Earnable titles such as Builder, Explorer, Engineer, Cartographer, and Challenge Master.
- [ ] Cosmetic rewards: profile frames, badges, emotes, and visual themes.
- [ ] No gameplay power locked behind paid purchases or repetitive XP grinding.

---

## 7. Achievements and challenges

Achievements should reward discovery, creativity, mastery, and community contribution. They should not all be simple counters.

### Achievement categories

| Category | Example achievements | What they recognise |
|---|---|---|
| First Steps | First Block, First Build, First Save | Learning the basics |
| Builder | Architect, Skyline, Masterpiece | Meaningful construction milestones |
| Explorer | New Horizons, Deep Discoverer, Cartographer | Finding and documenting places |
| Survival | First Night, Prepared, Survivor | Survival progression |
| Engineer | Redstone-like Logic, Mechanist, Automation | Building functional systems |
| Artist | Pixel Perfect, Interior Designer, Landscaper | Creative presentation |
| Challenge | First Medal, Speed Builder, Flawless Run | Challenge performance |
| Community | Helpful Creator, Collaborator, World Host | Positive community activity |
| Discovery | Rare Find, Hidden Place, Biome Collector | Uncommon discoveries |
| Dedication | Regular Creator, Long Journey | Consistent participation without excessive grind |

### Achievement design rules
- [ ] Every achievement has an ID, title, description, category, icon, criteria, and unlock timestamp.
- [ ] Secret achievements may hide their criteria but must not mislead players.
- [ ] Some achievements are tiered: Bronze, Silver, Gold, and optionally Master.
- [ ] Skill achievements should use verified challenge rules or server-side validation.
- [ ] Achievements must not be awarded merely because a client sends a success event.
- [ ] Avoid rewards that encourage spam, griefing, idle farming, or unsafe behaviour.
- [ ] Show progress where it helps; keep secret achievements hidden until unlocked.
- [ ] Add achievement filters and a featured achievement slot to profiles.

### Example achievement specifications

- **First Block:** place your first block in a world.
- **First Blueprint:** save a reusable blueprint.
- **World Maker:** publish your first public world.
- **Explorer I:** visit five distinct biomes.
- **Architect:** publish a build that passes the chosen quality / community review process.
- **Untouched Run:** finish a verified challenge without a failed attempt.
- **Community Builder:** collaborate on a world with another player and receive contribution attribution.

Achievement criteria must be finalised with the relevant gameplay system; these examples are design targets, not currently unlocked features.

---

## 8. What makes Blockxy.io different?

There is no honest way to guarantee that a feature has never appeared in another game. The goal is to combine systems into a distinctive, high-quality experience and execute them better.

### Proposed signature systems

#### A. Build DNA — a creation identity
Each published build can have a shareable creation record:
- Creator and collaborators.
- World and blueprint origin.
- Materials and approximate block composition.
- Build version history.
- Optional creator notes and design intent.
- Remix lineage: which public build inspired a derivative.

This gives creations provenance and makes remixing a first-class activity rather than an uncredited copy.

#### B. Blueprint-first creativity
Players can capture a structure as a blueprint, share it, preview it, and place it in another permitted world. Blueprints can include:
- Dimensions and material list.
- Preview image.
- Author and version.
- Placement orientation.
- Optional build instructions.

#### C. Community challenge studio
Players can make small challenge maps using a safe set of triggers, checkpoints, timers, and objectives. Other players can attempt them and earn verified medals. Start with a constrained editor; do not expose arbitrary code execution.

#### D. World discovery with creator context
A discovery page should show more than a random list:
- Curated collections and themed showcases.
- Screenshots and short creator descriptions.
- World tags, supported mode, and expected session length.
- Update history and creator attribution.
- Helpful sorting that does not reward fake visits.

#### E. Skill identity instead of a grind ladder
Profiles highlight what someone is good at: building, exploration, engineering, challenge runs, or collaboration. A player can be a respected architect without having the highest playtime.

#### F. Browser-native accessibility
Fast join, shareable world links, low-friction creative sessions, and sensible performance defaults are product advantages. A player should be able to open a link and understand how to participate.

### Differentiation guardrails
- Do not copy another game's protected art, branding, UI, maps, or distinctive assets.
- Learn from genre conventions, but create original names, textures, sound, interface, and progression.
- Validate signature features with real player testing before claiming they make the game unique.

---

## 9. Social, multiplayer, and creator ecosystem

These systems come after the single-player world and save model are stable.

### Accounts and social
- [ ] Account registration and secure sign-in.
- [ ] Guest play with a clear upgrade path to a permanent account.
- [ ] Cloud save and cross-device world access.
- [ ] Friends, invites, presence, and privacy settings.
- [ ] World permissions: owner, editor, builder, visitor.
- [ ] Chat with mute, block, report, and moderation controls.
- [ ] Rate limits, spam protection, and abuse reporting.

### Multiplayer
- [ ] Decide authoritative server architecture before shipping public multiplayer.
- [ ] Server validates movement, block changes, inventory, and challenge results.
- [ ] Region / chunk interest management.
- [ ] Conflict handling for simultaneous edits.
- [ ] Reconnection and graceful host disconnect.
- [ ] Private sessions and invite-only worlds.
- [ ] Anti-cheat design based on server authority, not client trust.
- [ ] Moderation and incident response tools.

### Creator and discovery features
- [ ] Publish, unpublish, update, and version worlds.
- [ ] World browser with search, tags, categories, and filters.
- [ ] Likes / favourites with abuse controls.
- [ ] Comments only after moderation and reporting systems are ready.
- [ ] Blueprint library and creator collections.
- [ ] Featured creator and curated showcase systems.
- [ ] Clear ownership and attribution for remixes and collaborations.

---

## 10. Technical architecture

### Intended stack

- **TypeScript + Three.js:** browser client, presentation, input, UI, and orchestration.
- **Rust:** deterministic world model, generation logic, and simulation rules where Rust provides a clear benefit.
- **C++ → WebAssembly:** performance-critical algorithms only after benchmarks demonstrate a need, such as chunk meshing.
- **Web Workers:** background generation and other tasks that should not block the render loop.
- **Backend:** accounts, cloud saves, world metadata, multiplayer authority, and moderation; select services based on measured needs.

### Architecture rules
- Keep world data independent of Three.js meshes.
- Use integer voxel coordinates and explicit chunk coordinates.
- Define stable block IDs; do not use display names as save identifiers.
- Version world saves and provide migration paths.
- Keep deterministic generation tied to a generator version.
- Validate all imported worlds and blueprints.
- Treat browser storage as local convenience, not a cloud backup.
- Keep a tested TypeScript fallback for any WASM optimization.
- Benchmark before moving logic to Rust or C++.
- Never trust a multiplayer client to award achievements or validate competitive records.

### Performance targets to validate
These are engineering goals, not current measured results:
- Smooth camera movement on supported desktop browsers.
- No full-world rebuild when one block changes.
- Chunk rebuilds limited to affected chunks and neighbours.
- Bounded memory use as render distance increases.
- Background generation that does not cause major frame hitches.
- Graceful fallback on devices without the preferred WASM features.

---

## 11. Ordered implementation roadmap

The sequence is deliberate. Do not jump to public multiplayer while the world model and renderer are still prototypes.

### Phase 0 — Playable Creative foundation
**Status: In progress**

- [x] Browser scene and first-person interaction.
- [x] Starter island and trees.
- [x] Initial 20 textured blocks.
- [x] Creative flight and unlimited placement.
- [x] Hotbar and inventory foundation.
- [x] Local save/load prototype.
- [ ] Fix gameplay bugs found through actual browser testing.
- [~] Centralised numeric block registry and block-history modules exist, but the active game scene still uses its legacy string-based block definitions and does not yet use undo/redo.
- [ ] Integrate the registry and history into the playable scene and verify placement/break feedback.

**Exit condition:** A player can build, edit, save, reload, and continue a small world reliably.

### Phase 1 — Scalable voxel engine
**Next major engineering milestone**

- [~] Chunk data model, coordinate conversion, and dirty-chunk tracking modules exist; the playable scene still uses its legacy voxel map.
- [~] Render-distance chunk selection and load/unload reconciliation logic exist, but are not connected to player movement or scene lifecycle.
- [~] Exposed-face mesher and padded-neighbour sampling contract exist with unit tests; the active renderer still creates one mesh per block.
- [~] Mesher accepts neighbour samples across chunk boundaries; runtime adjacent-chunk integration remains unverified.
- [~] Atlas UV layout and texture-key mapping interfaces exist; the current canvas textures are not yet packed into a runtime atlas.
- [~] Worker meshing entry point and main-thread fallback executor exist; neither is wired into the active renderer and worker failure recovery remains incomplete.
- [~] Vitest unit suites and a deterministic mesher benchmark have been added; no performance numbers have been collected.
- [~] Runtime chunk-render manager now converts world chunks to Three.js layer geometry, builds padded neighbour samples, and remeshes active dirty chunks; it is not yet connected to the live game scene.
- [~] Runtime texture-atlas packing now creates a single nearest-filtered atlas with edge gutters; the current canvas texture cache is not yet passed into it.
- [~] Version 2 chunk-save serialization, dirty-chunk merge, validation, and legacy array migration exist as isolated modules; Ctrl+S/Ctrl+L still use the v1 local-storage format.

**Exit condition:** The world can expand beyond the starter island without one mesh per block or full-scene rebuilds.

### Phase 2 — Complete Creative mode
- [ ] Full material registry and block catalogue.
- [ ] Block orientation and variants.
- [~] Bounded selection, fill, replace, copy, and paste logic exists with blueprint validation; it is not yet connected to in-game selection controls.
- [~] Grouped undo / redo supports atomic multi-block edits; the active game scene still does not expose undo/redo controls.
- [ ] Blueprint save and placement.
- [ ] World settings and environment controls.
- [ ] Build gallery screenshots and local world management.

**Exit condition:** Creative mode is a robust standalone building tool.

### Phase 3 — Exploration and Survival
- [ ] Seeded terrain and biome generation.
- [ ] Caves, resources, and structures.
- [ ] Collision, gravity, and reliable movement.
- [ ] Mining, drops, tools, inventory, and crafting.
- [ ] Health, respawn, day/night, and optional creatures.
- [ ] Survival world save/load and difficulty settings.

**Exit condition:** Survival has a complete, balanced gameplay loop.

### Phase 4 — Accounts, profiles, and achievements
- [ ] Account identity and secure authentication.
- [ ] Cloud saves and world ownership.
- [ ] Player profile and privacy controls.
- [ ] Server-validated achievement service.
- [ ] Statistics and achievement showcase.
- [ ] Titles and cosmetic progression.

**Exit condition:** Player identity and progress persist across sessions and devices.

### Phase 5 — Community worlds and challenge studio
- [ ] Public world publishing and discovery.
- [ ] Visit permissions and moderation.
- [ ] Challenge map format and safe trigger system.
- [ ] Timers, checkpoints, medals, and verified records.
- [ ] Blueprint sharing, attribution, and remix history.

**Exit condition:** Players can create, publish, discover, and play community content safely.

### Phase 6 — Multiplayer
- [ ] Authoritative server prototype.
- [ ] Real-time player synchronisation.
- [ ] Server-side block edit validation.
- [ ] Shared building permissions.
- [ ] Chat, invites, reports, moderation, and anti-abuse controls.
- [ ] Load testing and operational monitoring.

**Exit condition:** Public sessions remain stable, fair, and manageable under real usage.

### Phase 7 — Expansion and polish
- [ ] Resource packs and creator tools.
- [ ] More block families, biomes, and world presets.
- [ ] Audio, particles, lighting, and visual polish.
- [ ] Accessibility and mobile-input evaluation.
- [ ] Curated events and rotating challenges.
- [ ] Performance work guided by real telemetry and player feedback.

---

## 12. Explicit non-goals for the early versions

To protect quality and avoid endless scope expansion:

- No public multiplayer before server authority and moderation are ready.
- No arbitrary user code execution in challenge maps.
- No blockchain, token, or speculative economy requirement.
- No pay-to-win items or paid gameplay advantages.
- No giant feature list at the cost of broken basic controls.
- No forced survival mechanics in Creative mode.
- No claims of infinite terrain, cross-platform parity, or production-grade anti-cheat until verified.

---

## 13. Definition of done

A feature is not complete merely because a button or menu exists.

For each feature:
1. Define expected behaviour and edge cases.
2. Implement it in the correct system layer.
3. Add automated tests for logic that can be tested.
4. Test the actual browser interaction where relevant.
5. Check keyboard, mouse, and supported screen sizes.
6. Check save/load compatibility if world data changes.
7. Check performance on a representative world.
8. Update this roadmap and user-facing documentation.
9. Do not mark [x] until the behaviour is implemented and verified.

---

## 14. Immediate priority queue

The next work should follow this order:

1. **Chunk world model** — separate voxel data from render objects.
2. **Exposed-face chunk mesher** — render only visible block faces.
3. **Chunk streaming** — load and unload world regions around the player.
4. **Material registry** — one source of truth for block IDs, textures, transparency, collision, and behaviour.
5. **Save format v2** — versioned chunk-based persistence with safe migration.
6. **Creative editing tools** — selection, fill, copy/paste, undo/redo.
7. **World generation** — deterministic seeds, terrain, and biomes.
8. **Complete Survival loop** — collision, mining, resources, crafting, and progression.
9. **Profiles and achievements** — backed by persistent identity and server-side validation.
10. **Community publishing and multiplayer** — only after the foundations are reliable.

---

## 15. Project status and update policy

- This file is the master product plan. If another document conflicts with it, update the documents deliberately rather than allowing two competing roadmaps.
- Keep the current implementation snapshot factual.
- Move a task from Planned to Implemented only after it meets the Definition of Done.
- Record major architectural decisions here or link to a dedicated technical decision record.
- Reorder priorities when tests, performance data, or player feedback justify it.
- Prefer a small number of finished, reliable systems over many unfinished menu options.

**North star:** Blockxy.io should make it effortless to create a world, satisfying to master a craft, and meaningful to share what you have made.
