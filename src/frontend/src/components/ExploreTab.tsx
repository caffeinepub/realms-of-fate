import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building2,
  Castle,
  Compass,
  Loader2,
  Mountain,
  Skull,
  Swords,
  TreePine,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { Character, ExplorationResult } from "../backend";
import { Zone } from "../backend";
import { useExploreZone, useTravelToZone } from "../hooks/useQueries";

const ZONE_DATA = [
  {
    zone: Zone.Town,
    label: "Town",
    icon: <Building2 className="w-5 h-5" />,
    danger: "Safe",
    dangerColor: "text-emerald-400",
    image: "/assets/generated/zone-town.dim_1200x700.jpg",
    lore: "Ironhaven, the last free city, stands as a beacon against the encroaching darkness. Its streets hum with desperate merchants, scarred veterans, and whispering spies. The Tavern of the Broken Sword serves as the gathering point for those brave or foolish enough to seek adventure beyond the city walls.",
  },
  {
    zone: Zone.Forest,
    label: "Forest",
    icon: <TreePine className="w-5 h-5" />,
    danger: "Moderate",
    dangerColor: "text-yellow-400",
    image: "/assets/generated/zone-forest.dim_1200x700.jpg",
    lore: "The Whispering Wood stretches for a hundred leagues, its ancient trees said to remember the age before men. Elven wardens patrol the misty paths, while darker things hunt from the shadows. Those who listen carefully claim the trees speak of a great evil stirring in the roots of the world.",
  },
  {
    zone: Zone.Dungeon,
    label: "Dungeon",
    icon: <Skull className="w-5 h-5" />,
    danger: "Dangerous",
    dangerColor: "text-orange-400",
    image: "/assets/generated/zone-dungeon.dim_1200x700.jpg",
    lore: "Beneath the Ashen Plains lie the Catacombs of Malgrath, a necromancer-king who refused death. His servants still walk the endless corridors, protecting the secrets he died to keep. The brave who venture here seek his legendary Tome of Unmaking — and few return.",
  },
  {
    zone: Zone.Mountains,
    label: "Mountains",
    icon: <Mountain className="w-5 h-5" />,
    danger: "Very Dangerous",
    dangerColor: "text-red-400",
    image: "/assets/generated/zone-mountains.dim_1200x700.jpg",
    lore: "The Thornspire Range divides the mortal world from the dragon territories above. The Dwarven citadel of Khaz'Dorrum was swallowed by the mountains three centuries ago. Now only echoes remain — and the occasional rumble that sounds disturbingly like footsteps.",
  },
  {
    zone: Zone.Castle,
    label: "Castle",
    icon: <Castle className="w-5 h-5" />,
    danger: "Deadly",
    dangerColor: "text-red-600",
    image: "/assets/generated/zone-castle.dim_1200x700.jpg",
    lore: "Castle Dread was once a seat of righteous kings. Now the Shadow Lord Malachar rules from its obsidian throne, his undead legions spreading across the realm. This is the final confrontation — the battle that will determine the fate of all living things.",
  },
];

interface ExploreTabProps {
  character: Character;
  onCombatEnter: (encounter: string, initialHp: number) => void;
}

export default function ExploreTab({
  character,
  onCombatEnter,
}: ExploreTabProps) {
  const [result, setResult] = useState<ExplorationResult | null>(null);
  const [travelingTo, setTravelingTo] = useState<Zone | null>(null);
  const exploreZone = useExploreZone();
  const travelToZone = useTravelToZone();

  const currentZoneLabel = String(character.zone);
  const currentZoneData =
    ZONE_DATA.find((z) => z.label === currentZoneLabel) ?? ZONE_DATA[0];

  const handleExplore = async () => {
    const res = await exploreZone.mutateAsync(currentZoneData.zone);
    setResult(res);
  };

  const handleTravel = async (zone: Zone, label: string) => {
    if (label === currentZoneLabel) return;
    setTravelingTo(zone);
    try {
      await travelToZone.mutateAsync(zone);
      setResult(null);
    } finally {
      setTravelingTo(null);
    }
  };

  const handleCombatEnter = (encounter: string) => {
    const level = Number(character.level);
    const initialHp = 80 + level * 5 + Math.floor(Math.random() * 30);
    onCombatEnter(encounter, initialHp);
  };

  return (
    <div className="space-y-6">
      {/* Current Zone Hero Banner */}
      <motion.div
        key={currentZoneLabel}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative rounded-xl overflow-hidden h-52 sm:h-64"
      >
        <img
          src={currentZoneData.image}
          alt={currentZoneData.label}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-primary/30 text-gold border-primary/40 text-xs">
                  Current Location
                </Badge>
                <Badge
                  variant="outline"
                  className={`text-xs border-border/40 ${currentZoneData.dangerColor}`}
                >
                  ⚠ {currentZoneData.danger}
                </Badge>
              </div>
              <h2
                className="font-display text-3xl text-gold"
                style={{ textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}
              >
                {currentZoneData.icon} {currentZoneLabel}
              </h2>
            </div>
            <Button
              data-ocid="explore.primary_button"
              onClick={handleExplore}
              disabled={exploreZone.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90 glow-gold font-display"
            >
              {exploreZone.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Exploring...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Compass className="w-4 h-4" /> Explore
                </span>
              )}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Zone Lore */}
      <div className="parchment rounded-lg p-4">
        <p
          className="text-sm leading-relaxed font-body"
          style={{ color: "oklch(var(--parchment-fg))" }}
        >
          {currentZoneData.lore}
        </p>
      </div>

      {/* Exploration Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            data-ocid="explore.result.panel"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="parchment rounded-lg">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-xl text-gold flex items-center gap-2">
                  📜 Expedition Report
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p
                  className="leading-relaxed font-body text-sm"
                  style={{ color: "oklch(var(--parchment-fg))" }}
                >
                  {result.narration}
                </p>

                <div className="flex flex-wrap gap-4 text-sm">
                  {Number(result.xpGained) > 0 && (
                    <div className="flex items-center gap-1.5 text-xp">
                      ✦ <span>+{Number(result.xpGained)} XP</span>
                    </div>
                  )}
                  {Number(result.goldGained) > 0 && (
                    <div className="flex items-center gap-1.5 text-gold">
                      💰 <span>+{Number(result.goldGained)} Gold</span>
                    </div>
                  )}
                </div>

                {result.loot && result.loot.length > 0 && (
                  <div>
                    <h4 className="font-display text-sm text-gold mb-2">
                      Loot Found:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {result.loot.map((item, idx) => (
                        <Badge
                          key={String(idx)}
                          variant="outline"
                          className="border-primary/40 text-gold"
                        >
                          {item.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {result.encounter && (
                  <div className="flex items-center justify-between flex-wrap gap-3 pt-2 border-t border-primary/20">
                    <div className="flex items-center gap-2 text-accent">
                      <Swords className="w-4 h-4" />
                      <span className="font-body text-sm">
                        Encounter: <strong>{result.encounter}</strong>
                      </span>
                    </div>
                    <Button
                      data-ocid="explore.combat.button"
                      onClick={() => handleCombatEnter(result.encounter!)}
                      className="bg-accent text-accent-foreground hover:bg-accent/80 glow-red font-display"
                    >
                      ⚔️ Enter Combat
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zone List */}
      <div>
        <h3 className="font-display text-xl text-gold mb-4 flex items-center gap-2">
          <Compass className="w-5 h-5" /> Known Regions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ZONE_DATA.map((z, i) => {
            const isCurrentZone = z.label === currentZoneLabel;
            const isTraveling = travelingTo === z.zone;
            return (
              <motion.div
                key={z.label}
                data-ocid={`explore.zone.item.${i + 1}`}
                whileHover={{ scale: isCurrentZone ? 1 : 1.02 }}
              >
                <Card
                  className={`fantasy-border transition-all duration-200 overflow-hidden ${
                    isCurrentZone ? "glow-gold border-primary/50" : "bg-card/70"
                  }`}
                >
                  <div className="relative h-28 overflow-hidden">
                    <img
                      src={z.image}
                      alt={z.label}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
                    <div className="absolute bottom-2 left-3 flex items-center gap-1.5">
                      <span
                        className={`flex items-center gap-1 font-display text-sm ${z.dangerColor}`}
                      >
                        {z.icon} {z.label}
                      </span>
                      {isCurrentZone && (
                        <Badge className="bg-primary/30 text-gold border-primary/40 text-[10px] px-1.5">
                          Here
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardContent className="px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs ${z.dangerColor}`}>
                        ⚠ {z.danger}
                      </span>
                      {!isCurrentZone && (
                        <Button
                          data-ocid={`explore.travel.button.${i + 1}`}
                          size="sm"
                          variant="outline"
                          disabled={isTraveling || travelToZone.isPending}
                          onClick={() => handleTravel(z.zone, z.label)}
                          className="h-6 text-xs border-border/60 text-muted-foreground hover:text-gold hover:border-primary/40 font-display"
                        >
                          {isTraveling ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            "Travel"
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Mystical Images Gallery */}
      <div>
        <h3 className="font-display text-xl text-gold mb-4">
          Visions of the Realm
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            className="rounded-lg overflow-hidden h-40"
            whileHover={{ scale: 1.02 }}
          >
            <img
              src="/assets/generated/mystic-portal.dim_800x500.jpg"
              alt="Mystical Portal"
              className="w-full h-full object-cover"
            />
          </motion.div>
          <motion.div
            className="rounded-lg overflow-hidden h-40"
            whileHover={{ scale: 1.02 }}
          >
            <img
              src="/assets/generated/mystic-dragon.dim_800x500.jpg"
              alt="Ancient Dragon"
              className="w-full h-full object-cover"
            />
          </motion.div>
          <motion.div
            className="rounded-lg overflow-hidden h-40"
            whileHover={{ scale: 1.02 }}
          >
            <img
              src="/assets/generated/mystic-necromancer.dim_800x500.jpg"
              alt="Dark Necromancer"
              className="w-full h-full object-cover"
            />
          </motion.div>
          <motion.div
            className="rounded-lg overflow-hidden h-40"
            whileHover={{ scale: 1.02 }}
          >
            <img
              src="/assets/generated/mystic-hero-vista.dim_800x500.jpg"
              alt="Hero Vista"
              className="w-full h-full object-cover"
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
