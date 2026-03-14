import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Backpack,
  FlaskConical,
  Loader2,
  Package,
  Shield,
  Sword,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import type { ItemType } from "../backend";
import {
  useConsumableItem,
  useEquipItem,
  useInventory,
} from "../hooks/useQueries";

const SKELETON_KEYS = ["sk1", "sk2", "sk3", "sk4", "sk5", "sk6"];

function getItemKind(itemType: ItemType): string {
  return (
    (itemType as unknown as { __kind__: string }).__kind__ || String(itemType)
  );
}

function getItemIcon(itemType: ItemType) {
  const kind = getItemKind(itemType);
  switch (kind) {
    case "Weapon":
      return <Sword className="w-6 h-6 text-red-400" />;
    case "Armor":
      return <Shield className="w-6 h-6 text-blue-400" />;
    case "Potion":
      return <FlaskConical className="w-6 h-6 text-green-400" />;
    default:
      return <Package className="w-6 h-6 text-muted-foreground" />;
  }
}

function getItemTypeBadgeColor(itemType: ItemType) {
  const kind = getItemKind(itemType);
  switch (kind) {
    case "Weapon":
      return "border-red-500/40 text-red-400";
    case "Armor":
      return "border-blue-500/40 text-blue-400";
    case "Potion":
      return "border-green-500/40 text-green-400";
    default:
      return "border-border/60 text-muted-foreground";
  }
}

export default function InventoryTab() {
  const { data: items, isLoading } = useInventory();
  const equipItem = useEquipItem();
  const consumePotion = useConsumableItem();

  const handleEquip = async (id: number, name: string, equipped: boolean) => {
    await equipItem.mutateAsync(id);
    toast.success(equipped ? `Unequipped ${name}` : `Equipped ${name}`);
  };

  const handlePotion = async (id: number, name: string) => {
    await consumePotion.mutateAsync(id);
    toast.success(`Used ${name}`);
  };

  if (isLoading) {
    return (
      <div
        data-ocid="inventory.loading_state"
        className="grid grid-cols-2 md:grid-cols-3 gap-4"
      >
        {SKELETON_KEYS.map((k) => (
          <div key={k} className="h-40 rounded-lg bg-muted/20 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div data-ocid="inventory.empty_state" className="text-center py-20">
        <Backpack className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="font-display text-2xl text-muted-foreground mb-2">
          Empty Adventurer's Pack
        </h3>
        <p className="text-muted-foreground/60 text-sm max-w-xs mx-auto">
          Explore dungeons and defeat enemies to collect weapons, armor, and
          magical items.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item, idx) => {
        const markerIndex = idx + 1;
        const typeKind = getItemKind(item.itemType);
        const isPotion = typeKind === "Potion";
        const isEquippable = typeKind === "Weapon" || typeKind === "Armor";
        const itemId = Number(item.id);
        return (
          <motion.div
            key={itemId}
            data-ocid={`inventory.item.${markerIndex}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card
              className={`fantasy-border bg-card/70 h-full flex flex-col ${
                item.equipped ? "glow-gold border-primary/50" : ""
              }`}
            >
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getItemIcon(item.itemType)}
                    <span className="font-display text-base text-foreground">
                      {item.name}
                    </span>
                  </div>
                  {item.equipped && (
                    <Badge className="bg-primary/20 text-gold border-primary/40 text-xs">
                      Equipped
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3 flex-1 flex flex-col">
                <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                  {item.description}
                </p>

                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="outline"
                    className={`text-xs ${getItemTypeBadgeColor(item.itemType)}`}
                  >
                    {typeKind}
                  </Badge>
                  {Number(item.quantity) > 1 && (
                    <Badge
                      variant="outline"
                      className="text-xs border-border/60 text-muted-foreground"
                    >
                      x{Number(item.quantity)}
                    </Badge>
                  )}
                </div>

                {/* Stat Bonuses */}
                <div className="grid grid-cols-2 gap-1 text-xs">
                  {Number(item.statBonus.attack) > 0 && (
                    <div className="flex items-center gap-1 text-red-400">
                      ⚔ +{Number(item.statBonus.attack)} ATK
                    </div>
                  )}
                  {Number(item.statBonus.defense) > 0 && (
                    <div className="flex items-center gap-1 text-blue-400">
                      🛡 +{Number(item.statBonus.defense)} DEF
                    </div>
                  )}
                  {Number(item.statBonus.hp) > 0 && (
                    <div className="flex items-center gap-1 text-hp">
                      ❤ +{Number(item.statBonus.hp)} HP
                    </div>
                  )}
                  {Number(item.statBonus.mp) > 0 && (
                    <div className="flex items-center gap-1 text-mp">
                      ✦ +{Number(item.statBonus.mp)} MP
                    </div>
                  )}
                  {Number(item.statBonus.speed) > 0 && (
                    <div className="flex items-center gap-1 text-gold">
                      ⚡ +{Number(item.statBonus.speed)} SPD
                    </div>
                  )}
                </div>

                {/* Action Button */}
                {isEquippable && (
                  <Button
                    data-ocid={`inventory.equip.button.${markerIndex}`}
                    size="sm"
                    variant="outline"
                    disabled={equipItem.isPending}
                    onClick={() =>
                      handleEquip(itemId, item.name, item.equipped)
                    }
                    className={`w-full font-display text-xs mt-auto ${
                      item.equipped
                        ? "border-primary/50 text-gold hover:bg-primary/10"
                        : "border-border/60 text-muted-foreground hover:text-gold hover:border-primary/40"
                    }`}
                  >
                    {equipItem.isPending ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : item.equipped ? (
                      "Unequip"
                    ) : (
                      "Equip"
                    )}
                  </Button>
                )}
                {isPotion && (
                  <Button
                    data-ocid={`inventory.use.button.${markerIndex}`}
                    size="sm"
                    disabled={consumePotion.isPending}
                    onClick={() => handlePotion(itemId, item.name)}
                    className="w-full bg-green-900/30 text-green-400 border border-green-500/30 hover:bg-green-900/50 font-display text-xs mt-auto"
                  >
                    {consumePotion.isPending ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      "🧪 Use Potion"
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
