const http = require('http');
const express = require('express')
const WebSocketServer = require("websocket").server;
const path = require("path");



const port = process.env.PORT;
const app = express();

const server = http.createServer(app).listen(port, () => console.log("listening to port 4001"));
app.use("/", (req, res, next) => {
    console.log('req')
    next();
});
app.use(express.static(path.join(__dirname, "public")));

//websocket 
const clients = {};
const gameRoom = {};


const websocket = new WebSocketServer({
    httpServer: server
})
websocket.on('request', request => {
    console.log("recieved websocket request");
    
    let connection = request.accept(null, request.origin);

    let clientId = guid();

    connection.on('message', (message) => {
        let recievedMessage = JSON.parse(message.utf8Data);
        
        if (recievedMessage.method === "newConnect" && !recievedMessage.clientId) {
            clients[clientId] = {
                "Id": clientId,
                "name": recievedMessage.name,
                'connection': connection
            }
            // console.log(clients)
            if (clients[clientId]) {
                let payload = {
                    "method": "newConnection",
                    "status": "successful",
                    "yourId": clients[clientId].Id
                }
                // console.log(payload)
                clients[clientId].connection.send(JSON.stringify(payload))
            }
             console.log(clients[clientId].connection)
        }
        else if (clients.hasOwnProperty(recievedMessage.clientId)) {
            switch (recievedMessage.method) {
                case 'createRoom':
                    let gameId = guid();
                    gameRoom[gameId] = {
                        "creator": recievedMessage.clientId,
                        "gameMembersId": [recievedMessage.clientId],
                        "name": recievedMessage.name
                    }

                    let payload = {
                        "method": "createRoom",
                        "status": "successful",
                        "gameId": gameId,
                        "gameName": gameRoom[gameId].name
                    }
                    clients[clientId].connection.send(JSON.stringify(payload));
                    // console.log(gameRoom)
                    break;
                case 'joinRoom':

                    if (gameRoom.hasOwnProperty(recievedMessage.gameId)) {
                        gameRoom[recievedMessage.gameId].gameMembersId.push(recievedMessage.clientId)
                        // console.log(gameRoom);
                        let status = gameRoom[recievedMessage.gameId].gameMembersId.some(ele => {
                            return ele == recievedMessage.clientId;
                        })
                        if (status) {

                            let payload = {
                                "method": "joinRoom",
                                "status": "successful",
                                "gameId": recievedMessage.gameId,
                                "gameName": gameRoom[recievedMessage.gameId].name
                            }
                            clients[recievedMessage.clientId].connection.send(JSON.stringify(payload));

                            gameRoom[recievedMessage.gameId].gameMembersId.forEach(ele => {
                                if (ele !== recievedMessage.clientId) {
                                    let payload = {
                                        "method": "serverUpdate",
                                        "status": "successful",
                                        "sender": "server",
                                        "reason": "newMember",
                                        "update": `${clients[recievedMessage.clientId].name} joined the Room`
                                    }
                                    clients[`${ele}`].connection.send(JSON.stringify(payload));
                                }
                            })

                            
                        }



                    }


                    break;
                case 'chat':
                    if(gameRoom.hasOwnProperty(recievedMessage.gameId)){
                        gameRoom[recievedMessage.gameId].gameMembersId.forEach(ele =>{
                            let payload = {
                                "method":"chat",
                                "status": "successful",
                                "senderId":recievedMessage.clientId,
                                "senderName":clients[recievedMessage.clientId].name,
                                "senderMessage":recievedMessage.chatMessage,
                                "gameId":recievedMessage.gameId
                            }
                            clients[`${ele}`].connection.send(JSON.stringify(payload));
                        })
                    }
                    break;
            }
        }
    })



})




function S4() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}

// then to call it, plus stitch in '4' in the third group
const guid = () => (S4() + S4() + "-" + S4() + "-4" + S4().substr(0, 3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
