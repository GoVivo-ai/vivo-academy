"use client";

import { useMemo } from "react";
import { CarouselLayout, GridLayout, ParticipantTile, useTracks, type TrackReferenceOrPlaceholder } from "@livekit/components-react";
import { Track } from "livekit-client";
import { useLive } from "./live-store";
import { parseMeta } from "@/lib/live/protocol";
import { Video } from "lucide-react";

export function Stage() {
  const { state } = useLive();
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  const { focus, others } = useMemo(() => {
    const screen = tracks.find((t) => t.source === Track.Source.ScreenShare);
    let focus: TrackReferenceOrPlaceholder | undefined = screen;
    if (!focus && state.spotlight) focus = tracks.find((t) => t.participant.identity === state.spotlight && t.source === Track.Source.Camera);
    if (!focus) focus = tracks.find((t) => parseMeta(t.participant.metadata).role === "host" && t.source === Track.Source.Camera);
    const others = tracks.filter((t) => t !== focus);
    return { focus, others };
  }, [tracks, state.spotlight]);

  if (tracks.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-white/60">
        <Video className="size-10" />
        Esperando al instructor…
      </div>
    );
  }

  if (!focus) {
    return (
      <div className="h-full p-3">
        <GridLayout tracks={tracks} className="h-full">
          <ParticipantTile />
        </GridLayout>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-2 p-3">
      <div className="min-h-0 flex-1 overflow-hidden rounded-2xl bg-black">
        <ParticipantTile trackRef={focus} className="h-full" />
      </div>
      {others.length > 0 && (
        <div className="h-28 shrink-0">
          <CarouselLayout tracks={others} orientation="horizontal" className="h-full">
            <ParticipantTile className="!h-28 !w-40 rounded-xl overflow-hidden" />
          </CarouselLayout>
        </div>
      )}
    </div>
  );
}
