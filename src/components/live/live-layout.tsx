"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { DisconnectButton, TrackToggle, useParticipants, useLocalParticipant } from "@livekit/components-react";
import { Track } from "livekit-client";
import { Hand, MessageSquare, Users, BarChart3, PenTool, PhoneOff, Mic, MicOff, Video, VideoOff, MonitorUp, MonitorX, Smile, X, MoreVertical, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Stage } from "./stage";
import { ChatPanel } from "./chat-panel";
import { PeoplePanel } from "./people-panel";
import { PollPanel } from "./poll-panel";
import { Whiteboard } from "./whiteboard";
import { QuizOverlay } from "./quiz-overlay";
import { useLive, type Panel } from "./live-store";
import { endSessionAction, muteAllAction } from "@/app/(app)/en-vivo/actions";
import { cn } from "@/lib/utils";

const REACTIONS = ["👏", "❤️", "🤯", "😂", "🔥", "👍"];

export function LiveLayout({ sessionId, title }: { sessionId: string; title: string }) {
  const { state, isHost, send, setPanel, handUp } = useLive();
  const participants = useParticipants();
  const { isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } = useLocalParticipant();
  const [showReactions, setShowReactions] = useState(false);
  const [pending, start] = useTransition();

  const toggle = (p: Panel) => setPanel(state.panel === p ? null : p);

  const endSession = () =>
    start(async () => {
      await send({ t: "session_end" });
      await endSessionAction(sessionId);
    });

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-white/10 px-4">
        <span className="flex items-center gap-2 rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs font-semibold text-red-300"><span className="size-2 animate-pulse rounded-full bg-red-500" />EN VIVO</span>
        <h1 className="truncate font-semibold">{title}</h1>
        <span className="ml-auto flex items-center gap-1 text-sm text-white/70"><Users className="size-4" />{participants.length}</span>
        {isHost && (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button size="icon" variant="ghost" className="text-white hover:bg-white/10 hover:text-white" />}><MoreVertical className="size-5" /></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => muteAllAction(sessionId)}><MicOff className="size-4" />Silenciar a todos</DropdownMenuItem>
              <DropdownMenuItem onClick={() => send({ t: "hand_clear" })}><Hand className="size-4" />Bajar todas las manos</DropdownMenuItem>
              <DropdownMenuItem onClick={() => send({ t: "board_open", open: !state.boardOpen })}><PenTool className="size-4" />{state.boardOpen ? "Cerrar pizarra" : "Abrir pizarra para todos"}</DropdownMenuItem>
              <DropdownMenuItem onClick={endSession} className="text-destructive"><PhoneOff className="size-4" />Finalizar clase</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </header>

      {/* Body */}
      <div className="relative flex min-h-0 flex-1">
        <div className="relative min-w-0 flex-1">
          {state.boardOpen && state.panel === "board" ? <Whiteboard /> : <Stage />}
          {/* Reacciones flotantes */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <AnimatePresence>
              {state.reactions.map((r) => (
                <motion.span key={r.id} initial={{ opacity: 1, y: 0, scale: 0.6 }} animate={{ opacity: 0, y: -280, scale: 1.4 }} exit={{ opacity: 0 }} transition={{ duration: 2.4, ease: "easeOut" }} className="absolute bottom-24 text-4xl" style={{ left: `${r.x}%` }}>
                  {r.emoji}
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
          {/* Manos levantadas (chip) */}
          {state.hands.length > 0 && (
            <button onClick={() => setPanel("people")} className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-brand-yellow px-3 py-1 text-sm font-semibold text-black shadow">
              <Hand className="size-4" />{state.hands.length} {state.hands.length === 1 ? "mano" : "manos"}
            </button>
          )}
          <QuizOverlay />
        </div>

        {/* Panel lateral */}
        <AnimatePresence>
          {state.panel && state.panel !== "board" && (
            <motion.aside initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }} transition={{ duration: 0.18 }} className="absolute inset-y-0 right-0 z-10 flex w-full flex-col border-l border-white/10 bg-brand-navy sm:static sm:w-80 lg:w-96">
              <div className="flex h-11 items-center justify-between border-b border-white/10 px-3">
                <p className="text-sm font-semibold">{state.panel === "chat" ? "Chat" : state.panel === "people" ? "Participantes" : "Encuestas y quiz"}</p>
                <Button size="icon-sm" variant="ghost" className="text-white hover:bg-white/10 hover:text-white" onClick={() => setPanel(null)}><X className="size-4" /></Button>
              </div>
              <div className="min-h-0 flex-1">
                {state.panel === "chat" && <ChatPanel />}
                {state.panel === "people" && <PeoplePanel sessionId={sessionId} />}
                {state.panel === "poll" && <PollPanel sessionId={sessionId} />}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Barra de controles */}
      <footer className="flex h-16 shrink-0 items-center justify-center gap-2 border-t border-white/10 px-3">
        <TrackToggle source={Track.Source.Microphone} showIcon={false} className={ctl(isMicrophoneEnabled)} aria-label="Micrófono">
          {isMicrophoneEnabled ? <Mic className="size-5" /> : <MicOff className="size-5" />}
        </TrackToggle>
        <TrackToggle source={Track.Source.Camera} showIcon={false} className={ctl(isCameraEnabled)} aria-label="Cámara">
          {isCameraEnabled ? <Video className="size-5" /> : <VideoOff className="size-5" />}
        </TrackToggle>
        {isHost && (
          <TrackToggle source={Track.Source.ScreenShare} showIcon={false} className={ctl(isScreenShareEnabled)} aria-label="Compartir pantalla">
            {isScreenShareEnabled ? <MonitorX className="size-5" /> : <MonitorUp className="size-5" />}
          </TrackToggle>
        )}
        <span className="mx-1 h-8 w-px bg-white/10" />

        <div className="relative">
          <button onClick={() => setShowReactions((v) => !v)} className={ctl(showReactions)} aria-label="Reacciones"><Smile className="size-5" /></button>
          <AnimatePresence>
            {showReactions && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="absolute bottom-14 left-1/2 flex -translate-x-1/2 gap-1 rounded-full bg-brand-navy-700 p-1.5 shadow-xl">
                {REACTIONS.map((e) => (
                  <button key={e} onClick={() => { void send({ t: "reaction", emoji: e }); setShowReactions(false); }} className="rounded-full p-1.5 text-2xl transition hover:scale-125 hover:bg-white/10">{e}</button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {!isHost && (
          <button onClick={() => send({ t: "hand", up: !handUp, at: Date.now() })} className={cn(ctl(handUp), handUp && "bg-brand-yellow text-brand-navy hover:bg-brand-yellow/90")} aria-label="Levantar la mano"><Hand className="size-5" /></button>
        )}
        <button onClick={() => toggle("chat")} className={cn(ctl(state.panel === "chat"), "relative")} aria-label="Chat">
          <MessageSquare className="size-5" />
          {state.unreadChat > 0 && <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-red-500 text-[10px] font-bold">{state.unreadChat}</span>}
        </button>
        <button onClick={() => toggle("people")} className={ctl(state.panel === "people")} aria-label="Participantes"><Users className="size-5" /></button>
        <button onClick={() => toggle("poll")} className={cn(ctl(state.panel === "poll"), state.poll && !state.poll.closedAt && "ring-2 ring-brand-green")} aria-label="Encuestas"><BarChart3 className="size-5" /></button>
        {(isHost || state.boardOpen) && (
          <button
            onClick={() => {
              if (isHost && !state.boardOpen) void send({ t: "board_open", open: true });
              else toggle("board");
            }}
            className={ctl(state.panel === "board")}
            aria-label="Pizarra"
          >
            <PenTool className="size-5" />
          </button>
        )}
        <span className="mx-1 h-8 w-px bg-white/10" />
        {isHost ? (
          <Button onClick={endSession} disabled={pending} className="rounded-full bg-red-500 px-4 text-white hover:bg-red-600">
            {pending ? <Loader2 className="size-4 animate-spin" /> : <PhoneOff className="size-4" />}Finalizar
          </Button>
        ) : (
          <DisconnectButton className="!flex !h-10 !items-center !gap-2 !rounded-full !bg-red-500 !px-4 !text-sm !font-medium !text-white hover:!bg-red-600">
            <PhoneOff className="size-4" />Salir
          </DisconnectButton>
        )}
      </footer>
    </div>
  );
}

function ctl(active: boolean) {
  return cn(
    "grid size-10 place-items-center rounded-full transition [&>svg]:size-5",
    active ? "bg-white text-black hover:bg-white/90" : "bg-white/10 text-white hover:bg-white/20",
  );
}
