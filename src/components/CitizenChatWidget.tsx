import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Cast supabase to any to allow access to chat tables not in auto-generated types
const supabaseClient = supabase as any;

const ISSUE_TYPES = [
  { value: "general", label: "General issue" },
  { value: "booking", label: "Booking problem" },
  { value: "payment", label: "Payment issue" },
  { value: "other", label: "Other" },
];

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "am", label: "Amharic" },
];

const LABELS: Record<string, Record<string, string>> = {
  en: {
    title: "Support Chat",
    placeholder: "Describe your issue...",
    noMessages: "No messages yet. Describe your issue.",
    send: "Send",
    close: "Close",
    support: "Support",
    issueType: "Issue type",
    language: "Language",
    typePlaceholder: "Select issue type",
  },
  am: {
    title: "የድጋፍ ንግግር",
    placeholder: "ጉዳዩን ይግለጹ...",
    noMessages: "ምንም መልዕክት አልተላከም። ጉዳዩን ይግለጹ።",
    send: "ላክ",
    close: "ዝጋ",
    support: "ድጋፍ",
    issueType: "የጉዳይ አይነት",
    language: "ቋንቋ",
    typePlaceholder: "የጉዳይ አይነት ይምረጡ",
  },
};

export default function CitizenChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [issueType, setIssueType] = useState(ISSUE_TYPES[0].value);
  const [language, setLanguage] = useState(LANGUAGE_OPTIONS[0].value);
  const listRef = useRef<HTMLDivElement | null>(null);

  const visible = user?.role === "citizen";

  useEffect(() => {
    if (!visible || !user) return;
    // load or create conversation for this user
    async function loadConv() {
      const { data } = await supabaseClient
        .from("chat_conversations")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (data) {
        setConversation(data as any);
      }
    }
    loadConv();
  }, [user, visible]);

  useEffect(() => {
    if (!conversation) return;
    let channel = supabaseClient.channel(`public:chat_messages:conversation=${conversation.id}`);

    async function loadMessages() {
      const { data } = await supabaseClient
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: true });
      setMessages(data ?? []);
      setTimeout(() => listRef.current?.scrollTo({ top: 99999 }), 50);
    }

    loadMessages();

    channel = supabaseClient
      .channel(`public:chat_messages:conversation=${conversation.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `conversation_id=eq.${conversation.id}` }, (payload: any) => {
        setMessages((s) => [...s, payload.new as any]);
        setTimeout(() => listRef.current?.scrollTo({ top: 99999 }), 50);
      })
      .subscribe();

    return () => {
      try {
        supabaseClient.removeChannel(channel);
      } catch (e) {}
    };
  }, [conversation]);

  const send = async () => {
    if (!text.trim()) return;
    let convId = conversation?.id;

    if (!convId) {
      const { data } = await supabaseClient
        .from("chat_conversations")
        .insert({ user_id: user!.id, issue_type: issueType, language })
        .select("*")
        .maybeSingle();
      setConversation(data as any);
      convId = data?.id;
    }

    if (!convId) return;

    await supabaseClient.from("chat_messages").insert({
      conversation_id: convId,
      sender: "citizen",
      sender_id: user!.id,
      content: text.trim(),
    });
    setText("");
  };

  if (!visible) return null;

  return (
    <div>
      <div className="fixed bottom-6 right-6 z-50">
        <Button onClick={() => setOpen((s) => !s)} className="rounded-full p-3">
          Support
        </Button>
      </div>

      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-80 rounded-lg border bg-white shadow-lg text-black">
          <div className="flex items-center justify-between border-b p-3">
            <div className="font-medium text-black">{LABELS[language].title}</div>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>{LABELS[language].close}</Button>
          </div>
          <div className="space-y-3 p-3">
            <div>
              <label className="block text-xs font-semibold text-black" htmlFor="issue-type">
                {LABELS[language].issueType}
              </label>
              <select
                id="issue-type"
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="mt-1 w-full rounded-md border bg-white px-3 py-2 text-black shadow-sm focus:border-primary focus:outline-none"
              >
                {ISSUE_TYPES.map((option) => (
                  <option key={option.value} value={option.value} className="text-black">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-black" htmlFor="language-select">
                {LABELS[language].language}
              </label>
              <select
                id="language-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="mt-1 w-full rounded-md border bg-white px-3 py-2 text-black shadow-sm focus:border-primary focus:outline-none"
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value} className="text-black">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="max-h-72 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3" ref={listRef}>
              {messages.length === 0 ? (
                <div className="text-sm text-black">{LABELS[language].noMessages}</div>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className={`mb-2 flex ${m.sender === 'citizen' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`rounded-lg px-3 py-2 ${m.sender === 'citizen' ? 'bg-primary text-primary-foreground' : 'bg-slate-100 text-black'}`}>
                      <div className="text-sm">{m.content}</div>
                      <div className="mt-1 text-xs text-slate-500">{new Date(m.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t pt-3">
              <div className="flex gap-2">
                <Input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={LABELS[language].placeholder}
                  className="text-black"
                />
                <Button onClick={send}>{LABELS[language].send}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
