import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import express from "express";
import http from "http";
import cors from "cors";
import { GameRoom } from "./rooms/GameRoom";

const port = Number(process.env.PORT || 2567);
const app = express();

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const gameServer = new Server({
  transport: new WebSocketTransport({
    server
  })
});

gameServer.define("game_room", GameRoom);

app.get("/", (_req, res) => {
  res.send("Blind Spot Server");
});

gameServer.listen(port).then(() => {
  console.log(`[Blind Spot] Server listening on ws://localhost:${port}`);
});
