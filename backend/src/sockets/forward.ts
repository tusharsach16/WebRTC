import { rooms } from "./rooms";
import type { OfferMessage, AnswerMessage, IceCandidateMessage } from "../types/signalling";

type ForwardableMessage = OfferMessage | AnswerMessage | IceCandidateMessage;

export function forwardToPeer(message: ForwardableMessage) {
    let room = rooms.get(message.roomId);
    if(!room) return;
    const peer = room.clients.find(c => c.userId === message.to);
    if (!peer) return;
    peer.socket.send(JSON.stringify(message));
}
