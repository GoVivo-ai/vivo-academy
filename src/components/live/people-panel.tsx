"use client";

import { useParticipants } from "@livekit/components-react";
import { Hand, Mic, MicOff, Pin, PinOff, UserX, Crown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLive } from "./live-store";
import { parseMeta } from "@/lib/live/protocol";
import { initials } from "@/lib/format";
import { removeParticipantAction } from "@/app/(app)/en-vivo/actions";
import { cn } from "@/lib/utils";

export function PeoplePanel({ sessionId }: { sessionId: string }) {
  const { state, isHost, send } = useLive();
  const participants = useParticipants();
  const handOrder = new Map(state.hands.map((h, i) => [h.identity, i + 1]));

  const sorted = [...participants].sort((a, b) => {
    const ha = handOrder.get(a.identity) ?? 999;
    const hb = handOrder.get(b.identity) ?? 999;
    if (ha !== hb) return ha - hb;
    const ra = parseMeta(a.metadata).role === "host" ? 0 : 1;
    const rb = parseMeta(b.metadata).role === "host" ? 0 : 1;
    return ra - rb || (a.name ?? "").localeCompare(b.name ?? "");
  });

  return (
    <ul className="h-full overflow-y-auto p-2">
      {sorted.map((p) => {
        const meta = parseMeta(p.metadata);
        const hand = handOrder.get(p.identity);
        const spot = state.spotlight === p.identity;
        return (
          <li key={p.identity} className={cn("flex items-center gap-3 rounded-xl px-2 py-2", hand && "bg-brand-yellow/10")}>
            <Avatar className="size-8"><AvatarImage src={meta.image ?? undefined} /><AvatarFallback className="bg-white/10 text-xs">{initials(p.name)}</AvatarFallback></Avatar>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1 truncate text-sm font-medium">
                {p.name}{meta.role === "host" && <Crown className="size-3.5 text-brand-yellow" />}{p.isLocal && <span className="text-xs text-white/50">(tú)</span>}
              </p>
              {meta.jobRole && <p className="truncate text-xs text-white/50">{meta.jobRole}</p>}
            </div>
            {hand && <span className="flex items-center gap-1 rounded-full bg-brand-yellow px-2 py-0.5 text-xs font-bold text-black"><Hand className="size-3" />{hand}</span>}
            {p.isMicrophoneEnabled ? <Mic className="size-4 text-brand-green" /> : <MicOff className="size-4 text-white/30" />}
            {isHost && !p.isLocal && (
              <div className="flex gap-0.5">
                {hand && <button title="Bajar la mano" onClick={() => send({ t: "hand_clear", identity: p.identity })} className="rounded-lg p-1.5 hover:bg-white/10"><Hand className="size-4 text-brand-yellow" /></button>}
                <button title={spot ? "Quitar destaque" : "Destacar"} onClick={() => send({ t: "spotlight", identity: spot ? null : p.identity })} className="rounded-lg p-1.5 hover:bg-white/10">{spot ? <PinOff className="size-4" /> : <Pin className="size-4" />}</button>
                <button title="Expulsar" onClick={() => confirm(`¿Expulsar a ${p.name}?`) && removeParticipantAction(sessionId, p.identity)} className="rounded-lg p-1.5 hover:bg-red-500/20"><UserX className="size-4 text-red-400" /></button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
