import { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Class, Race, Zone } from "../backend";
import { useActor } from "./useActor";

export function useCharacter() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["character"],
    queryFn: async () => {
      if (!actor) return null;
      try {
        const char = await actor.getCharacter();
        return char.name ? char : null;
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useInventory() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getInventory();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useQuests() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["quests"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getQuests();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateCharacter() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      race,
      charClass,
    }: { name: string; race: Race; charClass: Class }) => {
      if (!actor) throw new Error("No actor");
      return actor.createCharacter(name, race, charClass);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["character"] });
    },
  });
}

export function useExploreZone() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (zone: Zone) => {
      if (!actor) throw new Error("No actor");
      return actor.exploreZone(zone);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["character"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
}

export function useTravelToZone() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (zone: Zone) => {
      if (!actor) throw new Error("No actor");
      return actor.travelToZone(zone);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["character"] });
    },
  });
}

export function useStartCombat() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      enemyName,
      enemyHp,
    }: { enemyName: string; enemyHp: number }) => {
      if (!actor) throw new Error("No actor");
      return actor.startCombat(enemyName, BigInt(enemyHp));
    },
  });
}

export function useAttackEnemy() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.attackEnemy();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["character"] });
    },
  });
}

export function useFleeCombat() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.fleeCombat();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["character"] });
    },
  });
}

export function useActiveCombat() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["activeCombat"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getActiveCombat();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 5000,
  });
}

export function useEquipItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      if (!actor) throw new Error("No actor");
      return actor.equipItem(BigInt(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["character"] });
    },
  });
}

export function useConsumableItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      if (!actor) throw new Error("No actor");
      // biome-ignore lint/correctness/useHookAtTopLevel: actor method not a hook
      return actor.usePotion(BigInt(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["character"] });
    },
  });
}

export function useAllCharacters() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["allCharacters"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllCharacters();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useInbox() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["inbox"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getInbox();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });
}

export function useSentMessages() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["sentMessages"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSentMessages();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSendMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      toPrincipal,
      content,
    }: { toPrincipal: string; content: string }) => {
      if (!actor) throw new Error("No actor");
      const principal = Principal.fromText(toPrincipal);
      return actor.sendMessage(principal, content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sentMessages"] });
      queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
    },
  });
}

export function useMarkMessageRead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      if (!actor) throw new Error("No actor");
      return actor.markMessageRead(BigInt(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inbox"] });
      queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
    },
  });
}

export function useUnreadCount() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["unreadCount"],
    queryFn: async () => {
      if (!actor) return 0;
      const count = await actor.getUnreadCount();
      return Number(count);
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });
}

export function useAcceptQuest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      if (!actor) throw new Error("No actor");
      return actor.acceptQuest(BigInt(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quests"] });
    },
  });
}
