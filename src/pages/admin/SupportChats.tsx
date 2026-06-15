import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SupportChats() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    // load conversations
    supabase
      .from("chat_conversations")
      .select("id, user_id, created_at, profiles(full_name, email)")
      .order("created_at", { ascending: false })
      .then(({ data }) => setConversations(data ?? []));

    const channel = supabase
      .channel("public:chat_conversations")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_conversations" }, (p) => {
        setConversations((s) => [p.new as any, ...s]);
      })
      .subscribe();

    return () => { try { supabase.removeChannel(channel); } catch (e) {} };
  }, []);

  useEffect(() => {
    if (!selected) return;
    let channel = supabase.channel(`public:chat_messages:conversation=${selected.id}`);

    async function loadMessages() {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", selected.id)
        .order("created_at", { ascending: true });
      setMessages(data ?? []);
    }

    loadMessages();

    channel = supabase
      .channel(`public:chat_messages:conversation=${selected.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `conversation_id=eq.${selected.id}` }, (payload) => {
        setMessages((s) => [...s, payload.new as any]);
      })
      .subscribe();

    // mark messages as read_by_admin
    supabase.from("chat_messages").update({ read_by_admin: true }).eq("conversation_id", selected.id).eq("sender", "citizen");

    return () => { try { supabase.removeChannel(channel); } catch (e) {} };
  }, [selected]);

  const reply = async () => {
    if (!selected || !text.trim()) return;
    await supabase.from("chat_messages").insert({
      conversation_id: selected.id,
      sender: user?.role === "agent" ? "agent" : "admin",
      sender_id: user?.id,
      content: text.trim(),
      read_by_admin: true,
    });
    setText("");
  };

  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="col-span-1 rounded-xl border bg-card p-4">
        <h2 className="text-sm font-semibold">Conversations</h2>
        <div className="mt-3 space-y-2">
          {conversations.map((c) => (
            <button key={c.id} onClick={() => setSelected(c)} className="w-full text-left rounded-md p-2 hover:bg-muted">
              <div className="text-sm font-medium">{c.profiles?.full_name ?? c.profiles?.email ?? c.user_id}</div>
              <div className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString()}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="col-span-3 rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">{selected ? (selected.profiles?.full_name ?? selected.user_id) : 'Select a conversation'}</h2>
        </div>

        {!selected ? (
          <div className="mt-6 text-sm text-muted-foreground">Select a conversation to view messages and reply.</div>
        ) : (
          <>
            <div className="mt-4 max-h-72 overflow-auto rounded-md border p-3">
              {messages.map((m) => (
                <div key={m.id} className={`mb-2 flex ${m.sender === 'citizen' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`rounded-lg px-3 py-2 ${m.sender === 'citizen' ? 'bg-muted' : 'bg-primary text-primary-foreground'}`}>
                    <div className="text-sm">{m.content}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Reply..." />
              <Button onClick={reply}>Send</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
