import { app,server }  from "./app.js";
import router from "./router.js";
import serve from "koa-static";
import io from "./io.js";
import RoomsClients from "./roomsClients.js";

const roomsClients = RoomsClients.Get();

type Msg = {
    time: number,
    content?:string,
    client_id?: string
    client_name?: string
    from_client_id?: string
    from_client_name?: string
    to_client_id?: string
    to_client_name?: string
    client_list?: Record<string, string>,

};
 
app.use(router.routes());

app.use(serve('static')); //http://localhost:3000/js/jquery.min.js

io.on('connection', (socket) => {

    console.log('socket id: ' + socket.id);

    socket.on('login', (req) => {

        console.log('login.req: ' + req);

        var login = JSON.parse(req);

        const room_name:string = login.room_name;
        const client_name:string = login.client_name;

        let msg: Msg = {
            'time': Date.now(),
            'client_id': socket.id,
            'client_name': client_name,
        };

        let clientList: Record < string, string >= { };

        if (Array.isArray(roomsClients[room_name]) && roomsClients[room_name].length) {

            for (const client of roomsClients[room_name]) {

                clientList[client.socket.id] = client.socket.data.client_name

                client.socket.emit('login', msg);

            }

        }

        socket.data.room_name = room_name;
        socket.data.client_name = client_name;

        socket.join(room_name);

        if (Array.isArray(roomsClients[room_name]) && roomsClients[room_name].length){

            roomsClients[room_name].push({ socket: socket});

        }else{

            roomsClients[room_name] = [];
            roomsClients[room_name].push({ socket: socket});

        }

        msg.client_list = clientList

        socket.emit('login', msg);

        console.log('login roomsClients', roomsClients);
    });

    socket.on('say', async (req) => {

        console.log('say.req: ' + req);
        console.log('say room', socket.data.room_name);

        var say = JSON.parse(req);

        let origContent: string = say.content

        let msg: Msg = {
            'time': Date.now(),
            'client_id': socket.id,
            'client_name': socket.data.client_name,
            'from_client_id': socket.id,
            'from_client_name': socket.data.client_name,
            'to_client_id': say.to_client_id,
            'to_client_name': say.to_client_name,
        };

        const clientSockets = await io.in(socket.data.room_name).fetchSockets();

        for (const clientSocket of clientSockets) {

            if (msg.to_client_id != "all") {

                if (msg.to_client_id == clientSocket.id) {

                    msg.content = "<b>對你說: </b>" + origContent

                } else if (msg.client_id == clientSocket.id ){

                    msg.content = "<b>你對" + msg.to_client_name + "說: </b>" + origContent

                } else {

                    continue;

                }

            }else{

                msg.content = origContent

            }

            clientSocket.emit('say', msg);
        }

    });


    socket.on('disconnect', () => {

        console.log('disconnect', socket.id);
        
        const room_name:string = socket.data.room_name;

        if (Array.isArray(roomsClients[room_name])){

            let removeIndex: number = -1

            roomsClients[room_name].forEach((element, index) => {

                if (socket.id === roomsClients[room_name][index].socket.id) {

                    removeIndex = index
 
                }else{

                    let msg: Msg = {
                        'time': Date.now(),
                        'from_client_id': socket.id,
                        'from_client_name': socket.data.client_name,
                    };

                    roomsClients[room_name][index].socket.emit('logout', msg);   

                    console.log(roomsClients[room_name][index].socket.data);                
                }

            });  

            if (removeIndex>-1){           

                roomsClients[room_name].splice(removeIndex, 1); 

            }

            if (roomsClients[room_name].length===0){

                delete roomsClients[room_name];

            }
        } 

        console.log('disconnect roomsClients', roomsClients);

    });
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});