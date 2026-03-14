import { Badge } from "@/components/ui/badge";
import { Coins, Mail, Shield } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Character } from "../backend";
import { useUnreadCount } from "../hooks/useQueries";

interface HUDProps {
  character: Character;
  onCommunityClick?: () => void;
}

function StatBar({
  label,
  current,
  max,
  colorClass,
}: { label: string; current: number; max: number; colorClass: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0;
  const isLow = pct <= 25;
  return (
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-muted-foreground font-body">{label}</span>
        <span className="text-xs text-foreground font-body">
          {current}/{max}
        </span>
      </div>
      <div
        className={`w-full h-2 rounded-full bg-muted/30 overflow-hidden ${
          isLow && label === "HP" ? "danger-pulse rounded-full" : ""
        }`}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function HUD({ character, onCommunityClick }: HUDProps) {
  const hp = Number(character.hp);
  const maxHp = Number(character.maxHp);
  const mp = Number(character.mp);
  const maxMp = Number(character.maxMp);
  const xp = Number(character.xp);
  const xpToNext = Number(character.xpToNext);
  const level = Number(character.level);
  const gold = Number(character.gold);

  const raceLabel = String(character.race);
  const classLabel = String(character.charClass);
  const zoneLabel = String(character.zone);

  const { data: unreadCount = 0 } = useUnreadCount();

  const prevLevel = useRef(level);
  const [showLevelUp, setShowLevelUp] = useState(false);

  useEffect(() => {
    if (level > prevLevel.current) {
      setShowLevelUp(true);
      const t = setTimeout(() => setShowLevelUp(false), 3000);
      return () => clearTimeout(t);
    }
    prevLevel.current = level;
  }, [level]);

  return (
    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50">
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-primary/10 rounded" />
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gold font-display text-2xl font-bold z-10 text-center pointer-events-none"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
            >
              ✨ LEVEL UP! ✨
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto px-4 py-3">
        <div className="flex flex-wrap items-center gap-4">
          {/* Name + Level */}
          <div className="flex items-center gap-2 min-w-0">
            <div>
              <div className="font-display text-lg text-gold leading-tight">
                {character.name}
              </div>
              <div className="flex items-center gap-1">
                <Badge
                  variant="outline"
                  className="text-xs border-border/60 text-muted-foreground"
                >
                  {raceLabel}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-xs border-border/60 text-muted-foreground"
                >
                  {classLabel}
                </Badge>
              </div>
            </div>
            <motion.div
              className="text-center ml-2"
              animate={showLevelUp ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 0.5 }}
            >
              <div className="text-xs text-muted-foreground">LVL</div>
              <div className="font-display text-2xl text-gold leading-none">
                {level}
              </div>
            </motion.div>
          </div>

          {/* Bars */}
          <div className="flex-1 flex gap-3 min-w-0 flex-wrap">
            <StatBar label="HP" current={hp} max={maxHp} colorClass="bg-hp" />
            <StatBar label="MP" current={mp} max={maxMp} colorClass="bg-mp" />
            <StatBar
              label={`XP → Lvl ${level + 1}`}
              current={xp}
              max={xpToNext}
              colorClass="bg-xp"
            />
          </div>

          {/* Gold */}
          <div className="flex items-center gap-1.5 text-gold">
            <Coins className="w-4 h-4" />
            <span className="font-display text-lg">{gold}</span>
          </div>

          {/* Zone */}
          <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
            <Shield className="w-4 h-4" />
            <span>{zoneLabel}</span>
          </div>

          {/* Messages Badge */}
          {onCommunityClick && (
            <button
              type="button"
              data-ocid="hud.messages.button"
              onClick={onCommunityClick}
              className="relative flex items-center gap-1 text-muted-foreground hover:text-gold transition-colors"
            >
              <Mail className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-accent text-accent-foreground text-[10px] flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
