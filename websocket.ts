import { WebSocketServer } from "ws";
import { setupWSConnection } from "y-websocket/bin/utils";
import { LeveldbPersistence } from "y-leveldb";

const port = Number(process.env.PORT || 1234);
const persistence = new LeveldbPersistence(process.env.YJS_DATA_DIR || "./.yjs-data");
const allowedOrigins = (process.env.WS_ALLOWED_ORIGINS || "http://localhost:3000").split(",").map(value => value.trim());
const wss = new WebSocketServer({
  port,
  maxPayload: 2 * 1024 * 1024,
  verifyClient: ({ origin }, done) => done(!origin || allowedOrigins.includes(origin), 403, "Origin not allowed"),
});
wss.on("connection", (conn, req) => setupWSConnection(conn, req, { gc: true, persistence }));
wss.on("listening", () => console.log(`Persistent Yjs WebSocket server listening on :${port}`));
process.on("SIGTERM", () => { wss.close(); });
process.on("SIGINT", () => { wss.close(); });
