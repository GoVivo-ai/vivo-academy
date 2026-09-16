import { AccessToken, RoomServiceClient } from "livekit-server-sdk";

export function livekitConfigured() {
  return !!(process.env.LIVEKIT_URL && process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET);
}

export function roomService() {
  const url = process.env.LIVEKIT_URL!.replace(/^wss?:\/\//, "https://");
  return new RoomServiceClient(url, process.env.LIVEKIT_API_KEY!, process.env.LIVEKIT_API_SECRET!);
}

export async function createToken(opts: {
  identity: string;
  name: string;
  roomName: string;
  isHost: boolean;
  metadata: Record<string, unknown>;
}) {
  const at = new AccessToken(process.env.LIVEKIT_API_KEY!, process.env.LIVEKIT_API_SECRET!, {
    identity: opts.identity,
    name: opts.name,
    metadata: JSON.stringify(opts.metadata),
    ttl: "4h",
  });
  at.addGrant({
    room: opts.roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    roomAdmin: opts.isHost,
    roomRecord: opts.isHost,
  });
  return at.toJwt();
}
