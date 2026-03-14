import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface ExplorationResult {
    loot?: Array<Item>;
    zone: Zone;
    xpGained: bigint;
    narration: string;
    goldGained: bigint;
    success: boolean;
    encounter?: string;
}
export interface ActiveCombat {
    maxHp: bigint;
    enemyName: string;
    enemyHp: bigint;
}
export interface QuestResult {
    quest?: Quest;
    narration: string;
    success: boolean;
}
export interface StatBonus {
    hp: bigint;
    mp: bigint;
    speed: bigint;
    defense: bigint;
    attack: bigint;
}
export interface ItemResult {
    item?: Item;
    narration: string;
    success: boolean;
}
export interface Character {
    hp: bigint;
    mp: bigint;
    xp: bigint;
    charClass: Class;
    maxHp: bigint;
    maxMp: bigint;
    gold: bigint;
    inventory: Array<Item>;
    name: string;
    race: Race;
    zone: Zone;
    level: bigint;
    speed: bigint;
    defense: bigint;
    xpToNext: bigint;
    backstory: string;
    quests: Array<Quest>;
    attack: bigint;
}
export interface Item {
    id: bigint;
    statBonus: StatBonus;
    name: string;
    description: string;
    equipped: boolean;
    itemType: ItemType;
    quantity: bigint;
}
export interface CreateCharacterResult {
    character?: Character;
    narration: string;
    success: boolean;
}
export interface Message {
    id: bigint;
    content: string;
    read: boolean;
    toPrincipal: Principal;
    fromPrincipal: Principal;
    timestamp: bigint;
    fromName: string;
}
export interface Quest {
    id: bigint;
    status: QuestStatus;
    title: string;
    description: string;
    rewards: {
        xp: bigint;
        gold: bigint;
        items: Array<Item>;
    };
    objectives: Array<Objective>;
}
export interface CombatResult {
    playerAction: string;
    playerHp: bigint;
    xpGained: bigint;
    leveledUp: boolean;
    narration: string;
    goldGained: bigint;
    success: boolean;
    enemyHp: bigint;
    enemyAction: string;
}
export interface Objective {
    text: string;
    completed: boolean;
}
export interface UserProfile {
    name: string;
    characterCreated: boolean;
}
export enum Class {
    Mage = "Mage",
    Cleric = "Cleric",
    Rogue = "Rogue",
    Warrior = "Warrior"
}
export enum ItemType {
    Weapon = "Weapon",
    Potion = "Potion",
    Misc = "Misc",
    Armor = "Armor"
}
export enum QuestStatus {
    Available = "Available",
    Active = "Active",
    Completed = "Completed"
}
export enum Race {
    Elf = "Elf",
    Orc = "Orc",
    Dwarf = "Dwarf",
    Human = "Human"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Zone {
    Forest = "Forest",
    Town = "Town",
    Mountains = "Mountains",
    Dungeon = "Dungeon",
    Castle = "Castle"
}
export interface backendInterface {
    acceptQuest(questId: bigint): Promise<boolean>;
    addItem(id: bigint, name: string, itemType: ItemType, description: string, statBonus: StatBonus): Promise<ItemResult>;
    addQuest(id: bigint, title: string, description: string): Promise<QuestResult>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    attack(): Promise<CombatResult>;
    attackEnemy(): Promise<CombatResult>;
    createCharacter(name: string, race: Race, charClass: Class): Promise<CreateCharacterResult>;
    equipItem(itemId: bigint): Promise<boolean>;
    explore(): Promise<ExplorationResult>;
    exploreZone(zone: Zone): Promise<ExplorationResult>;
    fleeCombat(): Promise<boolean>;
    getActiveCombat(): Promise<ActiveCombat | null>;
    getAllCharacters(): Promise<Array<Character>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCharacter(): Promise<Character>;
    getInbox(): Promise<Array<Message>>;
    getInventory(): Promise<Array<Item>>;
    getItemsById(id: bigint): Promise<Array<Item>>;
    getQuests(): Promise<Array<Quest>>;
    getQuestsByStatus(status: QuestStatus): Promise<Array<Quest>>;
    getSentMessages(): Promise<Array<Message>>;
    getUnreadCount(): Promise<bigint>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    markMessageRead(messageId: bigint): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendMessage(toPrincipal: Principal, content: string): Promise<boolean>;
    startCombat(enemyName: string, enemyHp: bigint): Promise<boolean>;
    travelToZone(zone: Zone): Promise<boolean>;
    usePotion(itemId: bigint): Promise<boolean>;
}
