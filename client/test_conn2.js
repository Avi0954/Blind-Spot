import { Client } from "colyseus.js";

const client = new Client("ws://localhost:2567");

client.joinOrCreate("game_room", { name: "TestBot", gameMode: "Different Reality" }).then(room => {
    console.log("Connected successfully to room:", room.roomId);
    console.log("State:", JSON.stringify(room.state.toJSON(), null, 2));
    process.exit(0);
}).catch(e => {
    console.error("Failed to connect:");
    console.error(e);
    process.exit(1);
});
