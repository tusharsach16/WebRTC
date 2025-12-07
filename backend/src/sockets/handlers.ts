import { WebSocket} from "ws";
import {addClientToRoom, getOtherClient, removeClientFromRoom} from "./rooms";
import {forwardToPeer} from "./forward";
import type {JoinMessage, OfferMessage, AnswerMessage, IceCandidateMessage } from "../types/signalling";

export function handleJoin(ws: WebSocket, message: JoinMessage): void {
  const { userId, roomId } = message;

  const success = addClientToRoom(roomId, userId, ws);
  if (!success) {
    ws.send(JSON.stringify({ type: "room_full" }));
    return;
  }

  const otherClient = getOtherClient(roomId, userId);

  if (!otherClient) {
    ws.send(JSON.stringify({ type: "waiting_for_peer" }));
    return;
  }

  ws.send(
    JSON.stringify({
      type: "peer_joined",
      otherUserId: otherClient.userId,
    })
  );

  otherClient.socket.send(
    JSON.stringify({
      type: "peer_joined",
      otherUserId: userId,
    })
  );
}

export function handleOffer(ws: WebSocket, message: OfferMessage): void {
    forwardToPeer(message);
}

export function handleAnswer(ws: WebSocket, message: AnswerMessage): void {
    forwardToPeer(message);
}

export function handleIceCandidate(ws: WebSocket, message: IceCandidateMessage): void {
    forwardToPeer(message);
}

export function handleDisconnect(roomId: string, userId: string): void {
  const otherClient = removeClientFromRoom(roomId, userId);

  if (otherClient) {
    otherClient.socket.send(
      JSON.stringify({
        type: "peer_disconnected",
        userId
      })
    );
  }
}

