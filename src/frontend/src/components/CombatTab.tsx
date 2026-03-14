import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Shield,
  Skull,
  Swords,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { CombatResult } from "../backend";
import {
  useAttackEnemy,
  useFleeCombat,
  useStartCombat,
} from "../hooks/useQueries";

interface CombatEntry {
  narration: string;
  playerAction: string;
  enemyAction: string;
  playerHp: number;
  enemyHp: number;
  xpGained: number;
  goldGained: number;
  leveledUp: boolean;
  timestamp: number;
}

interface SpellDef {
  name: string;
  icon: string;
  mpCost: number;
  desc: string;
  damageMultiplier: number;
  healAmount: number;
  effect: string;
}

const CLASS_SPELLS: Record<string, SpellDef[]> = {
  Warrior: [
    {
      name: "Cleave",
      icon: "⚔️",
      mpCost: 15,
      desc: "Sweeping blade hits all nearby foes.",
      damageMultiplier: 2.0,
      healAmount: 0,
      effect: "damage",
    },
    {
      name: "Shield Bash",
      icon: "🛡️",
      mpCost: 10,
      desc: "Stun the enemy with your shield.",
      damageMultiplier: 1.2,
      healAmount: 0,
      effect: "stun",
    },
    {
      name: "Berserker Rage",
      icon: "💢",
      mpCost: 20,
      desc: "Triple your fury for one devastating blow.",
      damageMultiplier: 3.0,
      healAmount: 0,
      effect: "damage",
    },
    {
      name: "War Cry",
      icon: "📣",
      mpCost: 5,
      desc: "Embolden yourself to resist the next strike.",
      damageMultiplier: 0.5,
      healAmount: 0,
      effect: "buff",
    },
  ],
  Mage: [
    {
      name: "Fireball",
      icon: "🔥",
      mpCost: 30,
      desc: "A scorching orb of pure arcane flame.",
      damageMultiplier: 2.5,
      healAmount: 0,
      effect: "damage",
    },
    {
      name: "Ice Lance",
      icon: "❄️",
      mpCost: 20,
      desc: "A shard of ice that slows and pierces.",
      damageMultiplier: 1.8,
      healAmount: 0,
      effect: "slow",
    },
    {
      name: "Arcane Bolt",
      icon: "⚡",
      mpCost: 15,
      desc: "Focused magical energy strikes the foe.",
      damageMultiplier: 1.5,
      healAmount: 0,
      effect: "damage",
    },
    {
      name: "Mana Shield",
      icon: "🔮",
      mpCost: 25,
      desc: "Arcane barrier absorbs the next blow.",
      damageMultiplier: 0,
      healAmount: 0,
      effect: "shield",
    },
  ],
  Rogue: [
    {
      name: "Backstab",
      icon: "🗡️",
      mpCost: 20,
      desc: "Strike from the shadows for massive damage.",
      damageMultiplier: 3.0,
      healAmount: 0,
      effect: "damage",
    },
    {
      name: "Poison Strike",
      icon: "☠️",
      mpCost: 15,
      desc: "Coat your blade in venom.",
      damageMultiplier: 1.4,
      healAmount: 0,
      effect: "poison",
    },
    {
      name: "Shadow Step",
      icon: "👤",
      mpCost: 10,
      desc: "Vanish and reposition instantly.",
      damageMultiplier: 0,
      healAmount: 0,
      effect: "dodge",
    },
    {
      name: "Smoke Bomb",
      icon: "💨",
      mpCost: 5,
      desc: "Blind the enemy, reducing their accuracy.",
      damageMultiplier: 0.3,
      healAmount: 0,
      effect: "blind",
    },
  ],
  Cleric: [
    {
      name: "Holy Smite",
      icon: "✨",
      mpCost: 20,
      desc: "Channelled divine energy scorches undead.",
      damageMultiplier: 2.0,
      healAmount: 0,
      effect: "holy",
    },
    {
      name: "Heal",
      icon: "💚",
      mpCost: 25,
      desc: "Restore your own wounds with sacred light.",
      damageMultiplier: 0,
      healAmount: 60,
      effect: "heal",
    },
    {
      name: "Divine Shield",
      icon: "🌟",
      mpCost: 30,
      desc: "A radiant barrier blocks the next 3 attacks.",
      damageMultiplier: 0,
      healAmount: 0,
      effect: "shield",
    },
    {
      name: "Radiant Wave",
      icon: "☀️",
      mpCost: 35,
      desc: "A wave of holy light damages all enemies.",
      damageMultiplier: 2.2,
      healAmount: 0,
      effect: "aoe",
    },
  ],
};

const SPELL_FLAVOR: Record<string, string> = {
  Cleave:
    "You swing your blade in a wide arc, carving through everything in reach!",
  "Shield Bash": "You crash your shield into the foe with a thunderous crack!",
  "Berserker Rage": "Red fury engulfs you — your strike is unstoppable!",
  "War Cry":
    "Your battle cry echoes through the battlefield, steeling your resolve!",
  Fireball: "You unleash Fireball! The arcane flames engulf your foe.",
  "Ice Lance": "A jagged shard of ice pierces through the enemy!",
  "Arcane Bolt": "Raw magical force explodes from your fingertips!",
  "Mana Shield": "Arcane energy wraps around you like a luminous barrier.",
  Backstab:
    "You slip into the shadows and emerge behind your foe — critical strike!",
  "Poison Strike": "Venom coats your blade; the enemy recoils in agony!",
  "Shadow Step": "You vanish in a blink, reappearing at a tactical advantage!",
  "Smoke Bomb": "A cloud of smoke blinds the enemy, disrupting their attack!",
  "Holy Smite":
    "Divine wrath channels through your hand — the foe is scorched by sacred light!",
  Heal: "Sacred light washes over your wounds, knitting flesh and restoring vitality!",
  "Divine Shield": "A radiant barrier of holy energy surrounds you!",
  "Radiant Wave":
    "A blinding wave of holy light ripples outward, devastating all foes!",
};

interface CombatTabProps {
  activeEnemy: string | null;
  activeEnemyHp: number;
  playerMaxHp: number;
  playerCurrentHp: number;
  characterClass: string;
  onCombatEnd: () => void;
}

function DiceAnimation({ rolling }: { rolling: boolean }) {
  const faces = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
  const [face, setFace] = useState(5);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (rolling) {
      intervalRef.current = setInterval(() => {
        setFace(Math.floor(Math.random() * 6));
      }, 100);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setFace(5);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [rolling]);

  return (
    <div
      className={`text-4xl select-none transition-transform ${
        rolling ? "scale-125" : ""
      }`}
    >
      {faces[face]}
    </div>
  );
}

export default function CombatTab({
  activeEnemy,
  activeEnemyHp,
  playerMaxHp,
  playerCurrentHp,
  characterClass,
  onCombatEnd,
}: CombatTabProps) {
  const [combatLog, setCombatLog] = useState<CombatEntry[]>([]);
  const [enemyHp, setEnemyHp] = useState(activeEnemyHp);
  const [enemyMaxHp, setEnemyMaxHp] = useState(activeEnemyHp);
  const [currentPlayerHp, setCurrentPlayerHp] = useState(playerCurrentHp);
  const [diceRolling, setDiceRolling] = useState(false);
  const [combatStarted, setCombatStarted] = useState(false);
  const [combatEnded, setCombatEnded] = useState(false);
  const [spellsOpen, setSpellsOpen] = useState(true);
  // MP tracking
  const maxMp = 100;
  const [localMp, setLocalMp] = useState(maxMp);
  // Spell cooldowns: spellName -> rounds remaining
  const [spellCooldowns, setSpellCooldowns] = useState<Record<string, number>>(
    {},
  );

  const logEndRef = useRef<HTMLDivElement>(null);
  const prevEnemyRef = useRef<string | null>(null);
  const queryClient = useQueryClient();

  const attackEnemy = useAttackEnemy();
  const startCombat = useStartCombat();
  const fleeCombat = useFleeCombat();

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    if (activeEnemy && activeEnemy !== prevEnemyRef.current) {
      prevEnemyRef.current = activeEnemy;
      const hp = activeEnemyHp || 100;
      setEnemyHp(hp);
      setEnemyMaxHp(hp);
      setCombatStarted(true);
      setCombatEnded(false);
      setCombatLog([]);
      setCurrentPlayerHp(playerCurrentHp);
      setLocalMp(maxMp);
      setSpellCooldowns({});
      startCombat.mutate({ enemyName: activeEnemy, enemyHp: hp });
    }
    if (!activeEnemy) {
      prevEnemyRef.current = null;
      setCombatStarted(false);
      setCombatEnded(false);
    }
  }, [activeEnemy, activeEnemyHp, playerCurrentHp]);

  // Decrement cooldowns after each round
  const tickCooldowns = () => {
    setSpellCooldowns((prev) => {
      const next: Record<string, number> = {};
      for (const [k, v] of Object.entries(prev)) {
        if (v > 1) next[k] = v - 1;
      }
      return next;
    });
  };

  const processCombatResult = (
    result: CombatResult,
    overrideAction?: string,
    overrideNarration?: string,
  ) => {
    const newEnemyHp = Number(result.enemyHp);
    const newPlayerHp = Number(result.playerHp);
    setEnemyHp(newEnemyHp);
    setCurrentPlayerHp(newPlayerHp);

    const entry: CombatEntry = {
      narration: overrideNarration ?? result.narration,
      playerAction: overrideAction ?? result.playerAction,
      enemyAction: result.enemyAction,
      playerHp: newPlayerHp,
      enemyHp: newEnemyHp,
      xpGained: Number(result.xpGained),
      goldGained: Number(result.goldGained),
      leveledUp: result.leveledUp,
      timestamp: Date.now(),
    };

    setCombatLog((prev) => [...prev.slice(-9), entry]);

    if (result.leveledUp) {
      toast.success("⭐ LEVEL UP! You grow stronger!", { duration: 4000 });
    }
    if (Number(result.xpGained) > 0) {
      toast(
        `+${Number(result.xpGained)} XP | +${Number(result.goldGained)} Gold`,
        { duration: 2000 },
      );
    }

    setTimeout(() => {
      logEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);

    if (newEnemyHp <= 0) {
      setCombatEnded(true);
      queryClient.invalidateQueries({ queryKey: ["character"] });
      setTimeout(() => {
        prevEnemyRef.current = null;
        setCombatStarted(false);
        setCombatEnded(false);
        setCombatLog([]);
        onCombatEnd();
      }, 3000);
    }

    if (newPlayerHp <= 0) {
      toast.error("💀 You have been defeated! Retreating...", {
        duration: 4000,
      });
      setCombatEnded(true);
      queryClient.invalidateQueries({ queryKey: ["character"] });
      setTimeout(() => {
        prevEnemyRef.current = null;
        setCombatStarted(false);
        setCombatEnded(false);
        setCombatLog([]);
        onCombatEnd();
      }, 3000);
    }
  };

  const handleAttack = async () => {
    setDiceRolling(true);
    try {
      const result: CombatResult = await attackEnemy.mutateAsync();
      setDiceRolling(false);
      tickCooldowns();
      processCombatResult(result);
    } catch {
      setDiceRolling(false);
    }
  };

  const handleCastSpell = async (spell: SpellDef) => {
    if (localMp < spell.mpCost) {
      toast.error("Not enough MP!");
      return;
    }
    if (spellCooldowns[spell.name]) {
      toast.error(`${spell.name} is on cooldown!`);
      return;
    }

    setLocalMp((prev) => prev - spell.mpCost);
    setSpellCooldowns((prev) => ({ ...prev, [spell.name]: 1 }));
    setDiceRolling(true);

    try {
      const result: CombatResult = await attackEnemy.mutateAsync();
      setDiceRolling(false);
      tickCooldowns();

      // Apply heal if applicable
      if (spell.healAmount > 0) {
        setCurrentPlayerHp((prev) =>
          Math.min(prev + spell.healAmount, playerMaxHp),
        );
      }

      const flavor = SPELL_FLAVOR[spell.name] ?? `You cast ${spell.name}!`;
      processCombatResult(result, `${spell.icon} ${spell.name}`, flavor);
    } catch {
      setDiceRolling(false);
    }
  };

  const handleFlee = async () => {
    await fleeCombat.mutateAsync();
    prevEnemyRef.current = null;
    setCombatLog([]);
    setCombatStarted(false);
    setCombatEnded(false);
    onCombatEnd();
  };

  const enemyPct = enemyMaxHp > 0 ? (enemyHp / enemyMaxHp) * 100 : 0;
  const playerPct = playerMaxHp > 0 ? (currentPlayerHp / playerMaxHp) * 100 : 0;
  const mpPct = (localMp / maxMp) * 100;
  const isLowHp = playerPct <= 25;

  const spells = CLASS_SPELLS[characterClass] ?? CLASS_SPELLS.Warrior;
  const isBusy = attackEnemy.isPending || combatEnded;

  if (!activeEnemy || !combatStarted) {
    return (
      <motion.div
        data-ocid="combat.empty_state"
        className="text-center py-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Shield className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="font-display text-2xl text-muted-foreground mb-2">
          No Active Combat
        </h3>
        <p className="text-muted-foreground/60 text-sm max-w-xs mx-auto">
          Venture into the wilds to find enemies worth fighting. Explore a zone
          to trigger an encounter.
        </p>
        <div className="mt-8 grid grid-cols-2 gap-4 max-w-sm mx-auto">
          <img
            src="/assets/generated/mystic-dragon.dim_800x500.jpg"
            alt="Dragon"
            className="rounded-lg w-full h-28 object-cover opacity-60"
          />
          <img
            src="/assets/generated/mystic-necromancer.dim_800x500.jpg"
            alt="Necromancer"
            className="rounded-lg w-full h-28 object-cover opacity-60"
          />
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {/* Battle Arena */}
        <Card
          className={`fantasy-border ${isLowHp ? "danger-pulse" : ""} bg-card/80`}
        >
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-lg text-accent flex items-center gap-2">
              <Swords className="w-5 h-5" /> Battle: {activeEnemy}
              {combatEnded && enemyHp <= 0 && (
                <span className="ml-auto text-emerald-400 text-sm animate-pulse">
                  Victory!
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Enemy HP */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skull className="w-4 h-4 text-accent" />
                  <span className="font-display text-foreground">
                    {activeEnemy}
                  </span>
                </div>
                <span className="text-sm text-accent">
                  {Math.max(0, enemyHp)}/{enemyMaxHp} HP
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-muted/30 overflow-hidden">
                <motion.div
                  className="h-full bg-hp rounded-full"
                  animate={{ width: `${Math.max(0, enemyPct)}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            <div className="border-t border-border/30" />

            {/* Player HP */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="font-display text-foreground">You</span>
                </div>
                <span className="text-sm text-primary">
                  {Math.max(0, currentPlayerHp)}/{playerMaxHp} HP
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-muted/30 overflow-hidden">
                <motion.div
                  className="h-full bg-mp rounded-full"
                  animate={{ width: `${Math.max(0, playerPct)}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* MP Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-body">
                  ✨ MP
                </span>
                <span className="text-xs text-mp">
                  {localMp}/{maxMp}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-muted/30 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "oklch(var(--mp))" }}
                  animate={{ width: `${mpPct}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>

            {/* Dice */}
            <div className="flex justify-center">
              <DiceAnimation rolling={diceRolling} />
            </div>

            {/* Actions */}
            <div className="flex gap-3 flex-wrap">
              <Button
                data-ocid="combat.attack.button"
                onClick={handleAttack}
                disabled={isBusy}
                className="flex-1 bg-accent text-accent-foreground hover:bg-accent/80 glow-red font-display"
              >
                {attackEnemy.isPending ? (
                  <span className="flex items-center gap-2">
                    <Zap className="w-4 h-4 animate-pulse" /> Attacking...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Swords className="w-4 h-4" /> Attack
                  </span>
                )}
              </Button>
              <Button
                data-ocid="combat.flee.button"
                onClick={handleFlee}
                disabled={fleeCombat.isPending || combatEnded}
                variant="outline"
                className="border-border/60 text-muted-foreground hover:text-foreground hover:border-border font-display"
              >
                {fleeCombat.isPending ? "Fleeing..." : "🏃 Flee"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Spells & Abilities Panel */}
        <Collapsible open={spellsOpen} onOpenChange={setSpellsOpen}>
          <Card className="fantasy-border bg-card/60">
            <CollapsibleTrigger asChild>
              <CardHeader
                data-ocid="combat.spells.toggle"
                className="pb-3 cursor-pointer hover:bg-card/80 transition-colors rounded-t-lg"
              >
                <CardTitle className="font-display text-sm text-muted-foreground flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    ✨ Spells &amp; Abilities
                    <Badge
                      variant="outline"
                      className="text-mp border-mp/40 text-xs"
                    >
                      {localMp} MP
                    </Badge>
                  </span>
                  {spellsOpen ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-2">
                  {spells.map((spell, idx) => {
                    const onCooldown = (spellCooldowns[spell.name] ?? 0) > 0;
                    const notEnoughMp = localMp < spell.mpCost;
                    const disabled = isBusy || onCooldown || notEnoughMp;
                    return (
                      <button
                        type="button"
                        key={spell.name}
                        data-ocid={`combat.spell.button.${idx + 1}`}
                        onClick={() => handleCastSpell(spell)}
                        disabled={disabled}
                        className={`p-3 rounded-lg text-left transition-all duration-200 fantasy-border ${
                          disabled
                            ? "opacity-40 cursor-not-allowed bg-muted/20"
                            : "bg-card/80 hover:bg-primary/10 hover:border-primary/40 hover:glow-gold"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-lg">{spell.icon}</span>
                            <span className="font-display text-sm text-foreground">
                              {spell.name}
                            </span>
                          </div>
                          <Badge
                            variant="outline"
                            className="text-[10px] border-mp/40 text-mp shrink-0"
                          >
                            {spell.mpCost} MP
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {spell.desc}
                        </p>
                        {onCooldown && (
                          <p className="text-xs text-muted-foreground/50 mt-1">
                            (cooldown)
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Combat Log */}
        {combatLog.length > 0 && (
          <Card
            data-ocid="combat.log.panel"
            className="fantasy-border bg-card/60"
          >
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-sm text-muted-foreground flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> Combat Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-52">
                <div className="space-y-3 pr-2">
                  <AnimatePresence>
                    {combatLog.map((entry, idx) => (
                      <motion.div
                        key={entry.timestamp}
                        className="parchment rounded p-3 text-sm"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                      >
                        <p
                          className="leading-relaxed mb-2"
                          style={{ color: "oklch(var(--parchment-fg))" }}
                        >
                          {entry.narration}
                        </p>
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <span className="text-primary">
                            You: {entry.playerAction}
                          </span>
                          <span className="text-accent">
                            Enemy: {entry.enemyAction}
                          </span>
                          {entry.xpGained > 0 && (
                            <span className="text-xp">
                              +{entry.xpGained} XP
                            </span>
                          )}
                          {entry.goldGained > 0 && (
                            <span className="text-gold">
                              +{entry.goldGained} 💰
                            </span>
                          )}
                          {entry.leveledUp && (
                            <span className="text-gold animate-pulse">
                              ⭐ LEVEL UP!
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <div ref={logEndRef} />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
