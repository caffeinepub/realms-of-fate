import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // ── Types ──────────────────────────────────────────────────────────────────
  public type UserProfile = { name : Text; characterCreated : Bool };

  type Race  = { #Human; #Elf; #Dwarf; #Orc };
  type Class = { #Warrior; #Mage; #Rogue; #Cleric };
  type ItemType    = { #Weapon; #Armor; #Potion; #Misc };
  type QuestStatus = { #Available; #Active; #Completed };
  type Zone = { #Town; #Forest; #Dungeon; #Mountains; #Castle };

  type StatBonus = { attack : Int; defense : Int; speed : Int; hp : Int; mp : Int };

  type Item = {
    id : Nat; name : Text; itemType : ItemType; description : Text;
    statBonus : StatBonus; equipped : Bool; quantity : Nat;
  };

  type Objective = { text : Text; completed : Bool };

  type Quest = {
    id : Nat; title : Text; description : Text; status : QuestStatus;
    objectives : [Objective];
    rewards : { xp : Nat; gold : Nat; items : [Item] };
  };

  type Character = {
    name : Text; race : Race; charClass : Class;
    hp : Nat; maxHp : Nat; mp : Nat; maxMp : Nat;
    attack : Nat; defense : Nat; speed : Nat;
    level : Nat; xp : Nat; xpToNext : Nat; gold : Nat;
    inventory : [Item]; quests : [Quest]; zone : Zone; backstory : Text;
  };

  type CombatResult = {
    narration : Text; playerHp : Nat; enemyHp : Nat;
    playerAction : Text; enemyAction : Text;
    xpGained : Nat; goldGained : Nat; leveledUp : Bool; success : Bool;
  };

  public type CreateCharacterResult = { narration : Text; character : ?Character; success : Bool };
  public type ItemResult = { narration : Text; item : ?Item; success : Bool };

  type ExplorationResult = {
    narration : Text; zone : Zone; encounter : ?Text;
    loot : ?[Item]; xpGained : Nat; goldGained : Nat; success : Bool;
  };

  type ActiveCombat = { enemyName : Text; enemyHp : Nat; maxHp : Nat };

  type Message = {
    id : Nat; fromPrincipal : Principal; fromName : Text;
    toPrincipal : Principal; content : Text;
    timestamp : Int; read : Bool;
  };

  // ── Storage ────────────────────────────────────────────────────────────────
  let characters    = Map.empty<Principal, Character>();
  let activeCombats = Map.empty<Principal, ActiveCombat>();
  let messages      = Map.empty<Nat, Message>();
  let userProfiles  = Map.empty<Principal, UserProfile>();
  var nextItemId    = 100;
  var nextQuestId   = 1;
  var nextMessageId = 1;

  // ── Helpers ────────────────────────────────────────────────────────────────
  func nowMillis() : Int { Time.now() / 1_000_000 };

  func rand(seed : Int, max : Nat) : Nat {
    if (max == 0) return 0;
    Int.abs(seed) % max;
  };

  func applyXp(char : Character, gained : Nat) : (Character, Bool) {
    let newXp = char.xp + gained;
    if (newXp >= char.xpToNext) {
      let newLevel    = char.level + 1;
      let newXpToNext = newLevel * 150;
      let leveled : Character = {
        char with
        xp       = newXp - char.xpToNext;
        level    = newLevel;
        xpToNext = newXpToNext;
        maxHp    = char.maxHp + 10;
        hp       = Nat.min(char.hp + 15, char.maxHp + 10);
        maxMp    = char.maxMp + 5;
        attack   = char.attack + 2;
        defense  = char.defense + 1;
        speed    = char.speed + 1;
      };
      (leveled, true)
    } else {
      ({ char with xp = newXp }, false)
    };
  };

  func makeItem(iid : Nat, n : Text, t : ItemType, desc : Text, qty : Nat, sb : StatBonus) : Item {
    { id = iid; name = n; itemType = t; description = desc;
      statBonus = sb; equipped = false; quantity = qty }
  };

  func starterItem(charClass : Class) : Item {
    let iid = nextItemId;
    nextItemId += 1;
    switch (charClass) {
      case (#Warrior) makeItem(iid, "Iron Sword", #Weapon, "A sturdy iron sword, well-worn from battle.",       1, { attack = 5; defense = 0; speed = 0; hp = 0; mp = 0  });
      case (#Mage)    makeItem(iid, "Oak Staff",  #Weapon, "A carved staff that resonates with arcane energy.", 1, { attack = 3; defense = 0; speed = 0; hp = 0; mp = 10 });
      case (#Rogue)   makeItem(iid, "Dagger",     #Weapon, "A slim blade made for swift, silent kills.",        1, { attack = 4; defense = 0; speed = 3; hp = 0; mp = 0  });
      case (#Cleric)  makeItem(iid, "Holy Mace",  #Weapon, "A blessed mace etched with divine runes.",          1, { attack = 3; defense = 2; speed = 0; hp = 5; mp = 5  });
    };
  };

  func starterQuests() : [Quest] {
    let q1 = nextQuestId; nextQuestId += 1;
    let q2 = nextQuestId; nextQuestId += 1;
    let q3 = nextQuestId; nextQuestId += 1;
    [
      { id = q1; title = "First Steps"; status = #Available;
        description = "Prove yourself by exploring the town. Every legend begins somewhere.";
        objectives = [{ text = "Explore the town"; completed = false }];
        rewards = { xp = 100; gold = 50; items = [] }; },
      { id = q2; title = "Into the Wild"; status = #Available;
        description = "The Whispering Wood holds ancient secrets. Venture into the forest.";
        objectives = [{ text = "Travel to the Forest"; completed = false },
                      { text = "Survive an encounter"; completed = false }];
        rewards = { xp = 250; gold = 100; items = [] }; },
      { id = q3; title = "The Dark Below"; status = #Available;
        description = "Rumours speak of untold riches in the Catacombs of Malgrath.";
        objectives = [{ text = "Reach the Dungeon"; completed = false },
                      { text = "Defeat a dungeon creature"; completed = false },
                      { text = "Retrieve the Tome Fragment"; completed = false }];
        rewards = { xp = 500; gold = 300; items = [] }; },
    ];
  };

  func zoneNarrations(z : Zone, seed : Int) : Text {
    let idx = rand(seed, 5);
    switch (z) {
      case (#Town) {
        let pool = [
          "The streets of Ironhaven buzz with anxious energy. A merchant's cart overturned scattering rare herbs. You pocket a few while helping gather the rest.",
          "A scarred veteran at the Broken Sword Tavern whispers of a shadow moving in the east. He shares a map fragment.",
          "Town criers announce a bounty on goblin raiders. You eavesdrop on two guild recruiters debating which hero to back.",
          "An elder stops you in the market. She recognises the look of destiny in your eyes and presses a coin into your palm.",
          "A robed figure slips a scroll into your cloak. 'The stars have foretold your coming,' she says before vanishing.",
        ];
        pool[idx]
      };
      case (#Forest) {
        let pool = [
          "Mist clings to the gnarled roots of the Whispering Wood. Bioluminescent moths lead you to a clearing where silver coins rest in a fairy ring.",
          "Ancient oaks groan warnings as you pass. A fox spirit leaves glowing paw prints toward something half-buried.",
          "Ambush! Bandits drop from the canopy. You scatter them and they flee leaving a pack behind.",
          "The trees thin to reveal a crumbling elven shrine that fills your satchel with its blessing.",
          "An enormous spider web blocks the trail. You fight off the swarm and find gems tangled in the silk.",
        ];
        pool[idx]
      };
      case (#Dungeon) {
        let pool = [
          "Torchlight flickers across walls carved with screaming faces. A skeleton sentry crumbles leaving behind a pouch of coins.",
          "You descend into the Catacombs of Malgrath. A trapped chest springs open triggering a dart mechanism you barely dodge.",
          "Green flames hover at a crossroads below the earth. You circle around the undead and find their lair cache.",
          "A necromancer's ritual circle burns on the floor. The summoning was interrupted. You act fast.",
          "The dungeon floor collapses into a secret vault. Skeletons guard a chest. Victory fills your arms with treasure.",
        ];
        pool[idx]
      };
      case (#Mountains) {
        let pool = [
          "Howling winds carry ice shards down the Thornspire Range. A frost giant patrols the ridge and you flank it.",
          "An ancient dwarven forge smoulders in a forgotten pass. You find ore left behind when Khaz'Dorrum fell.",
          "A dragon's silhouette crosses the sun. You press against a cliff face and a gem shakes loose from the rockface.",
          "Mountain bandits challenge you to single combat. Their leader falls and you earn their toll purse.",
          "A blizzard catches you in the open. You shelter in a cave filled with ancient battle-gear.",
        ];
        pool[idx]
      };
      case (#Castle) {
        let pool = [
          "The obsidian gates of Castle Dread creak as you enter. Shadow Lord Malachar's minions swarm the courtyard.",
          "Cursed tapestries move in the throne room. A lich commander materialises from the dark.",
          "Forbidden chambers line the castle's inner keep. You break one ward and claim what was imprisoned inside.",
          "Undead legions march in formation. You eliminate the banner-carrier and recover the standard.",
          "The Shadow Lord's voice echoes through every stone. His phantom strikes but you endure and raid the vault.",
        ];
        pool[idx]
      };
    };
  };

  func generateLoot(zone : Zone, seed : Int) : Item {
    let iid  = nextItemId;
    nextItemId += 1;
    let roll = rand(seed, 6);
    switch (zone) {
      case (#Town) {
        let pool = [
          makeItem(iid, "Health Potion",     #Potion, "Restores 50 HP.",                1, { attack = 0; defense = 0; speed = 0; hp = 50; mp = 0  }),
          makeItem(iid, "Leather Gloves",    #Armor,  "Basic leather gloves.",          1, { attack = 0; defense = 2; speed = 1; hp = 0;  mp = 0  }),
          makeItem(iid, "Mana Vial",         #Potion, "Restores 30 MP.",                1, { attack = 0; defense = 0; speed = 0; hp = 0;  mp = 30 }),
          makeItem(iid, "Traveller's Cloak", #Armor,  "A worn but sturdy cloak.",       1, { attack = 0; defense = 1; speed = 2; hp = 5;  mp = 0  }),
          makeItem(iid, "Lucky Coin",        #Misc,   "Worn smooth by many hands.",     1, { attack = 1; defense = 0; speed = 0; hp = 0;  mp = 0  }),
          makeItem(iid, "Ration Pack",       #Misc,   "Restores a little energy.",      1, { attack = 0; defense = 0; speed = 0; hp = 10; mp = 5  }),
        ];
        pool[roll]
      };
      case (#Forest) {
        let pool = [
          makeItem(iid, "Elven Bow",        #Weapon, "Light and perfectly balanced.",         1, { attack = 6; defense = 0; speed = 2; hp = 0;  mp = 0  }),
          makeItem(iid, "Herbal Salve",     #Potion, "Heals 40 HP over time.",                2, { attack = 0; defense = 0; speed = 0; hp = 40; mp = 0  }),
          makeItem(iid, "Forest Amulet",    #Misc,   "Carved from living wood.",              1, { attack = 0; defense = 2; speed = 3; hp = 10; mp = 10 }),
          makeItem(iid, "Bark Shield",      #Armor,  "Surprisingly tough natural armour.",    1, { attack = 0; defense = 5; speed = 0; hp = 15; mp = 0  }),
          makeItem(iid, "Spider Silk Robe", #Armor,  "Lightweight and eerily strong.",         1, { attack = 0; defense = 3; speed = 2; hp = 0;  mp = 15 }),
          makeItem(iid, "Druid's Focus",    #Misc,   "Amplifies natural magic.",              1, { attack = 2; defense = 0; speed = 0; hp = 0;  mp = 20 }),
        ];
        pool[roll]
      };
      case (#Dungeon) {
        let pool = [
          makeItem(iid, "Cursed Blade",        #Weapon, "Dark power seeps from its edge.",       1, { attack = 10; defense = 0;  speed = 0;  hp = -10; mp = 0  }),
          makeItem(iid, "Bone Armour",         #Armor,  "Morbid but effective.",                 1, { attack = 0;  defense = 8;  speed = -1; hp = 20;  mp = 0  }),
          makeItem(iid, "Malgrath's Seal",     #Misc,   "A rune-inscribed medallion.",           1, { attack = 3;  defense = 3;  speed = 0;  hp = 0;   mp = 25 }),
          makeItem(iid, "Greater Heal Potion", #Potion, "Restores 80 HP instantly.",             1, { attack = 0;  defense = 0;  speed = 0;  hp = 80;  mp = 0  }),
          makeItem(iid, "Soul Fragment",       #Misc,   "Radiates cold, trapped energy.",        1, { attack = 5;  defense = 0;  speed = 0;  hp = 0;   mp = 30 }),
          makeItem(iid, "Shadowstep Boots",    #Armor,  "Imbued with shadow magic.",             1, { attack = 0;  defense = 2;  speed = 6;  hp = 0;   mp = 0  }),
        ];
        pool[roll]
      };
      case (#Mountains) {
        let pool = [
          makeItem(iid, "Dwarven Warhammer", #Weapon, "Forged in the fires of Khaz'Dorrum.", 1, { attack = 14; defense = 2;  speed = -2; hp = 0;  mp = 0  }),
          makeItem(iid, "Mountain Plate",    #Armor,  "Heavy steel from a forgotten forge.", 1, { attack = 0;  defense = 12; speed = -3; hp = 30; mp = 0  }),
          makeItem(iid, "Giant's Ring",      #Misc,   "Still warm from its previous owner.", 1, { attack = 6;  defense = 3;  speed = 0;  hp = 20; mp = 0  }),
          makeItem(iid, "Storm Elixir",      #Potion, "Drinking it feels like lightning.",   1, { attack = 0;  defense = 0;  speed = 5;  hp = 50; mp = 30 }),
          makeItem(iid, "Dragon Scale",      #Misc,   "Harder than most metals.",            1, { attack = 0;  defense = 8;  speed = 0;  hp = 25; mp = 0  }),
          makeItem(iid, "Runestone Axe",     #Weapon, "Runes flash when you strike.",        1, { attack = 12; defense = 0;  speed = 1;  hp = 0;  mp = 0  }),
        ];
        pool[roll]
      };
      case (#Castle) {
        let pool = [
          makeItem(iid, "Shadow Lord's Blade", #Weapon, "Forged from pure darkness.",             1, { attack = 18; defense = 0;  speed = 3;  hp = 0;   mp = 0  }),
          makeItem(iid, "Dread Armour",        #Armor,  "The armour of fallen champions.",        1, { attack = 0;  defense = 15; speed = 0;  hp = 40;  mp = 0  }),
          makeItem(iid, "Phylactery Shard",    #Misc,   "A fragment of the lich's power source.", 1, { attack = 8;  defense = 5;  speed = 0;  hp = 0;   mp = 40 }),
          makeItem(iid, "Immortal's Draught",  #Potion, "Tastes of shadows and iron.",            1, { attack = 0;  defense = 0;  speed = 0;  hp = 120; mp = 60 }),
          makeItem(iid, "Obsidian Crown",      #Misc,   "Commands fear from lesser beings.",      1, { attack = 10; defense = 10; speed = 0;  hp = 30;  mp = 30 }),
          makeItem(iid, "Void Staff",          #Weapon, "Channels the void between worlds.",      1, { attack = 15; defense = 0;  speed = 0;  hp = 0;   mp = 50 }),
        ];
        pool[roll]
      };
    };
  };

  func zoneEncounters(z : Zone, seed : Int) : Text {
    let idx = rand(seed, 4);
    switch (z) {
      case (#Town)      { let e = ["Street Thug",      "Corrupt Guard",   "Shadow Spy",       "Hired Assassin"     ]; e[idx] };
      case (#Forest)    { let e = ["Forest Troll",     "Giant Spider",    "Bandit Captain",   "Dark Elf Scout"     ]; e[idx] };
      case (#Dungeon)   { let e = ["Skeleton Warrior", "Lich Apprentice", "Dungeon Wraith",   "Bone Golem"         ]; e[idx] };
      case (#Mountains) { let e = ["Frost Giant",      "Mountain Ogre",   "Stone Drake",      "Avalanche Elemental"]; e[idx] };
      case (#Castle)    { let e = ["Shadow Knight",    "Death Knight",    "Lich Commander",   "The Shadow Lord"    ]; e[idx] };
    };
  };

  // ── User Profiles ──────────────────────────────────────────────────────────
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    userProfiles.add(caller, profile);
  };

  // ── Character ─────────────────────────────────────────────────────────────
  public shared ({ caller }) func createCharacter(name : Text, race : Race, charClass : Class) : async CreateCharacterResult {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    if (characters.containsKey(caller)) {
      return { narration = "Hero already exists."; character = null; success = false };
    };

    let (baseHp, baseMp, baseAtk, baseDef, baseSpd) : (Nat, Nat, Nat, Nat, Nat) = switch (charClass) {
      case (#Warrior) (120, 40,  18, 15, 10);
      case (#Mage)    ( 70, 120, 12,  8, 14);
      case (#Rogue)   ( 90,  60, 16, 10, 20);
      case (#Cleric)  (100,  80, 12, 12, 10);
    };

    let (rHp, rMp, rAtk, rDef, rSpd) : (Nat, Nat, Nat, Nat, Nat) = switch (race) {
      case (#Human) (5,  5,  5, 5, 5);
      case (#Elf)   (0,  20, 0, 0, 4);
      case (#Dwarf) (20, 0,  0, 4, 0);
      case (#Orc)   (10, 0,  6, 0, 0);
    };

    let hp  = baseHp  + rHp;
    let mp  = baseMp  + rMp;
    let atk = baseAtk + rAtk;
    let def = baseDef + rDef;
    let spd = baseSpd + rSpd;

    let backstory : Text = switch (race, charClass) {
      case (#Human, #Warrior)  "A seasoned soldier who survived the border wars. You fight for coin, glory, and perhaps redemption.";
      case (#Elf,   #Mage)     "An arcane scholar exiled from the high towers. Ancient power courses through your veins.";
      case (#Dwarf, #Warrior)  "A mountain clan champion, last of your kin. The mountains remember your name in stone.";
      case (#Orc,   #Rogue)    "A shadow-runner who learned early that survival demands cunning. You strike from darkness.";
      case (#Human, #Cleric)   "Once a temple acolyte, now a holy warrior. The gods have chosen you for a mission you barely understand.";
      case (#Elf,   #Rogue)    "A forest-born assassin of the ancient order. Your blade has ended tyrants; a greater darkness calls.";
      case (#Dwarf, #Cleric)   "A priest of the forge-god, healer of the broken. You carry divine fire into the darkest depths.";
      case (#Orc,   #Warrior)  "A berserker whose rage is legendary. You seek a worthy battle and perhaps a worthy death.";
      case _                   "A wandering hero whose past is shadowed in mystery. The road ahead calls to you irresistibly.";
    };

    let item   = starterItem(charClass);
    let quests = starterQuests();

    let newChar : Character = {
      name      = name;
      race      = race;
      charClass = charClass;
      hp        = hp;
      maxHp     = hp;
      mp        = mp;
      maxMp     = mp;
      attack    = atk;
      defense   = def;
      speed     = spd;
      level     = 1;
      xp        = 0;
      xpToNext  = 150;
      gold      = 25;
      inventory = [item];
      quests    = quests;
      zone      = #Town;
      backstory = backstory;
    };

    characters.add(caller, newChar);
    userProfiles.add(caller, { name = name; characterCreated = true });
    { narration = "Welcome, " # name # "! Your legend begins."; character = ?newChar; success = true };
  };

  public query ({ caller }) func getCharacter() : async Character {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (characters.get(caller)) {
      case (?c) c;
      case null Runtime.trap("Character not found");
    };
  };

  public query ({ caller }) func getAllCharacters() : async [Character] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    characters.values().toArray();
  };

  // ── Exploration ────────────────────────────────────────────────────────────
  public shared ({ caller }) func travelToZone(zone : Zone) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (characters.get(caller)) {
      case (?char) { characters.add(caller, { char with zone = zone }); true; };
      case null Runtime.trap("Character not found");
    };
  };

  public shared ({ caller }) func exploreZone(zone : Zone) : async ExplorationResult {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (characters.get(caller)) {
      case (?char) {
        let t  = Time.now();
        let s1 = t / 7;
        let s2 = t / 13;
        let s3 = t / 3;
        let s4 = t / 17;

        let (xpBase, xpVar, goldBase, goldVar) : (Nat, Nat, Nat, Nat) = switch (zone) {
          case (#Town)      (10, 20,  5, 15);
          case (#Forest)    (20, 30, 10, 20);
          case (#Dungeon)   (40, 40, 20, 30);
          case (#Mountains) (50, 50, 30, 30);
          case (#Castle)    (80, 70, 50, 50);
        };
        let xpGained   = xpBase   + rand(s1, xpVar);
        let goldGained = goldBase + rand(s2, goldVar);

        let lootRoll = rand(s3, 10);
        let (newInventory, loot) : ([Item], ?[Item]) = if (lootRoll < 4) {
          let item : Item = generateLoot(zone, s4);
          let lootArr : [Item] = [item];
          (lootArr.concat(char.inventory), ?lootArr)
        } else {
          (char.inventory, null)
        };

        let encounterRoll = rand(Int.abs(s1 + s2), 10);
        let encounter : ?Text = if (encounterRoll < 3) {
          ?zoneEncounters(zone, s3)
        } else { null };

        let narration = zoneNarrations(zone, s1);

        let charWithLoot : Character = { char with inventory = newInventory; gold = char.gold + goldGained };
        let (charWithXp, _lvl) = applyXp(charWithLoot, xpGained);
        let finalChar : Character = { charWithXp with zone = zone };
        characters.add(caller, finalChar);

        { narration = narration; zone = zone; encounter = encounter; loot = loot;
          xpGained = xpGained; goldGained = goldGained; success = true };
      };
      case null Runtime.trap("Character not found");
    };
  };

  public shared ({ caller }) func explore() : async ExplorationResult {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (characters.get(caller)) {
      case (?char) { await exploreZone(char.zone) };
      case null Runtime.trap("Character not found");
    };
  };

  // ── Combat ─────────────────────────────────────────────────────────────────
  public shared ({ caller }) func startCombat(enemyName : Text, enemyHp : Nat) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    activeCombats.add(caller, { enemyName = enemyName; enemyHp = enemyHp; maxHp = enemyHp });
    true;
  };

  public query ({ caller }) func getActiveCombat() : async ?ActiveCombat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    activeCombats.get(caller);
  };

  public shared ({ caller }) func attackEnemy() : async CombatResult {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (characters.get(caller)) {
      case (?char) {
        switch (activeCombats.get(caller)) {
          case (?combat) {
            let t = Time.now();
            let playerDmg : Nat = char.attack + rand(t / 3, 15) + 5;

            let enemyBaseDmg : Nat = switch (char.zone) {
              case (#Town)       8;
              case (#Forest)    12;
              case (#Dungeon)   18;
              case (#Mountains) 24;
              case (#Castle)    32;
            };
            let rawEnemyDmg : Nat = enemyBaseDmg + rand(t / 7, 10);
            let enemyDmg : Nat = if (rawEnemyDmg > char.defense) { rawEnemyDmg - char.defense } else { 1 };

            let newEnemyHp : Nat  = if (playerDmg >= combat.enemyHp) { 0 } else { combat.enemyHp - playerDmg };
            let newPlayerHp : Nat = if (enemyDmg  >= char.hp)        { 0 } else { char.hp - enemyDmg };

            // Resolve outcome and persist state
            let (xpGained, goldGained, leveledUp) : (Nat, Nat, Bool) =
              if (newEnemyHp == 0) {
                let xp   = 50 + rand(t / 11, 70);
                let gold = 20 + rand(t / 13, 40);
                activeCombats.remove(caller);
                let (levChar, lvl) = applyXp(
                  { char with hp = newPlayerHp; gold = char.gold + gold },
                  xp
                );
                characters.add(caller, levChar);
                (xp, gold, lvl)
              } else {
                activeCombats.add(caller, { combat with enemyHp = newEnemyHp });
                characters.add(caller, { char with hp = newPlayerHp });
                (0, 0, false)
              };

            let narration : Text =
              if (newEnemyHp == 0) {
                "Victory! " # combat.enemyName # " falls! You claim your reward."
              } else if (newPlayerHp == 0) {
                "You have been defeated. Your vision darkens as " # combat.enemyName # " stands triumphant."
              } else {
                "You strike " # combat.enemyName # " for " # playerDmg.toText() #
                " damage! It retaliates for " # enemyDmg.toText() # " damage!"
              };

            { narration    = narration;
              playerHp     = newPlayerHp;
              enemyHp      = newEnemyHp;
              playerAction = "Attack (" # playerDmg.toText() # " dmg)";
              enemyAction  = "Counter (" # enemyDmg.toText() # " dmg)";
              xpGained     = xpGained;
              goldGained   = goldGained;
              leveledUp    = leveledUp;
              success      = true;
            };
          };
          case null {
            { narration = "No active combat."; playerHp = char.hp; enemyHp = 0;
              playerAction = "None"; enemyAction = "None";
              xpGained = 0; goldGained = 0; leveledUp = false; success = false };
          };
        };
      };
      case null Runtime.trap("Character not found");
    };
  };

  public shared ({ caller }) func attack() : async CombatResult {
    await attackEnemy();
  };

  public shared ({ caller }) func fleeCombat() : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    activeCombats.remove(caller);
    true;
  };

  // ── Inventory ──────────────────────────────────────────────────────────────
  public query ({ caller }) func getInventory() : async [Item] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (characters.get(caller)) {
      case (?c) c.inventory;
      case null Runtime.trap("Character not found");
    };
  };

  public query ({ caller }) func getItemsById(id : Nat) : async [Item] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (characters.get(caller)) {
      case (?c) { c.inventory.filter(func(i : Item) : Bool { i.id == id }) };
      case null Runtime.trap("Character not found");
    };
  };

  public shared ({ caller }) func equipItem(itemId : Nat) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (characters.get(caller)) {
      case (?char) {
        let newInventory = char.inventory.map(func(item : Item) : Item {
          if (item.id == itemId) { { item with equipped = not item.equipped } }
          else { item }
        });
        characters.add(caller, { char with inventory = newInventory });
        true;
      };
      case null Runtime.trap("Character not found");
    };
  };

  public shared ({ caller }) func usePotion(itemId : Nat) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (characters.get(caller)) {
      case (?char) {
        var used = false;
        let newInventory = char.inventory
          .filter(func(item : Item) : Bool {
            if (item.id == itemId and not used) {
              used := true;
              item.quantity > 1
            } else { true }
          })
          .map(func(item : Item) : Item {
            if (item.id == itemId and item.quantity > 1) {
              { item with quantity = item.quantity - 1 }
            } else { item }
          });
        let newHp = Nat.min(char.hp + 50, char.maxHp);
        characters.add(caller, { char with hp = newHp; inventory = newInventory });
        used;
      };
      case null Runtime.trap("Character not found");
    };
  };

  public shared ({ caller }) func addItem(id : Nat, name : Text, itemType : ItemType, description : Text, statBonus : StatBonus) : async ItemResult {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized");
    };
    let item = makeItem(id, name, itemType, description, 1, statBonus);
    { narration = "Item created."; item = ?item; success = true };
  };

  // ── Quests ─────────────────────────────────────────────────────────────────
  public query ({ caller }) func getQuests() : async [Quest] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (characters.get(caller)) {
      case (?c) c.quests;
      case null Runtime.trap("Character not found");
    };
  };

  public query ({ caller }) func getQuestsByStatus(status : QuestStatus) : async [Quest] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (characters.get(caller)) {
      case (?c) { c.quests.filter(func(q : Quest) : Bool { q.status == status }) };
      case null Runtime.trap("Character not found");
    };
  };

  public shared ({ caller }) func acceptQuest(questId : Nat) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (characters.get(caller)) {
      case (?char) {
        let newQuests = char.quests.map(func(q : Quest) : Quest {
          if (q.id == questId and q.status == #Available) { { q with status = #Active } }
          else { q }
        });
        characters.add(caller, { char with quests = newQuests });
        true;
      };
      case null Runtime.trap("Character not found");
    };
  };

  public shared ({ caller }) func addQuest(id : Nat, title : Text, description : Text) : async { narration : Text; quest : ?Quest; success : Bool } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized");
    };
    let quest : Quest = {
      id = id; title = title; description = description; status = #Available;
      objectives = []; rewards = { xp = 100; gold = 50; items = [] };
    };
    { narration = "Quest created."; quest = ?quest; success = true };
  };

  // ── Messaging ──────────────────────────────────────────────────────────────
  public shared ({ caller }) func sendMessage(toPrincipal : Principal, content : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    let fromName = switch (characters.get(caller)) {
      case (?c) c.name;
      case null "Unknown";
    };
    let msg : Message = {
      id            = nextMessageId;
      fromPrincipal = caller;
      fromName      = fromName;
      toPrincipal   = toPrincipal;
      content       = content;
      timestamp     = nowMillis();
      read          = false;
    };
    messages.add(nextMessageId, msg);
    nextMessageId += 1;
    true;
  };

  public query ({ caller }) func getInbox() : async [Message] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    messages.values().filter(func(m : Message) : Bool { m.toPrincipal == caller }).toArray();
  };

  public query ({ caller }) func getSentMessages() : async [Message] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    messages.values().filter(func(m : Message) : Bool { m.fromPrincipal == caller }).toArray();
  };

  public shared ({ caller }) func markMessageRead(messageId : Nat) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (messages.get(messageId)) {
      case (?msg) {
        if (msg.toPrincipal != caller) Runtime.trap("Unauthorized");
        messages.add(messageId, { msg with read = true });
        true;
      };
      case null { false };
    };
  };

  public query ({ caller }) func getUnreadCount() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    messages.values().filter(func(m : Message) : Bool {
      m.toPrincipal == caller and not m.read
    }).toArray().size();
  };
};
