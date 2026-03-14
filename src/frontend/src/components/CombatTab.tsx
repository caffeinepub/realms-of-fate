import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Shield, Skull, Swords, Zap } from "lucide-react";
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

interface CombatTabProps {
  activeEnemy: string | null;
  activeEnemyHp: number;
  playerMaxHp: number;
  playerCurrentHp: number;
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
  onCombatEnd,
}: CombatTabProps) {
  const [combatLog, setCombatLog] = useState<CombatEntry[]>([]);
  const [enemyHp, setEnemyHp] = useState(activeEnemyHp);
  const [enemyMaxHp, setEnemyMaxHp] = useState(activeEnemyHp);
  const [currentPlayerHp, setCurrentPlayerHp] = useState(playerCurrentHp);
  const [diceRolling, setDiceRolling] = useState(false);
  const [combatStarted, setCombatStarted] = useState(false);
  const [combatEnded, setCombatEnded] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);
  const prevEnemyRef = useRef<string | null>(null);
  const queryClient = useQueryClient();

  const attackEnemy = useAttackEnemy();
  const startCombat = useStartCombat();
  const fleeCombat = useFleeCombat();

  // When a new enemy arrives, start the combat
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
      startCombat.mutate({ enemyName: activeEnemy, enemyHp: hp });
    }
    if (!activeEnemy) {
      prevEnemyRef.current = null;
      setCombatStarted(false);
      setCombatEnded(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEnemy, activeEnemyHp, playerCurrentHp]);

  const handleAttack = async () => {
    setDiceRolling(true);
    try {
      const result: CombatResult = await attackEnemy.mutateAsync();
      setDiceRolling(false);

      const newEnemyHp = Number(result.enemyHp);
      const newPlayerHp = Number(result.playerHp);
      setEnemyHp(newEnemyHp);
      setCurrentPlayerHp(newPlayerHp);

      const entry: CombatEntry = {
        narration: result.narration,
        playerAction: result.playerAction,
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
  const isLowHp = playerPct <= 25;

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

            {/* Dice */}
            <div className="flex justify-center">
              <DiceAnimation rolling={diceRolling} />
            </div>

            {/* Actions */}
            <div className="flex gap-3 flex-wrap">
              <Button
                data-ocid="combat.attack.button"
                onClick={handleAttack}
                disabled={attackEnemy.isPending || combatEnded}
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
