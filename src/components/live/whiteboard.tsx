"use client";

import "@excalidraw/excalidraw/index.css";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { Eraser, Lock, Unlock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLive } from "./live-store";
import type { BoardElement } from "@/lib/live/protocol";

const Excalidraw = dynamic(() => import("@excalidraw/excalidraw").then((m) => m.Excalidraw), { ssr: false });

export function Whiteboard() {
  const { state, isHost, send, setPanel, localBoard } = useLive();
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const known = useRef(new Map<string, number>()); // id -> version enviada/recibida
  const pendingRef = useRef(new Map<string, BoardElement>());
  const [ready, setReady] = useState(false);
  const canDraw = isHost || state.canDraw;

  // Aplicar cambios remotos
  useEffect(() => {
    if (!apiRef.current || !ready) return;
    const remote = [...state.board.values()];
    const current = new Map(apiRef.current.getSceneElementsIncludingDeleted().map((e) => [e.id, e]));
    let changed = false;
    for (const el of remote) {
      const cur = current.get(el.id);
      if (!cur || el.version > cur.version) {
        current.set(el.id, el as unknown as (typeof cur & object));
        known.current.set(el.id, el.version);
        changed = true;
      }
    }
    if (changed) apiRef.current.updateScene({ elements: [...current.values()] as never });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.boardVersion, ready]);

  // Enviar cambios locales (throttle)
  const flush = useCallback(() => {
    const batch = [...pendingRef.current.values()];
    pendingRef.current.clear();
    if (batch.length === 0) return;
    for (let i = 0; i < batch.length; i += 15) void send({ t: "board_update", elements: batch.slice(i, i + 15) });
    localBoard(batch);
  }, [send, localBoard]);

  useEffect(() => {
    const t = setInterval(flush, 250);
    return () => clearInterval(t);
  }, [flush]);

  const onChange = useCallback(
    (elements: readonly { id: string; version: number; isDeleted: boolean }[]) => {
      if (!canDraw) return;
      for (const el of elements) {
        const v = known.current.get(el.id);
        if (v === undefined || el.version > v) {
          known.current.set(el.id, el.version);
          pendingRef.current.set(el.id, el as unknown as BoardElement);
        }
      }
    },
    [canDraw],
  );

  const clear = () => {
    apiRef.current?.updateScene({ elements: [] });
    known.current.clear();
    void send({ t: "board_clear" });
  };

  return (
    <div className="relative h-full bg-white">
      <div className="absolute right-3 top-3 z-10 flex gap-2">
        {isHost && (
          <>
            <Button size="sm" variant="outline" onClick={() => send({ t: "board_perm", canDraw: !state.canDraw })} className="bg-white text-black">
              {state.canDraw ? <Unlock className="size-4" /> : <Lock className="size-4" />}{state.canDraw ? "Todos dibujan" : "Solo yo dibujo"}
            </Button>
            <Button size="sm" variant="outline" onClick={clear} className="bg-white text-black"><Eraser className="size-4" />Limpiar</Button>
            <Button size="sm" variant="outline" onClick={() => send({ t: "board_open", open: false })} className="bg-white text-black"><X className="size-4" />Cerrar pizarra</Button>
          </>
        )}
        {!isHost && <Button size="sm" variant="outline" onClick={() => setPanel(null)} className="bg-white text-black"><X className="size-4" />Volver al video</Button>}
      </div>
      <Excalidraw
        excalidrawAPI={(api) => {
          apiRef.current = api;
          setReady(true);
          const initial = [...state.board.values()];
          if (initial.length) {
            api.updateScene({ elements: initial as never });
            for (const el of initial) known.current.set(el.id, el.version);
          }
        }}
        onChange={onChange}
        viewModeEnabled={!canDraw}
        langCode="es-ES"
        UIOptions={{ canvasActions: { loadScene: false, saveToActiveFile: false, export: false, saveAsImage: true } }}
      />
    </div>
  );
}
