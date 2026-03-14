import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CheckCircle2,
  Clock,
  Coins,
  Loader2,
  ScrollText,
  Sparkles,
  Star,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { QuestStatus } from "../backend";
import type { Quest } from "../backend";
import { useAcceptQuest, useQuests } from "../hooks/useQueries";

const QUEST_SKELETON_KEYS = ["qsk1", "qsk2"];

function QuestCard({
  quest,
  idx,
  showAccept,
}: {
  quest: Quest;
  idx: number;
  showAccept?: boolean;
}) {
  const acceptQuest = useAcceptQuest();
  const status =
    (quest.status as unknown as { __kind__: string }).__kind__ ||
    String(quest.status);

  const handleAccept = async () => {
    await acceptQuest.mutateAsync(Number(quest.id));
    toast.success(`Quest accepted: ${quest.title}`);
  };

  return (
    <motion.div
      key={Number(quest.id)}
      data-ocid={`quests.item.${idx + 1}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.08 }}
    >
      <Card
        className={`fantasy-border bg-card/70 ${
          status === "Completed" ? "opacity-70" : ""
        }`}
      >
        <CardHeader className="pb-2 pt-4 px-5">
          <CardTitle className="flex items-center justify-between flex-wrap gap-2">
            <span className="font-display text-base text-foreground flex items-center gap-2">
              <ScrollText className="w-4 h-4 text-gold" />
              {quest.title}
            </span>
            {status === "Completed" && (
              <Badge className="bg-emerald-900/30 text-emerald-400 border-emerald-500/30 text-xs">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Done
              </Badge>
            )}
            {status === "Active" && (
              <Badge className="bg-amber-900/30 text-amber-400 border-amber-500/30 text-xs">
                <Clock className="w-3 h-3 mr-1" /> Active
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-4 space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {quest.description}
          </p>

          {/* Objectives */}
          {quest.objectives.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs text-gold uppercase tracking-wider mb-2">
                Objectives
              </div>
              {quest.objectives.map((obj, oIdx) => (
                <div key={String(oIdx)} className="flex items-start gap-2">
                  <Checkbox
                    checked={obj.completed}
                    disabled
                    className="mt-0.5 border-border/60"
                  />
                  <span
                    className={`text-sm ${
                      obj.completed
                        ? "line-through text-muted-foreground"
                        : "text-foreground"
                    }`}
                  >
                    {obj.text}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Rewards */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <div className="text-xs text-gold uppercase tracking-wider">
              Rewards:
            </div>
            <div className="flex items-center gap-1 text-xs text-xp">
              <Star className="w-3 h-3" /> {Number(quest.rewards.xp)} XP
            </div>
            <div className="flex items-center gap-1 text-xs text-gold">
              <Coins className="w-3 h-3" /> {Number(quest.rewards.gold)} Gold
            </div>
            {quest.rewards.items.map((item, iIdx) => (
              <Badge
                key={String(iIdx)}
                variant="outline"
                className="text-xs border-primary/30 text-primary"
              >
                {item.name}
              </Badge>
            ))}
          </div>

          {showAccept && (
            <Button
              data-ocid={`quests.accept.button.${idx + 1}`}
              size="sm"
              onClick={handleAccept}
              disabled={acceptQuest.isPending}
              className="mt-1 bg-primary/20 text-gold border border-primary/40 hover:bg-primary/30 font-display"
              variant="outline"
            >
              {acceptQuest.isPending ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3 mr-1" />
              )}
              Accept Quest
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function QuestsTab() {
  const { data: quests, isLoading } = useQuests();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {QUEST_SKELETON_KEYS.map((k) => (
          <div key={k} className="h-32 rounded-lg bg-muted/20 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!quests || quests.length === 0) {
    return (
      <div data-ocid="quests.empty_state" className="text-center py-20">
        <ScrollText className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="font-display text-2xl text-muted-foreground mb-2">
          The Board is Empty
        </h3>
        <p className="text-muted-foreground/60 text-sm max-w-xs mx-auto">
          Visit the town or speak with NPCs to discover quests and legendary
          bounties.
        </p>
      </div>
    );
  }

  const getQuestStatus = (q: Quest): string => {
    return (
      (q.status as unknown as { __kind__: string }).__kind__ || String(q.status)
    );
  };

  const activeQuests = quests.filter((q) => getQuestStatus(q) === "Active");
  const availableQuests = quests.filter(
    (q) => getQuestStatus(q) === "Available",
  );
  const completedQuests = quests.filter(
    (q) => getQuestStatus(q) === "Completed",
  );

  return (
    <div className="space-y-8">
      {/* Active */}
      {activeQuests.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-display text-lg text-gold flex items-center gap-2">
            <Clock className="w-5 h-5" /> Active Quests
            <Badge className="text-xs ml-2 bg-amber-900/30 text-amber-400 border-amber-500/30">
              {activeQuests.length}
            </Badge>
          </h3>
          {activeQuests.map((q, i) => (
            <QuestCard key={Number(q.id)} quest={q} idx={i} />
          ))}
        </div>
      )}

      {/* Available */}
      {availableQuests.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-display text-lg text-gold flex items-center gap-2">
            <ScrollText className="w-5 h-5" /> Available Quests
            <Badge className="text-xs ml-2 bg-primary/20 text-gold border-primary/30">
              {availableQuests.length}
            </Badge>
          </h3>
          {availableQuests.map((q, i) => (
            <QuestCard key={Number(q.id)} quest={q} idx={i} showAccept />
          ))}
        </div>
      )}

      {/* Completed */}
      {completedQuests.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-display text-lg text-gold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" /> Completed
            <Badge className="text-xs ml-2 bg-emerald-900/30 text-emerald-400 border-emerald-500/30">
              {completedQuests.length}
            </Badge>
          </h3>
          {completedQuests.map((q, i) => (
            <QuestCard key={Number(q.id)} quest={q} idx={i} />
          ))}
        </div>
      )}
    </div>
  );
}
