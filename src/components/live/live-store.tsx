"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import { useConnectionState, useDataChannel, useRoomContext } from "@livekit/components-react";
import { ConnectionState, RoomEvent } from "livekit-client";
import { toast } from "sonner";
import { decode, encode, TOPIC, type BoardElement, type LiveMessage, type LivePoll, type PollAnswer, type SyncState } from "@/lib/live/protocol";
import { celebrate } from "@/components/gamification/celebrate";

export type ChatMsg = { id: string; from: string; name: string; text: string; at: number; mine: boolean };
export type Reaction = { id: string; emoji: string; x: number };

type State = {
  chat: ChatMsg[];
  reactions: Reaction[];
  hands: Array<{ identity: string; at: number }>;
  poll: LivePoll | null;
  answers: PollAnswer[];
  revealed: boolean;
  boardOpen: boolean;
  canDraw: boolean;
  spotlight: string | null;
  board: Map<string, BoardElement>;
  boardVersion: number;
  unreadChat: number;
  panel: Panel;
  ended: boolean;
};

export type Panel = "chat" | "people" | "poll" | "board" | null;

type Action =
  | { type: "msg"; from: string; name: string; msg: LiveMessage; mine: boolean }
  | { type: "reaction_expire"; id: string }
  | { type: "panel"; panel: Panel }
  | { type: "local_board"; elements: BoardElement[] }
  | { type: "hand_left"; identity: string };

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "panel":
      return { ...s, panel: a.panel, unreadChat: a.panel === "chat" ? 0 : s.unreadChat };
    case "reaction_expire":
      return { ...s, reactions: s.reactions.filter((r) => r.id !== a.id) };
    case "hand_left":
      return { ...s, hands: s.hands.filter((h) => h.identity !== a.identity) };
    case "local_board": {
      const board = new Map(s.board);
      for (const el of a.elements) board.set(el.id, el);
      return { ...s, board };
    }
    case "msg": {
      const m = a.msg;
      switch (m.t) {
        case "chat":
          return {
            ...s,
            chat: [...s.chat, { id: m.id, from: a.from, name: a.name, text: m.text, at: m.at, mine: a.mine }].slice(-300),
            unreadChat: s.panel === "chat" || a.mine ? 0 : s.unreadChat + 1,
          };
        case "reaction":
          return { ...s, reactions: [...s.reactions, { id: `${a.from}-${Date.now()}-${Math.random()}`, emoji: m.emoji, x: 10 + Math.random() * 80 }].slice(-40) };
        case "hand": {
          const hands = s.hands.filter((h) => h.identity !== a.from);
          return { ...s, hands: m.up ? [...hands, { identity: a.from, at: m.at }].sort((x, y) => x.at - y.at) : hands };
        }
        case "hand_clear":
          return { ...s, hands: m.identity ? s.hands.filter((h) => h.identity !== m.identity) : [] };
        case "poll_start":
          return { ...s, poll: m.poll, answers: [], revealed: false, panel: "poll" };
        case "poll_answer":
          if (!s.poll || m.answer.pollId !== s.poll.id) return s;
          if (s.answers.some((x) => x.identity === m.answer.identity)) return s;
          return { ...s, answers: [...s.answers, m.answer] };
        case "poll_close":
          return s.poll && s.poll.id === m.pollId ? { ...s, poll: { ...s.poll, closedAt: Date.now() } } : s;
        case "poll_reveal":
          return s.poll && s.poll.id === m.pollId ? { ...s, revealed: true, poll: { ...s.poll, closedAt: s.poll.closedAt ?? Date.now() } } : s;
        case "board_update": {
          const board = new Map(s.board);
          for (const el of m.elements) {
            const prev = board.get(el.id);
            if (!prev || el.version > prev.version) board.set(el.id, el);
          }
          return { ...s, board, boardVersion: s.boardVersion + 1 };
        }
        case "board_clear":
          return { ...s, board: new Map(), boardVersion: s.boardVersion + 1 };
        case "board_perm":
          return { ...s, canDraw: m.canDraw };
        case "board_open":
          return { ...s, boardOpen: m.open, panel: m.open ? "board" : s.panel === "board" ? null : s.panel };
        case "spotlight":
          return { ...s, spotlight: m.identity };
        case "sync_state":
          return {
            ...s,
            poll: m.state.poll,
            answers: m.state.answers,
            hands: m.state.hands,
            boardOpen: m.state.boardOpen,
            canDraw: m.state.canDraw,
            spotlight: m.state.spotlight,
            revealed: m.state.revealed,
            panel: m.state.boardOpen ? "board" : m.state.poll && !m.state.poll.closedAt ? "poll" : s.panel,
          };
        case "session_end":
          return { ...s, ended: true };
        default:
          return s;
      }
    }
  }
}

const initial: State = {
  chat: [],
  reactions: [],
  hands: [],
  poll: null,
  answers: [],
  revealed: false,
  boardOpen: false,
  canDraw: false,
  spotlight: null,
  board: new Map(),
  boardVersion: 0,
  unreadChat: 0,
  panel: null,
  ended: false,
};

type Ctx = {
  state: State;
  isHost: boolean;
  me: { id: string; name: string };
  send: (m: LiveMessage, to?: string[]) => Promise<void>;
  setPanel: (p: Panel) => void;
  localBoard: (elements: BoardElement[]) => void;
  handUp: boolean;
};

const LiveCtx = createContext<Ctx | null>(null);

export function useLive() {
  const c = useContext(LiveCtx);
  if (!c) throw new Error("useLive fuera de LiveProvider");
  return c;
}

export function LiveProvider({ children, isHost, me }: { children: React.ReactNode; isHost: boolean; me: { id: string; name: string } }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const room = useRoomContext();
  const connState = useConnectionState(room);
  const syncedRef = useRef(false);
  const stateRef = useRef(state);
  const sendRef = useRef<Ctx["send"] | null>(null);
  useEffect(() => {
    stateRef.current = state;
  });

  const { send: rawSend } = useDataChannel(TOPIC, (msg) => {
    const m = decode(msg.payload);
    if (!m) return;
    const from = msg.from?.identity ?? "?";
    const name = msg.from?.name ?? "Alguien";
    // Solo el host responde a sync_request
    if (m.t === "sync_request") {
      if (isHost) {
        const st = stateRef.current;
        const sync: SyncState = { poll: st.poll, answers: st.answers, hands: st.hands, boardOpen: st.boardOpen, canDraw: st.canDraw, spotlight: st.spotlight, revealed: st.revealed };
        void sendRef.current?.({ t: "sync_state", state: sync }, [from]);
        // Enviar pizarra en lotes
        const els = [...st.board.values()];
        for (let i = 0; i < els.length; i += 15) void sendRef.current?.({ t: "board_update", elements: els.slice(i, i + 15) }, [from]);
      }
      return;
    }
    if (m.t === "sync_state") syncedRef.current = true;
    if (m.t === "chat" && from !== me.id && stateRef.current.panel !== "chat") {
      toast(`${name}: ${m.text}`, { duration: 3000 });
    }
    if (m.t === "hand" && m.up && isHost) toast(`✋ ${name} levantó la mano`, { duration: 4000 });
    if (m.t === "session_end") toast.info("El instructor finalizó la clase.");
    dispatch({ type: "msg", from, name, msg: m, mine: from === me.id });
  });

  const send = useCallback(
    async (m: LiveMessage, to?: string[]) => {
      await rawSend(encode(m), { reliable: true, topic: TOPIC, ...(to ? { destinationIdentities: to } : {}) });
      // Aplicar localmente (los data channels no hacen eco al emisor)
      if (!to) dispatch({ type: "msg", from: me.id, name: me.name, msg: m, mine: true });
    },
    [rawSend, me.id, me.name],
  );
  useEffect(() => {
    sendRef.current = send;
  }, [send]);

  // Pedir estado al conectar (los participantes), con reintentos hasta recibir sync_state
  useEffect(() => {
    if (isHost || connState !== ConnectionState.Connected) return;
    let attempts = 0;
    const tick = () => {
      if (syncedRef.current || attempts >= 5) return;
      attempts++;
      void rawSend(encode({ t: "sync_request" }), { reliable: true, topic: TOPIC }).catch(() => {});
    };
    const t0 = setTimeout(tick, 600);
    const iv = setInterval(tick, 2500);
    return () => {
      clearTimeout(t0);
      clearInterval(iv);
    };
  }, [connState, isHost, rawSend]);

  // Bajar la mano de quien se desconecta
  useEffect(() => {
    const onLeft = (p: { identity: string }) => dispatch({ type: "hand_left", identity: p.identity });
    room.on(RoomEvent.ParticipantDisconnected, onLeft);
    return () => {
      room.off(RoomEvent.ParticipantDisconnected, onLeft);
    };
  }, [room]);

  // Expirar reacciones
  useEffect(() => {
    if (state.reactions.length === 0) return;
    const t = setTimeout(() => dispatch({ type: "reaction_expire", id: state.reactions[0].id }), 2500);
    return () => clearTimeout(t);
  }, [state.reactions]);

  // Celebración de XP por asistir (viene del token)
  useEffect(() => {
    const raw = sessionStorage.getItem("live-celebration");
    if (raw) {
      sessionStorage.removeItem("live-celebration");
      try {
        celebrate(JSON.parse(raw));
      } catch {}
    }
  }, []);

  const handUp = state.hands.some((h) => h.identity === me.id);
  const value = useMemo<Ctx>(
    () => ({
      state,
      isHost,
      me,
      send,
      setPanel: (panel) => dispatch({ type: "panel", panel }),
      localBoard: (elements) => dispatch({ type: "local_board", elements }),
      handUp,
    }),
    [state, isHost, me, send, handUp],
  );
  return <LiveCtx.Provider value={value}>{children}</LiveCtx.Provider>;
}
