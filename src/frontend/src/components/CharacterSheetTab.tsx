import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Coins, Shield, Swords, Wind, Zap } from "lucide-react";
import { motion } from "motion/react";
import type { Character, ItemType } from "../backend";

const RACE_LORE: Record<string, string> = {
  Human:
    "Born of the Great Mixing, humans carry the blood of ancient pacts between mortal and divine. Your adaptability is legendary — where others specialize, you endure. The world was not made for humanity, but humanity has made the world its own.",
  Elf: "Your ancestors walked these lands when the stars were young. The elves carry memories in their blood — of an age of wonder when magic flowed freely and the world sang. What was lost can be found again, if only one knows where to look.",
  Dwarf:
    "Forged in the deep places of the world, dwarves are the children of the mountain. Your people built empires in stone and silence, and though the great citadels have fallen, the spirit of the forge burns eternal in your heart.",
  Orc: "The orcs remember a time before the great betrayal, when your people ruled the northern wastes with honor. Strength is your birthright, but wisdom is the shield. You fight not for glory, but for those who cannot fight for themselves.",
};

const CLASS_LORE: Record<string, string> = {
  Warrior:
    "You are the shield against the dark. Years of training, countless scars, and an iron will have forged you into something beyond ordinary men. Where others flee, you stand.",
  Mage: "The arcane arts chose you before you could speak. You see the world as others cannot — a web of invisible threads that, if pulled correctly, can reshape reality itself. Power comes at a price, and you have paid it.",
  Rogue:
    "The city's shadows are your home. You learned that survival belongs to the swift, the clever, and the ruthless. You don't pick fights you can't win — you arrange fights the enemy doesn't know they've already lost.",
  Cleric:
    "The gods are silent, but not absent. You hear them in the quiet moments, in the weight of a dying soldier's last breath, in the impossible healing that happens when faith meets desperate need. You are their instrument.",
};

const RACE_EMOJI: Record<string, string> = {
  Human: "👤",
  Elf: "🧝",
  Dwarf: "⛏️",
  Orc: "💪",
};

const CLASS_EMOJI: Record<string, string> = {
  Warrior: "⚔️",
  Mage: "🔮",
  Rogue: "🗡️",
  Cleric: "✨",
};

function getItemKind(itemType: ItemType): string {
  return (
    (itemType as unknown as { __kind__: string }).__kind__ || String(itemType)
  );
}

interface StatRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color?: string;
}

function StatRow({
  icon,
  label,
  value,
  color = "text-foreground",
}: StatRowProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/20">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        {icon}
        <span>{label}</span>
      </div>
      <span className={`font-display text-base font-semibold ${color}`}>
        {value}
      </span>
    </div>
  );
}

interface CharacterSheetTabProps {
  character: Character;
}

export default function CharacterSheetTab({
  character,
}: CharacterSheetTabProps) {
  const raceLabel = String(character.race);
  const classLabel = String(character.charClass);
  const zoneLabel = String(character.zone);

  const hp = Number(character.hp);
  const maxHp = Number(character.maxHp);
  const mp = Number(character.mp);
  const maxMp = Number(character.maxMp);
  const xp = Number(character.xp);
  const xpToNext = Number(character.xpToNext);
  const level = Number(character.level);
  const gold = Number(character.gold);
  const attack = Number(character.attack);
  const defense = Number(character.defense);
  const speed = Number(character.speed);

  const xpPct =
    xpToNext > 0 ? Math.min(100, Math.round((xp / xpToNext) * 100)) : 0;

  const equippedItems = character.inventory.filter((i) => i.equipped);

  return (
    <div className="space-y-6">
      {/* Portrait + Identity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="fantasy-border overflow-hidden">
          <div
            className="h-32 relative"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.12 0.03 265) 0%, oklch(0.16 0.06 82) 50%, oklch(0.12 0.03 265) 100%)",
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-7xl">{RACE_EMOJI[raceLabel] ?? "🧙"}</div>
            </div>
            <div className="absolute top-3 right-3 text-3xl">
              {CLASS_EMOJI[classLabel] ?? "⚔️"}
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-card to-transparent h-12" />
          </div>
          <CardContent className="pt-4 pb-5 px-5 space-y-2">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <h2 className="font-display text-3xl text-gold">
                  {character.name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant="outline"
                    className="border-border/60 text-muted-foreground"
                  >
                    {raceLabel}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-border/60 text-muted-foreground"
                  >
                    {classLabel}
                  </Badge>
                  <Badge className="bg-primary/20 text-gold border-primary/40">
                    Level {level}
                  </Badge>
                </div>
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                <span>{zoneLabel}</span>
              </div>
            </div>

            {/* XP Progress */}
            <div className="pt-2">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>XP Progress → Level {level + 1}</span>
                <span>
                  {xp} / {xpToNext}
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-muted/30 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-xp"
                  initial={{ width: 0 }}
                  animate={{ width: `${xpPct}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="fantasy-border bg-card/70 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-gold text-lg">
                Character Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <StatRow
                icon={<span className="text-hp">❤</span>}
                label="Hit Points"
                value={`${hp} / ${maxHp}`}
                color="text-hp"
              />
              <StatRow
                icon={<span className="text-mp">✦</span>}
                label="Mana Points"
                value={`${mp} / ${maxMp}`}
                color="text-mp"
              />
              <StatRow
                icon={<Swords className="w-4 h-4" />}
                label="Attack"
                value={String(attack)}
                color="text-red-400"
              />
              <StatRow
                icon={<Shield className="w-4 h-4" />}
                label="Defense"
                value={String(defense)}
                color="text-blue-400"
              />
              <StatRow
                icon={<Wind className="w-4 h-4" />}
                label="Speed"
                value={String(speed)}
                color="text-yellow-400"
              />
              <StatRow
                icon={<Zap className="w-4 h-4" />}
                label="Level"
                value={String(level)}
                color="text-gold"
              />
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Coins className="w-4 h-4" />
                  <span>Gold</span>
                </div>
                <span className="font-display text-base font-semibold text-gold">
                  {gold} 💰
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Equipped Items */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="fantasy-border bg-card/70 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-gold text-lg">
                Equipped Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              {equippedItems.length === 0 ? (
                <p className="text-muted-foreground/60 text-sm italic">
                  No items equipped. Visit the Inventory tab to gear up.
                </p>
              ) : (
                <div className="space-y-3">
                  {equippedItems.map((item) => {
                    const kind = getItemKind(item.itemType);
                    return (
                      <div
                        key={Number(item.id)}
                        className="flex items-start gap-3 p-2 rounded bg-primary/5 border border-primary/20"
                      >
                        <div className="text-lg">
                          {kind === "Weapon"
                            ? "⚔️"
                            : kind === "Armor"
                              ? "🛡️"
                              : "📦"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-display text-sm text-gold">
                            {item.name}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-2">
                            {Number(item.statBonus.attack) > 0 && (
                              <span className="text-red-400">
                                +{Number(item.statBonus.attack)} ATK
                              </span>
                            )}
                            {Number(item.statBonus.defense) > 0 && (
                              <span className="text-blue-400">
                                +{Number(item.statBonus.defense)} DEF
                              </span>
                            )}
                            {Number(item.statBonus.hp) > 0 && (
                              <span className="text-hp">
                                +{Number(item.statBonus.hp)} HP
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge className="bg-primary/20 text-gold border-primary/40 text-[10px]">
                          {kind}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Backstory */}
      {character.backstory && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="parchment rounded-lg">
            <CardHeader className="pb-2">
              <CardTitle
                className="font-display text-lg"
                style={{ color: "oklch(var(--gold))" }}
              >
                📖 Backstory
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className="text-sm leading-relaxed font-body"
                style={{ color: "oklch(var(--parchment-fg))" }}
              >
                {character.backstory}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Race & Class Lore */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="fantasy-border bg-card/70">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-gold text-base">
                {RACE_EMOJI[raceLabel]} The {raceLabel}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {RACE_LORE[raceLabel] ??
                  "An ancient and storied people whose history stretches back to the dawn of the world."}
              </p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="fantasy-border bg-card/70">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-gold text-base">
                {CLASS_EMOJI[classLabel]} The {classLabel}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {CLASS_LORE[classLabel] ??
                  "A master of combat whose skills have been honed through countless battles."}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Separator className="opacity-20" />

      {/* Quests Summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
      >
        <div className="text-xs text-center text-muted-foreground/60">
          Active quests:{" "}
          {
            character.quests.filter((q) => {
              const s =
                (q.status as unknown as { __kind__: string }).__kind__ ||
                String(q.status);
              return s === "Active";
            }).length
          }{" "}
          • Completed:{" "}
          {
            character.quests.filter((q) => {
              const s =
                (q.status as unknown as { __kind__: string }).__kind__ ||
                String(q.status);
              return s === "Completed";
            }).length
          }
        </div>
      </motion.div>
    </div>
  );
}
