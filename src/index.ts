import { app,server }  from "./app.js";
import router from "./router.js";
import serve from "koa-static";
import io from "./io.js";

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

    console.log('connection socket id : ' + socket.id);

    socket.on('login',async (req) => {

        console.log('login.req : ' + req);

        var login = JSON.parse(req);

        const room_name:string = login.room_name;
        const client_name:string = login.client_name;

        let msg: Msg = {
            'time': Date.now(),
            'client_id': socket.id,
            'client_name': client_name,
        };

        socket.to(room_name).emit('login', msg);

        let clientList: Record < string, string >= { };

        const clientSockets = await io.in(room_name).fetchSockets();

        for (const clientSocket of clientSockets) {

            clientList[clientSocket.id] = clientSocket.data.client_name
        }

        socket.data.room_name = room_name;
        socket.data.client_name = client_name;

        socket.join(room_name);

        msg.client_list = clientList

        socket.emit('login', msg);

    });

    socket.on('say', async (req) => {

        console.log('say.req : ' + req);

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


    socket.on('disconnect',async () => {

        console.log('disconnect socker id : ', socket.id);
        
        const room_name:string = socket.data.room_name;

        const clientSockets = await io.in(room_name).fetchSockets();

        let roomUserCount=0;

        for (const clientSocket of clientSockets) {

            if (socket.id === clientSocket.id) {
                continue;
            }

            let msg: Msg = {
                'time': Date.now(),
                'from_client_id': socket.id,
                'from_client_name': socket.data.client_name,
            };

            clientSocket.emit('logout', msg);   

            roomUserCount++;
        }

        if(roomUserCount==0){
            console.log('room '+room_name+' is no one');
        }

    });
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});