import { Schema, type } from "@colyseus/schema";
import { Vector3 } from "./Vector3";

export class ChatMessage extends Schema {
  @type("string") id: string = "";
  @type("string") senderId: string = "";
  @type("string") senderName: string = "";
  @type("string") text: string = "";
  @type("string") type: string = "normal"; // normal, quick, system
  @type("number") timestamp: number = 0;
}

export class WorldPing extends Schema {
  @type("string") id: string = "";
  @type("string") senderId: string = "";
  @type("string") senderName: string = "";
  @type("string") type: string = "LOOK_HERE"; 
  @type(Vector3) position: Vector3 = new Vector3();
  @type("number") createdAt: number = 0;
  @type("number") expiresAt: number = 0;
}
