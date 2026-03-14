import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Array "mo:core/Array";
import List "mo:core/List";
import Nat "mo:core/Nat";
import VarArray "mo:core/VarArray";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Int "mo:core/Int";
import Float "mo:core/Float";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Migration "migration";

(with migration = Migration.run)
actor {
  // Initialize access control
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile Type
  public type UserProfile = {
    name : Text;
    characterCreated : Bool;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  // Types
  type Race = { #Human; #Elf; #Dwarf; #Orc };
  type Class = { #Warrior; #Mage; #Rogue; #Cleric };
  type ItemType = { #Weapon; #Armor; #Potion; #Misc };
  type QuestStatus = { #Available; #Active; #Completed };
  type Zone = { #Town; #Forest; #Dungeon; #Mountains; #Castle };
  type StatBonus = {
    attack : Int;
    defense : Int;
    speed : Int;
    hp : Int;
    mp : Int;
  };

  type Item = {
    id : Nat;
    name : Text;
    itemType : ItemType;
    description : Text;
    statBonus : StatBonus;
    equipped : Bool;
    quantity : Nat;
  };

  module Item {
    public func compare(item1 : Item, item2 : Item) : Order.Order {
      switch (item1.itemType, item2.itemType) {
        case (#Weapon, #Weapon) { #equal };
        case (#Weapon, _) { #less };
        case (#Armor, #Weapon) { #greater };
        case (#Armor, #Armor) { #equal };
        case (#Armor, _) { #less };
        case (#Potion, #Potion) { #equal };
        case (#Potion, #Misc) { #less };
        case (#Potion, _) { #greater };
        case (#Misc, #Misc) { #equal };
        case (#Misc, _) { #greater };
      };
    };
  };

  type Objective = {
    text : Text;
    completed : Bool;
  };

  type Quest = {
    id : Nat;
    title : Text;
    description : Text;
    status : QuestStatus;
    objectives : [Objective];
    rewards : {
      xp : Nat;
      gold : Nat;
      items : [Item];
    };
  };

  type Character = {
    name : Text;
    race : Race;
    charClass : Class;
    hp : Nat;
    maxHp : Nat;
    mp : Nat;
    maxMp : Nat;
    attack : Nat;
    defense : Nat;
    speed : Nat;
    level : Nat;
    xp : Nat;
    xpToNext : Nat;
    gold : Nat;
    inventory : [Item];
    quests : [Quest];
    zone : Zone;
    backstory : Text;
  };

  module Character {
    public func compare(character1 : Character, character2 : Character) : Order.Order {
      switch (Text.compare(character1.name, character2.name)) {
        case (#equal) { Nat.compare(character1.level, character2.level) };
        case (order) { order };
      };
    };
  };

  type CombatResult = {
    narration : Text;
    playerHp : Nat;
    enemyHp : Nat;
    playerAction : Text;
    enemyAction : Text;
    xpGained : Nat;
    goldGained : Nat;
    leveledUp : Bool;
    success : Bool;
  };

  public type CreateCharacterResult = {
    narration : Text;
    character : ?Character;
    success : Bool;
  };

  public type ItemResult = {
    narration : Text;
    item : ?Item;
    success : Bool;
  };

  type QuestResult = {
    narration : Text;
    quest : ?Quest;
    success : Bool;
  };

  type ExplorationResult = {
    narration : Text;
    zone : Zone;
    encounter : ?Text;
    loot : ?[Item];
    xpGained : Nat;
    goldGained : Nat;
    success : Bool;
  };

  type Message = {
    id : Nat;
    fromPrincipal : Principal;
    fromName : Text;
    toPrincipal : Principal;
    content : Text;
    timestamp : Int;
    read : Bool;
  };

  type ActiveCombat = {
    enemyName : Text;
    enemyHp : Nat;
    maxHp : Nat;
  };

  // Storage
  let characters = Map.empty<Principal, Character>();
  let activeCombats = Map.empty<Principal, ActiveCombat>();
  let messages = Map.empty<Nat, Message>();
  var nextItemId = 1;
  var nextQuestId = 1;
  var nextMessageId = 1;

  // User Profile Functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Utilities
  func nowMillis() : Int {
    Time.now() / 1_000_000;
  };

  func rangeHelper(start : Nat, end : Nat) : [Nat] {
    var result = List.empty<Nat>();
    for (i in Nat.range(start, end)) {
      result.add(i);
    };
    result.toArray();
  };

  func randomInt(max : Nat) : Nat {
    let seed = Int.abs(Time.now());
    if (max == 0) { return 0 };
    seed % max;
  };

  // Character Functions
  public shared ({ caller }) func createCharacter(name : Text, race : Race, charClass : Class) : async CreateCharacterResult {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create characters");
    };

    if (characters.containsKey(caller)) {
      return { narration = "Character already exists."; character = null; success = false };
    };

    let baseStats = {
      hp = 100 + raceBonus(race, #Warrior);
      mp = 50;
      maxHp = 100;
      maxMp = 50;
      attack = classBonus(race, #Warrior);
      defense = classBonus(race, #Mage);
      speed = classBonus(race, #Cleric);
    };

    let newChar : Character = {
      name;
      race;
      charClass;
      hp = baseStats.hp;
      maxHp = baseStats.maxHp;
      mp = baseStats.mp;
      maxMp = baseStats.maxMp;
      attack = baseStats.attack;
      defense = baseStats.defense;
      speed = baseStats.speed;
      level = 1;
      xp = 0;
      xpToNext = 100;
      gold = 0;
      inventory = [];
      quests = [];
      zone = #Town;
      backstory = "A mysterious hero.";
    };

    characters.add(caller, newChar);
    { narration = "Character created successfully!"; character = ?newChar; success = true };
  };

  func raceBonus(race : Race, charClass : Class) : Nat {
    10;
  };

  func classBonus(race : Race, charClass : Class) : Nat {
    10;
  };

  public query ({ caller }) func getCharacter() : async Character {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access characters");
    };

    switch (characters.get(caller)) {
      case (?char) { char };
      case (null) { Runtime.trap("Character not found") };
    };
  };

  public query ({ caller }) func getAllCharacters() : async [Character] {
    // Public directory - any authenticated user can view
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view character directory");
    };

    characters.values().toArray().sort();
  };

  // Inventory Functions
  public shared ({ caller }) func addItem(id : Nat, name : Text, itemType : ItemType, description : Text, statBonus : StatBonus) : async ItemResult {
    // Admin-only function for creating items
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create items");
    };

    let item = {
      id;
      name;
      itemType;
      description;
      statBonus;
      equipped = false;
      quantity = 1;
    };
    { narration = "Item created with id " # id.toText(); item = ?item; success = true };
  };

  public query ({ caller }) func getInventory() : async [Item] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access inventory");
    };

    switch (characters.get(caller)) {
      case (?char) {
        char.inventory.sort();
      };
      case (null) { Runtime.trap("Character not found") };
    };
  };

  public query ({ caller }) func getItemsById(id : Nat) : async [Item] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access inventory");
    };

    switch (characters.get(caller)) {
      case (?char) {
        char.inventory.filter(func(item) { item.id == id });
      };
      case (null) { Runtime.trap("Character not found") };
    };
  };

  // Quest Functions
  public shared ({ caller }) func addQuest(id : Nat, title : Text, description : Text) : async QuestResult {
    // Admin-only function for creating quests
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create quests");
    };

    let quest = {
      id;
      title;
      description;
      status = #Available;
      objectives = [];
      rewards = {
        xp = 100;
        gold = 50;
        items = [];
      };
    };
    { narration = "Quest created with id " # id.toText(); quest = ?quest; success = true };
  };

  public query ({ caller }) func getQuestsByStatus(status : QuestStatus) : async [Quest] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access quests");
    };

    switch (characters.get(caller)) {
      case (?char) {
        char.quests.filter(func(quest) { quest.status == status });
      };
      case (null) { Runtime.trap("Character not found") };
    };
  };

  // Exploration Functions
  public shared ({ caller }) func explore() : async ExplorationResult {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can explore");
    };

    switch (characters.get(caller)) {
      case (?char) {
        let { zone } = char;
        {
          narration = "You explore the " # debug_show (zone);
          zone;
          encounter = null;
          loot = null;
          xpGained = 0;
          goldGained = 0;
          success = true;
        };
      };
      case (null) { Runtime.trap("Character not found") };
    };
  };

  // Combat Functions
  public shared ({ caller }) func attack() : async CombatResult {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can attack");
    };

    switch (characters.get(caller)) {
      case (?char) {
        {
          narration = "You attack the enemy!";
          playerHp = char.hp;
          enemyHp = 100;
          playerAction = "Attack";
          enemyAction = "Defend";
          xpGained = 0;
          goldGained = 0;
          leveledUp = false;
          success = true;
        };
      };
      case (null) { Runtime.trap("Character not found") };
    };
  };

  // Combat System Functions
  public shared ({ caller }) func startCombat(enemyName : Text, enemyHp : Nat) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can start combat");
    };

    let combat : ActiveCombat = {
      enemyName;
      enemyHp;
      maxHp = enemyHp;
    };
    activeCombats.add(caller, combat);
    true;
  };

  public query ({ caller }) func getActiveCombat() : async ?ActiveCombat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view combat");
    };

    activeCombats.get(caller);
  };

  public shared ({ caller }) func attackEnemy() : async CombatResult {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can attack");
    };

    switch (characters.get(caller)) {
      case (?char) {
        {
          narration = "You attack the enemy!";
          playerHp = char.hp;
          enemyHp = 100;
          playerAction = "Attack";
          enemyAction = "Defend";
          xpGained = 0;
          goldGained = 0;
          leveledUp = false;
          success = true;
        };
      };
      case (null) { Runtime.trap("Character not found") };
    };
  };

  public shared ({ caller }) func fleeCombat() : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can flee combat");
    };

    activeCombats.remove(caller);
    true;
  };

  // Exploration System Functions
  public shared ({ caller }) func exploreZone(zone : Zone) : async ExplorationResult {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can explore");
    };

    switch (characters.get(caller)) {
      case (?char) {
        {
          narration = "You explore the " # debug_show (zone);
          zone;
          encounter = null;
          loot = null;
          xpGained = 0;
          goldGained = 0;
          success = true;
        };
      };
      case (null) { Runtime.trap("Character not found") };
    };
  };

  public shared ({ caller }) func travelToZone(zone : Zone) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can travel");
    };

    switch (characters.get(caller)) {
      case (?char) { true };
      case (null) { Runtime.trap("Character not found") };
    };
  };

  // Inventory System Functions
  public shared ({ caller }) func equipItem(itemId : Nat) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can equip items");
    };

    switch (characters.get(caller)) {
      case (?char) { true };
      case (null) { Runtime.trap("Character not found") };
    };
  };

  public shared ({ caller }) func usePotion(itemId : Nat) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can use potions");
    };

    switch (characters.get(caller)) {
      case (?char) { true };
      case (null) { Runtime.trap("Character not found") };
    };
  };

  // Quest System Functions
  public query ({ caller }) func getQuests() : async [Quest] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view quests");
    };

    switch (characters.get(caller)) {
      case (?char) { char.quests };
      case (null) { Runtime.trap("Character not found") };
    };
  };

  public shared ({ caller }) func acceptQuest(questId : Nat) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can accept quests");
    };

    switch (characters.get(caller)) {
      case (?char) { true };
      case (null) { Runtime.trap("Character not found") };
    };
  };

  // Messaging System Functions
  public shared ({ caller }) func sendMessage(toPrincipal : Principal, content : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send messages");
    };

    let fromName = switch (characters.get(caller)) {
      case (?char) { char.name };
      case (null) { "Unknown" };
    };

    let message : Message = {
      id = nextMessageId;
      fromPrincipal = caller;
      fromName;
      toPrincipal;
      content;
      timestamp = nowMillis();
      read = false;
    };

    messages.add(nextMessageId, message);
    nextMessageId += 1;
    true;
  };

  public query ({ caller }) func getInbox() : async [Message] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view inbox");
    };

    let inbox = messages.values().filter(func(msg : Message) : Bool {
      msg.toPrincipal == caller;
    }).toArray();

    inbox.sort(func(a : Message, b : Message) : Order.Order {
      Int.compare(b.timestamp, a.timestamp);
    });
  };

  public query ({ caller }) func getSentMessages() : async [Message] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view sent messages");
    };

    messages.values().filter(func(msg : Message) : Bool {
      msg.fromPrincipal == caller;
    }).toArray();
  };

  public shared ({ caller }) func markMessageRead(messageId : Nat) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can mark messages as read");
    };

    switch (messages.get(messageId)) {
      case (?msg) {
        if (msg.toPrincipal != caller) {
          Runtime.trap("Unauthorized: Can only mark your own messages as read");
        };
        let updatedMsg = { msg with read = true };
        messages.add(messageId, updatedMsg);
        true;
      };
      case (null) { false };
    };
  };

  public query ({ caller }) func getUnreadCount() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view unread count");
    };

    messages.values().filter(func(msg : Message) : Bool {
      msg.toPrincipal == caller and not msg.read;
    }).toArray().size();
  };
};

