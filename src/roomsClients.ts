import { Socket } from "socket.io";

type Clients = {
    socket: Socket;
};

class RoomsClients {

    roomsClients: Record<string, Array<Clients>>= {};

    Get() {
        return this.roomsClients;
    } 
}

console.log('RoomsClients')

export default new RoomsClients();