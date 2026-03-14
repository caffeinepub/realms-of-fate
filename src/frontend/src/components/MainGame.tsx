import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Backpack,
  Compass,
  ScrollText,
  Swords,
  User,
  Users,
} from "lucide-react";
import { useState } from "react";
import type { Character } from "../backend";
import { useUnreadCount } from "../hooks/useQueries";
import CharacterSheetTab from "./CharacterSheetTab";
import CombatTab from "./CombatTab";
import CommunityTab from "./CommunityTab";
import ExploreTab from "./ExploreTab";
import HUD from "./HUD";
import InventoryTab from "./InventoryTab";
import QuestsTab from "./QuestsTab";

interface MainGameProps {
  character: Character;
}

function getCharacterClass(character: Character): string {
  // charClass is a string enum value like "Warrior", "Mage", etc.
  return String(character.charClass);
}

export default function MainGame({ character }: MainGameProps) {
  const [activeTab, setActiveTab] = useState("explore");
  const [activeEnemy, setActiveEnemy] = useState<string | null>(null);
  const [activeEnemyHp, setActiveEnemyHp] = useState(100);

  const { data: unreadCount = 0 } = useUnreadCount();

  const handleCombatEnter = (enemy: string, initialHp: number) => {
    setActiveEnemy(enemy);
    setActiveEnemyHp(initialHp);
    setActiveTab("combat");
  };

  const handleCombatEnd = () => {
    setActiveEnemy(null);
    setActiveTab("explore");
  };

  const handleCommunityClick = () => {
    setActiveTab("community");
  };

  const characterClass = getCharacterClass(character);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Toaster />
      <HUD character={character} onCommunityClick={handleCommunityClick} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full bg-card/80 border border-border/50 mb-6 p-1 h-auto flex-wrap">
            <TabsTrigger
              data-ocid="nav.explore.tab"
              value="explore"
              className="flex-1 font-display text-sm data-[state=active]:bg-primary/20 data-[state=active]:text-gold py-2.5"
            >
              <Compass className="w-4 h-4 mr-1.5" /> Explore
            </TabsTrigger>
            <TabsTrigger
              data-ocid="nav.combat.tab"
              value="combat"
              className="flex-1 font-display text-sm data-[state=active]:bg-accent/20 data-[state=active]:text-accent-foreground py-2.5"
            >
              <Swords className="w-4 h-4 mr-1.5" />
              Combat
              {activeEnemy && (
                <span className="ml-1.5 w-2 h-2 rounded-full bg-accent inline-block animate-pulse" />
              )}
            </TabsTrigger>
            <TabsTrigger
              data-ocid="nav.inventory.tab"
              value="inventory"
              className="flex-1 font-display text-sm data-[state=active]:bg-primary/20 data-[state=active]:text-gold py-2.5"
            >
              <Backpack className="w-4 h-4 mr-1.5" /> Inventory
            </TabsTrigger>
            <TabsTrigger
              data-ocid="nav.quests.tab"
              value="quests"
              className="flex-1 font-display text-sm data-[state=active]:bg-primary/20 data-[state=active]:text-gold py-2.5"
            >
              <ScrollText className="w-4 h-4 mr-1.5" /> Quests
            </TabsTrigger>
            <TabsTrigger
              data-ocid="nav.character.tab"
              value="character"
              className="flex-1 font-display text-sm data-[state=active]:bg-primary/20 data-[state=active]:text-gold py-2.5"
            >
              <User className="w-4 h-4 mr-1.5" /> Sheet
            </TabsTrigger>
            <TabsTrigger
              data-ocid="nav.community.tab"
              value="community"
              className="flex-1 font-display text-sm data-[state=active]:bg-primary/20 data-[state=active]:text-gold py-2.5 relative"
            >
              <Users className="w-4 h-4 mr-1.5" /> Guild
              {unreadCount > 0 && (
                <span className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-accent text-accent-foreground text-[10px] font-bold">
                  {unreadCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="explore">
            <ExploreTab
              character={character}
              onCombatEnter={handleCombatEnter}
            />
          </TabsContent>

          <TabsContent value="combat">
            <CombatTab
              activeEnemy={activeEnemy}
              activeEnemyHp={activeEnemyHp}
              playerMaxHp={Number(character.maxHp)}
              playerCurrentHp={Number(character.hp)}
              characterClass={characterClass}
              onCombatEnd={handleCombatEnd}
            />
          </TabsContent>

          <TabsContent value="inventory">
            <InventoryTab />
          </TabsContent>

          <TabsContent value="quests">
            <QuestsTab />
          </TabsContent>

          <TabsContent value="character">
            <CharacterSheetTab character={character} />
          </TabsContent>

          <TabsContent value="community">
            <CommunityTab />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 py-4 text-center">
        <p className="text-xs text-muted-foreground/50 font-body">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold/60 hover:text-gold transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
