import WebSocket from "ws";

type RoomClient = {
  userId: string;
  socket: WebSocket;
};

type Room = {
  roomId: string;
  clients: RoomClient[];
};

const rooms: Map<string, Room> = new Map();

export function getOrCreateRoom(roomId: string): Room {
  let room = rooms.get(roomId);
  if (!room) {
    room = { roomId, clients: [] };
    rooms.set(roomId, room);
  }
  return room;
}

export function addClientToRoom(
  roomId: string,
  userId: string,
  socket: WebSocket
): boolean {
  const room = getOrCreateRoom(roomId);

  if (room.clients.length >= 2) {
    return false;
  }

  room.clients.push({ userId, socket });
  return true;
}

export function removeClientFromRoom(
  roomId: string,
  userId: string
): RoomClient | null {
  const room = rooms.get(roomId);
  if (!room) return null;

  room.clients = room.clients.filter((client) => client.userId !== userId);

  if (room.clients.length === 0) {
    rooms.delete(roomId);
    return null;
  }

  // remaining peer (for 1:1 room, at most 1)
  return room.clients[0] || null;
}

export function getOtherClient(
  roomId: string,
  userId: string
): RoomClient | null {
  const room = rooms.get(roomId);
  if (!room) return null;

  const otherClient = room.clients.find((client) => client.userId !== userId);
  return otherClient || null;
}

export { rooms };
