import Koa from "koa";
import { createServer } from "http";

const app = new Koa();
const server = createServer(app.callback());

console.log('app')

export { app, server } 
