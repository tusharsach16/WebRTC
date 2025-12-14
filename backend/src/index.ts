import WebSocket, {WebSocketServer} from "ws";
import { handleJoin, handleOffer, handleAnswer, handleIceCandidate, handleDisconnect } from "./sockets/handlers";
import type { ClientMessage } from "./types/signalling";
import http from 'http';
import { getIceServers } from "./turn";

const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;

const server = http.createServer(async (req, res) => {
  if (req.url === "/ice") {
    try {
      const iceServers = await getIceServers();
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      });
      res.end(JSON.stringify(iceServers));
    } catch (err) {
      res.writeHead(500);
      res.end("Failed to get ICE servers");
    }
    return;
  }

  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ server });


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

server.listen(PORT, () => {
    console.log(`Signaling + TURN server running on port ${PORT}`);
  });
  