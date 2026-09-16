"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { useLive } from "./live-store";
import { cn } from "@/lib/utils";

export function ChatPanel() {
  const { state, send } = useLive();
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.chat.length]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    void send({ t: "chat", id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, text: t.slice(0, 500), at: Date.now() });
    setText("");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {state.chat.length === 0 && <p className="pt-10 text-center text-sm text-white/50">Sé el primero en escribir 👋</p>}
        {state.chat.map((m) => (
          <div key={m.id} className={cn("flex flex-col", m.mine ? "items-end" : "items-start")}>
            {!m.mine && <span className="mb-0.5 px-1 text-[11px] text-white/50">{m.name}</span>}
            <div className={cn("max-w-[85%] rounded-2xl px-3 py-2 text-sm", m.mine ? "bg-brand-green text-brand-navy" : "bg-white/10")}>{m.text}</div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <form onSubmit={submit} className="flex gap-2 border-t border-white/10 p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe un mensaje…"
          className="h-10 flex-1 rounded-full bg-white/10 px-4 text-sm outline-none placeholder:text-white/40 focus:ring-2 focus:ring-brand-green"
        />
        <button type="submit" className="grid size-10 place-items-center rounded-full bg-brand-green text-brand-navy hover:bg-brand-green/90" aria-label="Enviar"><Send className="size-4" /></button>
      </form>
    </div>
  );
}
