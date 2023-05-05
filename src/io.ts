import {server} from "./app.js";
import { Server } from "socket.io";

const io = new Server(server);

console.log('io')

export default  io

