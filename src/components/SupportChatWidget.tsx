import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Loader2, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

// Category of issue the citizen is reporting — stored on the chat row and shown in the "new chat" form
type ChatIssue = "booking_problem" | "service_question" | "complaint" | "technical_issue" | "other";
// Widget's three visual states: bubble only, "start a new chat" form, or an active conversation
type Step = "closed" | "new" | "chat";

// Shape of a row from the `support_messages` table
interface Message {
  id: string;
  body: string;
  is_support: boolean; // true if sent by an agent/admin, false if sent by the citizen
  created_at: string;
  sender_id: string;
  chat_id: string;
}

// Shape of a row from the `support_chats` table
interface Chat {
  id: string;
  subject: string;
  issue: ChatIssue;
  status: string; // e.g. "open" | "resolved" | "closed"
}

// Issue type options shown in the dropdown, with English/Amharic labels
const ISSUES: { value: ChatIssue; en: string; am: string }[] = [
  { value: "booking_problem",  en: "Booking problem",   am: "የቀጠሮ ችግር" },
  { value: "service_question", en: "Service question",  am: "ስለ አገልግሎት ጥያቄ" },
  { value: "complaint",        en: "Complaint",         am: "ቅሬታ" },
  { value: "technical_issue",  en: "Technical issue",   am: "የቴክኒክ ችግር" },
  { value: "other",            en: "Other",             am: "ሌላ" },
];

// Formats an ISO timestamp into a short localized time (e.g. "3:45 PM") for message bubbles
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Floating support chat widget shown to citizens on the public site.
// Handles starting a new support chat, loading an existing open one,
// and real-time messaging via Supabase Realtime.
export default function SupportChatWidget() {
  const { user, loading: authLoading } = useAuth();
  const { lang } = useLanguage();
  // Small inline translation helper: returns the Amharic string if lang === "am", else English
  const t = (en: string, am: string) => lang === "am" ? am : en;

  // Hide for admin/agent — they use the Support panel in sidebar
  const isStaff = user?.role === "admin" || user?.role === "agent";

  // --- Widget UI state ---
  const [step, setStep] = useState<Step>("closed");       // current panel: closed / new chat form / active chat
  const [issue, setIssue] = useState<ChatIssue>("booking_problem"); // selected issue type for new chat
  const [subject, setSubject] = useState("");             // free-text description for new chat
  const [starting, setStarting] = useState(false);        // loading state while creating a new chat
  const [chat, setChat] = useState<Chat | null>(null);     // the citizen's current/most recent open chat
  const [messages, setMessages] = useState<Message[]>([]); // messages loaded for the active chat
  const [body, setBody] = useState("");                   // current text in the message input
  const [sending, setSending] = useState(false);           // loading state while sending a message
  const [unread, setUnread] = useState(0);                  // unread message count shown as a badge on the bubble
  const bottomRef = useRef<HTMLDivElement>(null);           // anchor element used to auto-scroll to latest message

  // On mount (for logged-in, non-staff users), check if the citizen already has an open chat.
  // If found, store it and mark it as having 1 unread message so the badge shows.
  useEffect(() => {
    if (!user || isStaff || step !== "closed") return;
    supabase
      .from("support_chats")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setChat(data[0] as Chat);
          setUnread(1);
        }
      });
  }, [user, isStaff]);

  // Whenever the active chat changes: load its existing message history,
  // then subscribe to a Realtime channel for new inserts on that chat.
  // Cleans up the channel subscription when the chat changes or unmounts.
  useEffect(() => {
    if (!chat) return;
    supabase
      .from("support_messages")
      .select("*")
      .eq("chat_id", chat.id)
      .order("created_at")
      .then(({ data }) => setMessages((data ?? []) as Message[]));

    const channel = supabase
      .channel(`chat_${chat.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "support_messages",
        filter: `chat_id=eq.${chat.id}`,
      }, (payload) => {
        // Append the newly inserted message in real time
        setMessages((prev) => [...prev, payload.new as Message]);
        // If the widget is collapsed when a message arrives, bump the unread badge
        if (step === "closed") setUnread((n) => n + 1);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [chat?.id]);

  // Auto-scroll to the bottom of the message list whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Creates a new support_chats row from the "new chat" form, then immediately
  // inserts the subject text as the first message in that chat, and switches to the chat view.
  const startChat = async () => {
    if (!user) {
      toast.error(t("Please sign in to start a chat.", "ለመወያየት ይግቡ።"));
      return;
    }
    if (!subject.trim()) {
      toast.error(t("Please describe your issue.", "ችግርዎን ያስረዱ።"));
      return;
    }
    setStarting(true);
    const { data, error } = await supabase
      .from("support_chats")
      .insert({ user_id: user.id, issue, subject: subject.trim(), lang })
      .select()
      .single();
    setStarting(false);
    if (error) { toast.error(error.message); return; }
    setChat(data as Chat);
    setStep("chat");
    // Seed the conversation with the citizen's original issue description as the first message
    await supabase.from("support_messages").insert({
      chat_id: data.id,
      sender_id: user.id,
      is_support: false,
      body: subject.trim(),
    });
  };

  // Sends a new message in the active chat. Clears the input optimistically before the insert resolves.
  const send = async () => {
    if (!body.trim() || !chat || !user) return;
    const msg = body.trim();
    setBody("");
    setSending(true);
    const { error } = await supabase.from("support_messages").insert({
      chat_id: chat.id,
      sender_id: user.id,
      is_support: false,
      body: msg,
    });
    setSending(false);
    if (error) toast.error(error.message);
  };

  // Opens the widget: clears unread badge, and shows the active chat if one exists,
  // otherwise shows the "start a new chat" form
  const openChat = () => {
    setUnread(0);
    setStep(chat ? "chat" : "new");
  };

  // Don't render for staff at all — they use the admin Support panel
  if (authLoading || isStaff) return null;

  // True once the chat has been marked resolved/closed — disables the message input
  const isResolved = chat?.status === "resolved" || chat?.status === "closed";

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat window — only rendered when the widget isn't collapsed */}
      {step !== "closed" && (
        <div className="flex h-[460px] w-80 flex-col rounded-2xl border bg-card shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between bg-primary px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              {/* Back arrow lets the user return from an active chat to the "new chat" form */}
              {step === "chat" && (
                <button onClick={() => setStep("new")} className="mr-1 opacity-70 hover:opacity-100">
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm font-semibold">
                {t("Support Chat", "የድጋፍ ውይይት")}
              </span>
            </div>
            {/* Collapses the widget back down to just the floating bubble */}
            <button onClick={() => setStep("closed")} className="opacity-70 hover:opacity-100">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* New chat form — issue type + description, only shown before a chat exists */}
          {step === "new" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                {t(
                  "Tell us what you need help with and we'll get back to you shortly.",
                  "ምን እርዳታ እንደሚፈልጉ ያሳውቁን፣ ብዙም ሳይቆይ እንደርሰዎታለን።"
                )}
              </p>
              <div>
                <Label className="text-xs">{t("Issue type", "የችግር ዓይነት")}</Label>
                <Select value={issue} onValueChange={(v) => setIssue(v as ChatIssue)}>
                  <SelectTrigger className="mt-1 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ISSUES.map((iss) => (
                      <SelectItem key={iss.value} value={iss.value}>
                        {lang === "am" ? iss.am : iss.en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">{t("Describe your issue", "ችግርዎን ያስረዱ")}</Label>
                <Textarea
                  className="mt-1 resize-none text-sm"
                  rows={3}
                  placeholder={t(
                    "e.g. I can't book my appointment…",
                    "ለምሳሌ፡ ቀጠሮ መያዝ አልቻልሁም…"
                  )}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              {/* Prompt to sign in if the visitor isn't authenticated yet */}
              {!user && (
                <p className="text-xs text-amber-600">
                  {t("You must be signed in to chat.", "ለመወያየት መግባት አለብዎ።")}
                </p>
              )}
              <Button
                className="w-full"
                disabled={starting || !subject.trim() || !user}
                onClick={startChat}
              >
                {starting && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                {t("Start chat", "ውይይት ጀምር")}
              </Button>
            </div>
          )}

          {/* Active chat — message history + input, shown once a chat has been created/loaded */}
          {step === "chat" && (
            <>
              {/* Banner shown once the agent has marked the chat resolved/closed */}
              {isResolved && (
                <div className="bg-emerald-50 px-3 py-2 text-xs text-emerald-700 text-center border-b">
                  {t("This chat has been resolved.", "ይህ ውይይት ተፈትቷል።")}
                </div>
              )}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {/* Static welcome bubble shown at the top of every chat (not stored in DB) */}
                <div className="flex justify-start">
                  <div className="rounded-xl rounded-tl-none bg-muted px-3 py-2 text-xs text-muted-foreground max-w-[80%]">
                    {t(
                      "Hi! Support will reply shortly.",
                      "ሰላም! ድጋፍ ቡድን በቅርቡ ይመልሳሉ።"
                    )}
                  </div>
                </div>
                {/* Render each message, aligning the citizen's own messages to the right */}
                {messages.map((m) => {
                  const isMine = m.sender_id === user?.id && !m.is_support;
                  return (
                    <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                        isMine
                          ? "bg-primary text-primary-foreground rounded-tr-none"
                          : "bg-muted text-foreground rounded-tl-none"
                      }`}>
                        {/* Label agent messages so the citizen can tell them apart from their own */}
                        {m.is_support && (
                          <p className="text-[10px] font-semibold text-primary mb-0.5">
                            {t("Support", "ድጋፍ")}
                          </p>
                        )}
                        <p>{m.body}</p>
                        <p className={`mt-0.5 text-[10px] ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                          {formatTime(m.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {/* Invisible anchor used to auto-scroll to the latest message */}
                <div ref={bottomRef} />
              </div>
              {/* Message input — hidden once the chat is resolved/closed */}
              {!isResolved && (
                <div className="border-t p-3 flex gap-2">
                  <Input
                    className="text-sm"
                    placeholder={t("Type a message…", "መልዕክት ይፃፉ…")}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
                  />
                  <Button size="icon" disabled={sending || !body.trim()} onClick={send}>
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Floating button — always visible for non-staff; toggles open/closed and shows unread badge */}
      <button
        onClick={step === "closed" ? openChat : () => setStep("closed")}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 transition-all hover:scale-105"
      >
        {step === "closed" ? (
          <>
            <MessageCircle className="h-6 w-6" />
            {/* Unread badge — only shown when there are unseen messages while collapsed */}
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white animate-bounce">
                {unread}
              </span>
            )}
          </>
        ) : (
          <X className="h-6 w-6" />
        )}
      </button>
    </div>
  );
}
