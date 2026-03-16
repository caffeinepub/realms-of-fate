# Realms of Fate

## Current State
The app is a browser-based fantasy RPG with character creation, combat, quests, exploration, inventory, character sheet, and community tabs. The backend exists but core game mechanics are non-functional:
- `exploreZone` returns empty narration with no encounters, loot, XP, or gold
- `attackEnemy` returns static dummy values without modifying character state
- `travelToZone` does not update the character's zone in storage
- No quest data exists in the system - quests array is always empty
- No leveling/XP system actually updates character state
- No loot is ever generated or added to inventory

## Requested Changes (Diff)

### Add
- Rich `exploreZone` logic: generates narrative, XP (10-50), gold (5-25), random loot, and random encounters per zone with unique flavor text per zone type
- Quest generation: on character creation or first explore, seed 3-5 starter quests into character's quest list
- Leveling system: XP threshold tracking, auto-level-up when XP >= xpToNext, recalculate stats on level up
- Proper `attackEnemy` that reduces real enemy HP (stored in activeCombats), deals player damage from enemy counter-attack, grants XP/gold on kill, updates character in storage
- Working `travelToZone` that persists new zone to character record
- `usePotion` that actually restores HP and removes item from inventory
- `equipItem` that toggles equipped state and applies stat bonuses
- `acceptQuest` that changes quest status from Available to Active

### Modify
- `createCharacter` to generate proper base stats by race/class combination and seed initial quests
- `getCharacter` continues to return full character (no change needed)
- All character-mutating functions must persist updated character back to the `characters` map

### Remove
- Dead duplicate `attack()` function (replaced by `attackEnemy`)
- Dead `explore()` function (replaced by `exploreZone`)

## Implementation Plan
1. Rewrite backend with full game logic: real exploration results, leveling, combat state management, quest seeding
2. Validate frontend still matches updated API (API surface unchanged, behavior improved)
3. Deploy
