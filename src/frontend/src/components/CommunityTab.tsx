import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Mail,
  MailOpen,
  MessageSquare,
  Search,
  Send,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Character, Message } from "../backend";
import {
  useAllCharacters,
  useInbox,
  useMarkMessageRead,
  useSendMessage,
  useSentMessages,
} from "../hooks/useQueries";

function formatTime(ns: bigint): string {
  const ms = Number(ns) / 1_000_000;
  const diff = Date.now() - ms;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

function ComposeDialog({
  defaultRecipient = "",
  trigger,
}: {
  defaultRecipient?: string;
  trigger: React.ReactNode;
}) {
  const [recipient, setRecipient] = useState(defaultRecipient);
  const [content, setContent] = useState("");
  const [open, setOpen] = useState(false);
  const sendMessage = useSendMessage();

  const handleSend = async () => {
    if (!recipient.trim() || !content.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      await sendMessage.mutateAsync({ toPrincipal: recipient.trim(), content });
      toast.success("Message sent!");
      setContent("");
      setOpen(false);
    } catch {
      toast.error(
        "Failed to send message. Check the recipient's principal ID.",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        data-ocid="community.compose.dialog"
        className="bg-card border-border/60 max-w-md"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-gold flex items-center gap-2">
            <MessageSquare className="w-5 h-5" /> Compose Message
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Recipient Principal ID
            </Label>
            <Input
              data-ocid="community.recipient.input"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="e.g. 2vxsx-fae..."
              className="bg-background/50 border-border/60 text-sm font-mono"
            />
            <p className="text-[10px] text-muted-foreground/60">
              Ask your fellow adventurer for their Principal ID
            </p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Message</Label>
            <Textarea
              data-ocid="community.message.textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your message..."
              className="bg-background/50 border-border/60 min-h-[100px] text-sm"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              data-ocid="community.compose.cancel_button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-border/60 text-muted-foreground"
            >
              Cancel
            </Button>
            <Button
              data-ocid="community.compose.submit_button"
              onClick={handleSend}
              disabled={sendMessage.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-display"
            >
              {sendMessage.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-1" />
              )}
              Send
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MessageItem({ msg, isOwn }: { msg: Message; isOwn?: boolean }) {
  const markRead = useMarkMessageRead();
  const [expanded, setExpanded] = useState(false);

  const handleOpen = () => {
    setExpanded(!expanded);
    if (!msg.read && !isOwn) {
      markRead.mutate(Number(msg.id));
    }
  };

  return (
    <motion.div
      layout
      className={`rounded-lg border p-3 cursor-pointer transition-colors ${
        !msg.read && !isOwn
          ? "border-primary/40 bg-primary/5 hover:bg-primary/10"
          : "border-border/40 bg-card/50 hover:bg-card/80"
      }`}
      onClick={handleOpen}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {!isOwn &&
            (!msg.read ? (
              <Mail className="w-4 h-4 text-primary flex-shrink-0" />
            ) : (
              <MailOpen className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            ))}
          <div className="min-w-0">
            <div className="font-display text-sm text-foreground truncate">
              {isOwn
                ? `To: ${msg.toPrincipal.toString().slice(0, 12)}...`
                : msg.fromName ||
                  `From: ${msg.fromPrincipal.toString().slice(0, 12)}...`}
            </div>
            {!expanded && (
              <div className="text-xs text-muted-foreground truncate mt-0.5">
                {msg.content}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {!msg.read && !isOwn && (
            <Badge className="bg-primary/20 text-gold border-primary/40 text-[10px] px-1.5">
              New
            </Badge>
          )}
          <span className="text-[10px] text-muted-foreground/60">
            {formatTime(msg.timestamp)}
          </span>
        </div>
      </div>
      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-3 pt-3 border-t border-border/30 text-sm text-foreground leading-relaxed"
        >
          {msg.content}
        </motion.div>
      )}
    </motion.div>
  );
}

function AdventurersTab() {
  const { data: characters, isLoading } = useAllCharacters();
  const [search, setSearch] = useState("");

  const filtered = (characters ?? []).filter(
    (c) =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      String(c.race).toLowerCase().includes(search.toLowerCase()) ||
      String(c.charClass).toLowerCase().includes(search.toLowerCase()),
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((k) => (
          <div key={k} className="h-32 rounded-lg bg-muted/20 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          data-ocid="community.search.search_input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search adventurers..."
          className="pl-9 bg-background/50 border-border/60"
        />
      </div>

      {filtered.length === 0 ? (
        <div
          data-ocid="community.adventurers.empty_state"
          className="text-center py-12"
        >
          <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground/60 text-sm">
            {search
              ? "No adventurers match your search."
              : "No other adventurers have joined yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((char: Character, idx) => (
            <motion.div
              key={char.name}
              data-ocid={`community.adventurer.item.${idx + 1}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="fantasy-border bg-card/70">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-display text-base text-gold truncate">
                        {char.name}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <Badge
                          variant="outline"
                          className="text-[10px] border-border/60 text-muted-foreground"
                        >
                          {String(char.race)}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-[10px] border-border/60 text-muted-foreground"
                        >
                          {String(char.charClass)}
                        </Badge>
                        <Badge className="text-[10px] bg-primary/20 text-gold border-primary/30">
                          Lv.{Number(char.level)}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1.5">
                        📍 {String(char.zone)}
                      </div>
                    </div>
                    <ComposeDialog
                      trigger={
                        <Button
                          data-ocid={`community.message.button.${idx + 1}`}
                          size="sm"
                          variant="outline"
                          className="border-border/60 text-muted-foreground hover:text-gold hover:border-primary/40 flex-shrink-0"
                        >
                          <MessageSquare className="w-3 h-3" />
                        </Button>
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function MessagesTab() {
  const { data: inbox, isLoading: inboxLoading } = useInbox();
  const { data: sent, isLoading: sentLoading } = useSentMessages();
  const [showSent, setShowSent] = useState(false);

  const messages = showSent ? (sent ?? []) : (inbox ?? []);
  const isLoading = showSent ? sentLoading : inboxLoading;
  const unread = (inbox ?? []).filter((m) => !m.read).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            data-ocid="community.inbox.toggle"
            size="sm"
            variant={!showSent ? "default" : "outline"}
            onClick={() => setShowSent(false)}
            className={
              !showSent
                ? "bg-primary/20 text-gold border border-primary/40"
                : "border-border/60 text-muted-foreground"
            }
          >
            <Mail className="w-3 h-3 mr-1" /> Inbox
            {unread > 0 && (
              <Badge className="ml-1.5 bg-accent text-accent-foreground text-[10px] px-1.5">
                {unread}
              </Badge>
            )}
          </Button>
          <Button
            data-ocid="community.sent.toggle"
            size="sm"
            variant={showSent ? "default" : "outline"}
            onClick={() => setShowSent(true)}
            className={
              showSent
                ? "bg-primary/20 text-gold border border-primary/40"
                : "border-border/60 text-muted-foreground"
            }
          >
            <Send className="w-3 h-3 mr-1" /> Sent
          </Button>
        </div>
        <ComposeDialog
          trigger={
            <Button
              data-ocid="community.compose.open_modal_button"
              size="sm"
              className="bg-primary/20 text-gold border border-primary/40 hover:bg-primary/30 font-display"
            >
              <MessageSquare className="w-3 h-3 mr-1" /> New Message
            </Button>
          }
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((k) => (
            <div
              key={k}
              className="h-16 rounded-lg bg-muted/20 animate-pulse"
            />
          ))}
        </div>
      ) : messages.length === 0 ? (
        <div
          data-ocid="community.messages.empty_state"
          className="text-center py-12"
        >
          <Mail className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground/60 text-sm">
            {showSent ? "No sent messages." : "Your inbox is empty."}
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[500px]">
          <div className="space-y-2 pr-2">
            {messages.map((msg) => (
              <MessageItem key={Number(msg.id)} msg={msg} isOwn={showSent} />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

export default function CommunityTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <Users className="w-6 h-6 text-gold" />
        <h2 className="font-display text-2xl text-gold">
          The Adventurers' Guild
        </h2>
      </div>

      <Tabs defaultValue="adventurers">
        <TabsList className="bg-card/80 border border-border/50 p-1">
          <TabsTrigger
            data-ocid="community.adventurers.tab"
            value="adventurers"
            className="font-display text-sm data-[state=active]:bg-primary/20 data-[state=active]:text-gold"
          >
            <Users className="w-4 h-4 mr-1.5" /> Adventurers
          </TabsTrigger>
          <TabsTrigger
            data-ocid="community.messages.tab"
            value="messages"
            className="font-display text-sm data-[state=active]:bg-primary/20 data-[state=active]:text-gold"
          >
            <Mail className="w-4 h-4 mr-1.5" /> Messages
          </TabsTrigger>
        </TabsList>

        <TabsContent value="adventurers" className="mt-4">
          <AdventurersTab />
        </TabsContent>
        <TabsContent value="messages" className="mt-4">
          <MessagesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
