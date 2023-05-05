import Router from "koa-router";
import fs from "fs";
import io  from "./io.js";
import RoomsClients from "./roomsClients.js";

const roomsClients = RoomsClients.Get();

const router = new Router();

router.get('/', ctx => {
    ctx.response.type = 'html';
    ctx.response.body = fs.createReadStream('./index.html');
});

router.get('/room/:name', async (ctx) => {

    const room_name = ctx.params.name;

    console.log('get room name :', room_name);

    const sockets = await io.in(room_name).fetchSockets();

    for (const socket of sockets) {

        console.log(socket.id);
        console.log(socket.rooms);
        console.log(socket.data);

    }

    ctx.response.type = 'application/json';
    const rooms= Object.keys(roomsClients);

    ctx.response.body = {
        "status": true,
        "result": {'rooms':rooms}
    };
});

router.delete('/room/:name', async (ctx) => {

    const room_name = ctx.params.name;

    console.log('delete room name :', room_name);

    if (Array.isArray(roomsClients[room_name])){
        delete roomsClients[room_name];
    }

    //io.socketsLeave(room_name);
    io.in(room_name).disconnectSockets(true);

    ctx.response.type = 'application/json';
    ctx.response.body = {
        "status": true,
        "result": ''
    };
});

router.get('/room/:name/update_shopping_cart', async (ctx) => {

    const room_name = ctx.params.name;
    console.log('get room name :', room_name);

    const sockets = await io.in(room_name).fetchSockets();
    
    for (const socket of sockets) {
  
        socket.emit('update_shopping_cart',true);    

    }

    ctx.response.type = 'application/json';
    ctx.response.body = {
        "status": true,
        "result": ''
    };
});

console.log('router')

export default router

