# Realms of Fate

## Current State
- Browser-based fantasy RPG with character creation (name, race, class)
- HUD shows HP/MP/XP bars but XP/level never actually update (backend attack/explore don't save state)
- Combat tab: attack button calls backend but enemy/player HP are local state only, no XP rewards
- Explore tab: explore button calls backend but returns static narration, no real loot or XP
- Inventory and Quests tabs exist but show empty data
- No character sheet, no player directory, no messaging
- Single background image, limited mystic artwork

## Requested Changes (Diff)

### Add
- **Fixed XP/leveling**: combat grants XP per hit, killing enemy grants bonus XP+gold; leveling up increases stats
- **Fixed combat**: enemy has real HP that persists per encounter, player takes damage, both tracked in backend; rich narration with dice rolls
- **Fixed exploration**: zone exploration grants XP, gold, random loot, random encounter enemies; story-rich narration per zone
- **Character sheet tab**: displays all stats, equipped items, backstory/lore, race/class description; can be viewed by others via player directory
- **Player directory tab**: shows all registered characters with name/race/class/level; click to view their character sheet
- **Messaging system**: players can send messages to each other; inbox shows received messages; compose message to any player
- **Rich story content**: in-depth lore for each zone, narrative events, story-driven exploration text
- More mystic/fantasy background images for different zones and the character sheet

### Modify
- Backend `attack()`: now accepts enemy name+HP, deals randomized damage both ways, saves character HP, grants XP on kill
- Backend `explore()`: now accepts zone, returns rich narrative + random loot added to inventory + random encounter + XP/gold
- Backend `createCharacter()`: apply race/class stat bonuses properly
- `getAllCharacters()`: returns all characters for the player directory

### Remove
- Stub `addItem` and `addQuest` functions (replaced by real logic)

## Implementation Plan
1. Backend: fix character stat initialization with race/class bonuses; fix attack to deal damage, save state, grant XP, handle level-up; fix explore to grant XP/gold/loot; add messaging (sendMessage, getMessages, getInbox); keep getAllCharacters
2. Backend: add startCombat(enemyName) to initialize an enemy encounter stored per-character; add getActiveCombat query
3. Frontend images: generate 4 additional mystic zone images
4. Frontend: CharacterSheetTab component - full stat display with lore
5. Frontend: CommunityTab component - player directory + messaging inbox/compose
6. Frontend: Fix MainGame tabs to include CharacterSheet and Community
7. Frontend: Fix CombatTab to use backend combat state properly
8. Frontend: Enrich ExploreTab with zone lore and story text
9. Frontend: Fix HUD XP display
