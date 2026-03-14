# Realms of Fate

## Current State
A browser-based fantasy RPG with character creation, exploration, combat, inventory, quests, and a community/messaging tab. The backend has many stub implementations (attackEnemy, exploreZone, travelToZone, equipItem, etc. return hardcoded values). The CharacterCreation screen has no login prompt -- anonymous users can fill out the form but clicking "Begin Adventure" silently fails because the backend requires authenticated users.

## Requested Changes (Diff)

### Add
- Login/authentication gate on the CharacterCreation screen: show an "Login to Play" button via Internet Identity before the form is usable; if not logged in, show a login prompt overlay
- `castSpell(spellName: Text)` backend method returning `CombatResult` -- applies spell-specific damage/healing based on the player's class and MP cost
- Per-class spell/ability definitions (4 spells per class): Warrior (Cleave, Shield Bash, Berserker Rage, War Cry), Mage (Fireball, Ice Lance, Arcane Bolt, Mana Shield), Rogue (Backstab, Poison Strike, Shadow Step, Smoke Bomb), Cleric (Holy Smite, Heal, Divine Shield, Radiant Wave)
- Spells panel in CombatTab showing available abilities with MP cost, cooldown indicator, and flavor description
- Proper game logic in backend: attackEnemy deals real damage, exploreZone returns encounters/loot/XP, travelToZone updates character zone, equipItem updates stats, usePotion restores HP

### Modify
- CombatTab: add a "Spells" section below the Attack/Flee buttons showing class spells as buttons; disable spells if insufficient MP or in cooldown
- CharacterCreation: gate form behind login check; show login button if not authenticated
- useQueries.ts: add `useCastSpell` mutation hook

### Remove
- Nothing removed

## Implementation Plan
1. Regenerate Motoko backend with full game logic: proper stat-based combat, zone exploration with encounters, travel, item equipping, potion use, and new `castSpell` method
2. Update CharacterCreation to show Internet Identity login prompt when user is not authenticated
3. Add `useCastSpell` hook to useQueries.ts
4. Add spells panel to CombatTab with per-class spell definitions, MP cost display, and cast button
