/**
 * Protocolo de mensajes que viaja por los data channels de LiveKit.
 * Todos los mensajes son JSON con un campo `t` (tipo).
 */

export type ParticipantMeta = { role: "host" | "participant"; image?: string | null; jobRole?: string | null };

export type LivePoll = {
  id: string;
  kind: "encuesta" | "quiz";
  question: string;
  options: string[];
  correctIndex: number | null;
  seconds: number;
  startedAt: number; // epoch ms
  closedAt?: number;
};

export type PollAnswer = { pollId: string; identity: string; name: string; optionIndex: number; responseMs: number };

export type BoardElement = { id: string; version: number; isDeleted?: boolean; [k: string]: unknown };

export type LiveMessage =
  // Chat y reacciones
  | { t: "chat"; id: string; text: string; at: number }
  | { t: "reaction"; emoji: string }
  // Mano levantada
  | { t: "hand"; up: boolean; at: number }
  | { t: "hand_clear"; identity?: string } // host baja la mano de alguien (o de todos)
  // Encuestas / quiz
  | { t: "poll_start"; poll: LivePoll }
  | { t: "poll_answer"; answer: PollAnswer }
  | { t: "poll_close"; pollId: string }
  | { t: "poll_reveal"; pollId: string } // muestra resultados/podio a todos
  // Pizarra
  | { t: "board_update"; elements: BoardElement[] }
  | { t: "board_clear" }
  | { t: "board_perm"; canDraw: boolean }
  | { t: "board_open"; open: boolean }
  // Control
  | { t: "spotlight"; identity: string | null }
  | { t: "sync_request" }
  | { t: "sync_state"; state: SyncState }
  | { t: "session_end" };

export type SyncState = {
  poll: LivePoll | null;
  answers: PollAnswer[];
  hands: Array<{ identity: string; at: number }>;
  boardOpen: boolean;
  canDraw: boolean;
  spotlight: string | null;
  revealed: boolean;
};

export const TOPIC = "vivo";

const enc = new TextEncoder();
const dec = new TextDecoder();

export function encode(m: LiveMessage) {
  return enc.encode(JSON.stringify(m));
}
export function decode(data: Uint8Array): LiveMessage | null {
  try {
    return JSON.parse(dec.decode(data)) as LiveMessage;
  } catch {
    return null;
  }
}

export function parseMeta(metadata?: string): ParticipantMeta {
  try {
    return metadata ? (JSON.parse(metadata) as ParticipantMeta) : { role: "participant" };
  } catch {
    return { role: "participant" };
  }
}

/** Puntos estilo Kahoot: máximo 1000, decrece con el tiempo de respuesta. */
export function quizPoints(correct: boolean, responseMs: number, seconds: number) {
  if (!correct) return 0;
  const frac = Math.min(1, Math.max(0, responseMs / (seconds * 1000)));
  return Math.round(1000 * (1 - frac / 2));
}
