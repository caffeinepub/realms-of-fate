import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Heart,
  Loader2,
  Lock,
  Shield,
  Star,
  Sword,
  Wand2,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { Class, Race } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useCreateCharacter } from "../hooks/useQueries";

const RACES = [
  {
    value: Race.Human,
    label: "Human",
    icon: "👤",
    lore: "Versatile and adaptable, Humans excel in any calling and forge their destiny through sheer willpower.",
    bonus: "+2 to all stats",
  },
  {
    value: Race.Elf,
    label: "Elf",
    icon: "🧝",
    lore: "Ancient and wise, Elves command arcane arts and move with ethereal grace through shadowed forests.",
    bonus: "+4 MP, +2 Speed",
  },
  {
    value: Race.Dwarf,
    label: "Dwarf",
    icon: "⚒️",
    lore: "Born from stone, Dwarves are unbreakable warriors with legendary endurance and fierce battle-fury.",
    bonus: "+4 HP, +2 Defense",
  },
  {
    value: Race.Orc,
    label: "Orc",
    icon: "💪",
    lore: "Children of war, Orcs are fearsome berserkers whose raw power can shatter the mightiest foes.",
    bonus: "+4 Attack, +2 HP",
  },
];

const CLASSES = [
  {
    value: Class.Warrior,
    label: "Warrior",
    icon: <Sword className="w-5 h-5" />,
    description:
      "Masters of steel and shield. Unmatched in melee combat with towering HP and devastating attacks.",
    stats: { hp: 5, mp: 1, atk: 4, def: 3, spd: 2 },
    color: "text-red-400",
  },
  {
    value: Class.Mage,
    label: "Mage",
    icon: <Wand2 className="w-5 h-5" />,
    description:
      "Wielders of arcane power. Vast magical reserves allow devastating spells but fragile in body.",
    stats: { hp: 2, mp: 5, atk: 4, def: 1, spd: 3 },
    color: "text-blue-400",
  },
  {
    value: Class.Rogue,
    label: "Rogue",
    icon: <Zap className="w-5 h-5" />,
    description:
      "Shadows made flesh. Striking from darkness with lethal speed before foes can react.",
    stats: { hp: 3, mp: 2, atk: 3, def: 2, spd: 5 },
    color: "text-yellow-400",
  },
  {
    value: Class.Cleric,
    label: "Cleric",
    icon: <Heart className="w-5 h-5" />,
    description:
      "Servants of the divine. Balanced between healing grace and holy retribution.",
    stats: { hp: 4, mp: 3, atk: 2, def: 3, spd: 2 },
    color: "text-emerald-400",
  },
];

const STAT_SKELETONS = ["s1", "s2", "s3", "s4", "s5"];

function StatBar({
  label,
  value,
  max = 5,
  color,
}: { label: string; value: number; max?: number; color: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-8 text-muted-foreground">{label}</span>
      <div className="flex gap-0.5">
        {STAT_SKELETONS.slice(0, max).map((id, i) => (
          <div
            key={id}
            className={`w-3 h-2 rounded-sm transition-all duration-300 ${
              i < value ? color : "bg-muted/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default function CharacterCreation({
  onCreated,
}: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const createCharacter = useCreateCharacter();
  const { identity, login, isLoggingIn } = useInternetIdentity();

  const isAuthenticated = !!identity;
  const canSubmit =
    name.trim().length > 0 && selectedRace && selectedClass && isAuthenticated;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      const result = await createCharacter.mutateAsync({
        name: name.trim(),
        race: selectedRace!,
        charClass: selectedClass!,
      });
      if (result.success) onCreated();
      else toast.error("Failed to create character. Try again.");
    } catch (_err) {
      toast.error("Something went wrong. Please try again.");
    }
  };

  const selectedClassData = CLASSES.find((c) => c.value === selectedClass);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start py-8 px-4 relative"
      style={{
        backgroundImage:
          "url('/assets/generated/fantasy-bg.dim_1920x1080.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-background/85" />

      <div className="relative z-10 w-full max-w-4xl">
        {/* Title */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="text-gold text-sm tracking-[0.4em] uppercase mb-2 font-body">
            Welcome, Adventurer
          </div>
          <h1
            className="font-display text-6xl md:text-7xl font-bold text-foreground"
            style={{ textShadow: "0 0 40px oklch(0.74 0.14 82 / 0.4)" }}
          >
            Realms of Fate
          </h1>
          <div className="w-48 h-0.5 mx-auto mt-4 bg-gradient-to-r from-transparent via-gold to-transparent" />
          <p className="mt-4 text-muted-foreground text-lg font-body">
            Forge your legend. Choose your path.
          </p>
        </motion.div>

        {/* Login Gate */}
        {!isAuthenticated && (
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="fantasy-border glow-gold bg-card/90 backdrop-blur-sm">
              <CardContent className="pt-6 pb-6 text-center space-y-4">
                <div className="flex justify-center">
                  <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                    <Lock className="w-6 h-6 text-gold" />
                  </div>
                </div>
                <div>
                  <h2 className="font-display text-xl text-gold mb-1">
                    Sign In to Begin
                  </h2>
                  <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                    You must be signed in to create your hero and save your
                    progress across sessions.
                  </p>
                </div>
                <Button
                  data-ocid="auth.submit_button"
                  onClick={login}
                  disabled={isLoggingIn}
                  className="px-8 py-5 font-display text-lg bg-primary text-primary-foreground hover:bg-primary/90 glow-gold transition-all duration-300"
                  size="lg"
                >
                  {isLoggingIn ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Signing In...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Shield className="w-4 h-4" /> Login to Play
                    </span>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Character Form — only when authenticated */}
        {isAuthenticated && (
          <>
            {/* Name Input */}
            <motion.div
              className="mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="fantasy-border bg-card/80 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <Label className="text-gold font-display text-lg mb-3 block">
                    Hero Name
                  </Label>
                  <Input
                    data-ocid="character_creation.input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name, brave soul..."
                    className="bg-input/50 border-border/60 text-foreground placeholder:text-muted-foreground text-lg h-12 font-body"
                    maxLength={30}
                  />
                </CardContent>
              </Card>
            </motion.div>

            {/* Race Selection */}
            <motion.div
              className="mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <h2 className="font-display text-2xl text-gold mb-4">
                Choose Your Race
              </h2>
              <div
                className="grid grid-cols-2 md:grid-cols-4 gap-3"
                data-ocid="character_creation.race.select"
              >
                {RACES.map((race) => (
                  <button
                    type="button"
                    key={race.value}
                    onClick={() => setSelectedRace(race.value)}
                    className={`p-4 rounded-lg text-left transition-all duration-200 fantasy-border ${
                      selectedRace === race.value
                        ? "bg-primary/15 border-primary/60 glow-gold"
                        : "bg-card/60 hover:bg-card/80 hover:border-border/80"
                    }`}
                  >
                    <div className="text-2xl mb-2">{race.icon}</div>
                    <div className="font-display text-lg text-foreground">
                      {race.label}
                    </div>
                    <div className="text-xs text-gold mt-1">{race.bonus}</div>
                    <div className="text-xs text-muted-foreground mt-2 leading-relaxed line-clamp-3">
                      {race.lore}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Class Selection */}
            <motion.div
              className="mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <h2 className="font-display text-2xl text-gold mb-4">
                Choose Your Class
              </h2>
              <div
                className="grid grid-cols-2 md:grid-cols-4 gap-3"
                data-ocid="character_creation.class.select"
              >
                {CLASSES.map((cls) => (
                  <button
                    type="button"
                    key={cls.value}
                    onClick={() => setSelectedClass(cls.value)}
                    className={`p-4 rounded-lg text-left transition-all duration-200 fantasy-border ${
                      selectedClass === cls.value
                        ? "bg-primary/15 border-primary/60 glow-gold"
                        : "bg-card/60 hover:bg-card/80 hover:border-border/80"
                    }`}
                  >
                    <div className={`mb-2 ${cls.color}`}>{cls.icon}</div>
                    <div className="font-display text-lg text-foreground">
                      {cls.label}
                    </div>
                    <div className="text-xs text-muted-foreground mt-2 leading-relaxed mb-3">
                      {cls.description}
                    </div>
                    {selectedClass === cls.value && (
                      <div className="space-y-1">
                        <StatBar
                          label="HP"
                          value={cls.stats.hp}
                          color="bg-hp"
                        />
                        <StatBar
                          label="MP"
                          value={cls.stats.mp}
                          color="bg-mp"
                        />
                        <StatBar
                          label="ATK"
                          value={cls.stats.atk}
                          color="bg-accent"
                        />
                        <StatBar
                          label="DEF"
                          value={cls.stats.def}
                          color="bg-primary"
                        />
                        <StatBar
                          label="SPD"
                          value={cls.stats.spd}
                          color="bg-xp"
                        />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Preview + Submit */}
            {canSubmit && selectedClassData && (
              <motion.div
                className="mb-8"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="fantasy-border glow-gold bg-card/80 backdrop-blur-sm">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div>
                        <h3 className="font-display text-2xl text-gold">
                          {name}
                        </h3>
                        <div className="flex gap-2 mt-2">
                          <Badge
                            variant="outline"
                            className="border-border text-foreground"
                          >
                            {RACES.find((r) => r.value === selectedRace)?.label}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`border-border ${selectedClassData.color}`}
                          >
                            {selectedClassData.label}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="text-center">
                          <Shield className="w-5 h-5 text-hp mx-auto mb-1" />
                          <div className="text-xs text-muted-foreground">
                            HP
                          </div>
                          <div className="text-sm font-bold text-foreground">
                            {selectedClassData.stats.hp * 10 + 50}
                          </div>
                        </div>
                        <div className="text-center">
                          <Star className="w-5 h-5 text-mp mx-auto mb-1" />
                          <div className="text-xs text-muted-foreground">
                            MP
                          </div>
                          <div className="text-sm font-bold text-foreground">
                            {selectedClassData.stats.mp * 10 + 20}
                          </div>
                        </div>
                        <div className="text-center">
                          <Sword className="w-5 h-5 text-accent mx-auto mb-1" />
                          <div className="text-xs text-muted-foreground">
                            ATK
                          </div>
                          <div className="text-sm font-bold text-foreground">
                            {selectedClassData.stats.atk * 3 + 5}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            <motion.div
              className="flex justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              <Button
                data-ocid="character_creation.submit_button"
                onClick={handleSubmit}
                disabled={!canSubmit || createCharacter.isPending}
                className="px-12 py-6 text-xl font-display bg-primary text-primary-foreground hover:bg-primary/90 glow-gold transition-all duration-300 disabled:opacity-40"
                size="lg"
              >
                {createCharacter.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⚔️</span> Forging Hero...
                  </span>
                ) : (
                  "Begin Adventure"
                )}
              </Button>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
