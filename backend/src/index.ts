import WebSocket, {WebSocketServer} from "ws";
import { handleJoin, handleOffer, handleAnswer, handleIceCandidate, handleDisconnect } from "./sockets/handlers";
import type { ClientMessage } from "./types/signalling";

const wss = new WebSocketServer({port:8080});

wss.on("connection", (ws: WebSocket) => {
    console.log("New client connected");

    let currentRoomId: string | null = null;
    let currentUserId: string | null = null;

    ws.on("error", (error) => {
        console.error("WebSocket error:", error);
    });

    ws.on("message", (raw) => {
        let msg: ClientMessage;
        try {
            msg = JSON.parse(raw.toString());
        } catch (e) {
            console.error("Invalid message format:", raw.toString());
            return;
        }

        switch(msg.type) {
            case "join": {
                currentRoomId = msg.roomId;
                currentUserId = msg.userId;
                handleJoin(ws, msg);
                break;
            }
            case "offer": {
                handleOffer(ws, msg);
                break;
            }

            case "answer": {
                handleAnswer(ws, msg);
                break;
            }

            case "ice-candidate": {
                handleIceCandidate(ws, msg);
                break;
            }

            default:
                console.warn("Unknown message type:", msg);
        }
    });

    ws.on("close", () => {
        console.log("Client Disconnected");
        if(currentRoomId && currentUserId) {
            handleDisconnect(currentRoomId, currentUserId);
        }
    });
});

console.log("WebRTC running on ws://localhost:8080");