import { Skeleton } from "@/components/ui/skeleton";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CharacterCreation from "./components/CharacterCreation";
import MainGame from "./components/MainGame";
import { useCharacter } from "./hooks/useQueries";

const queryClient = new QueryClient();

const LOADING_DOTS = ["d1", "d2", "d3"];

function GameRouter() {
  const { data: character, isLoading, refetch } = useCharacter();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div
            className="font-display text-4xl text-gold"
            style={{ textShadow: "0 0 30px oklch(0.74 0.14 82 / 0.5)" }}
          >
            Realms of Fate
          </div>
          <div className="flex gap-2 justify-center">
            {LOADING_DOTS.map((id, i) => (
              <div
                key={id}
                className="w-2 h-2 rounded-full bg-primary animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
          <p className="text-muted-foreground text-sm">
            Summoning your hero...
          </p>
          <Skeleton className="h-2 w-48 mx-auto bg-muted/30" />
        </div>
      </div>
    );
  }

  if (!character) {
    return <CharacterCreation onCreated={() => refetch()} />;
  }

  return <MainGame character={character} />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <GameRouter />
    </QueryClientProvider>
  );
}
