"use client";

import "@livekit/components-styles";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LiveKitRoom, RoomAudioRenderer, ConnectionStateToast } from "@livekit/components-react";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiveProvider } from "./live-store";
import { LiveLayout } from "./live-layout";
import { markLeftAction } from "@/app/(app)/en-vivo/actions";

export function LiveRoom({ sessionId, title, isHost, me }: { sessionId: string; title: string; isHost: boolean; me: { id: string; name: string; image: string | null } }) {
  const [conn, setConn] = useState<{ token: string; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/livekit/token?session=${sessionId}`)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error ?? "No se pudo entrar");
        return j;
      })
      .then((j) => {
        if (cancelled) return;
        if (j.celebration?.awarded) sessionStorage.setItem("live-celebration", JSON.stringify(j.celebration));
        setConn({ token: j.token, url: j.url });
      })
      .catch((e) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (error) {
    return (
      <div className="mx-auto max-w-md rounded-3xl border p-8 text-center">
        <AlertTriangle className="mx-auto size-8 text-brand-gold" />
        <p className="mt-3 font-medium">{error}</p>
        <Button className="mt-4" variant="outline" onClick={() => router.push("/en-vivo")}>Volver</Button>
      </div>
    );
  }
  if (!conn) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="size-8 animate-spin" />
        Conectando al aula…
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-brand-navy-900 text-white" data-lk-theme="default">
      <LiveKitRoom
        serverUrl={conn.url}
        token={conn.token}
        connect
        audio={isHost}
        video={isHost}
        options={{ adaptiveStream: true, dynacast: true, publishDefaults: { simulcast: true } }}
        onDisconnected={() => {
          void markLeftAction(sessionId);
          router.push("/en-vivo");
          router.refresh();
        }}
        className="h-full"
      >
        <LiveProvider isHost={isHost} me={{ id: me.id, name: me.name }}>
          <LiveLayout sessionId={sessionId} title={title} />
        </LiveProvider>
        <RoomAudioRenderer />
        <ConnectionStateToast />
      </LiveKitRoom>
    </div>
  );
}
