import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function useChatUnread() {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    let channel = supabase.channel("public:chat_messages");

    async function load() {
      const { count: c } = await supabase
        .from("chat_messages")
        .select("id", { count: "exact", head: true })
        .eq("sender", "citizen")
        .eq("read_by_admin", false);
      setCount(c ?? 0);
    }

    load();

    channel = supabase
      .channel("public:chat_messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, (payload) => {
        const rec = payload.new as any;
        if (rec.sender === "citizen" && rec.read_by_admin === false) {
          setCount((s) => s + 1);
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "chat_messages" }, (payload) => {
        const oldRec = payload.old as any;
        const newRec = payload.new as any;
        // If a message was marked read_by_admin (true) and previously was false, decrement
        if (oldRec?.read_by_admin === false && newRec?.read_by_admin === true && newRec?.sender === "citizen") {
          setCount((s) => Math.max(0, s - 1));
        }
      })
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (e) {
        // ignore
      }
    };
  }, []);

  return { count };
}
