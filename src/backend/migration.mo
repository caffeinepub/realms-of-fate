import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";

module {
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

  type OldCharacter = {
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
  };

  type NewCharacter = {
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

  type OldActor = {
    characters : Map.Map<Principal, OldCharacter>;
  };

  type NewActor = {
    characters : Map.Map<Principal, NewCharacter>;
  };

  public func run(old : OldActor) : NewActor {
    let newCharacters = old.characters.map<Principal, OldCharacter, NewCharacter>(
      func(_principal, oldCharacter) {
        { oldCharacter with backstory = "A mysterious hero." };
      }
    );
    { characters = newCharacters };
  };
};
