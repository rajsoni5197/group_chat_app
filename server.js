const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require("path");

const port = process.env.PORT || 3000;
const app = express();

const server = http.createServer(app);

app.use("/", (req, res, next) => {
    console.log('req');
    next();
});
app.use(express.static(path.join(__dirname, "public")));

// WebSocket server
const wss = new WebSocket.Server({ server });
console.log("Hi i am here ");
// Clients and game rooms
const clients = {};
const gameRoom = {};

wss.on('connection', (ws) => {
    console.log("New WebSocket connection");
    
    let clientId = guid();

    ws.on('message', (message) => {
        let receivedMessage = JSON.parse(message);
        
        if (receivedMessage.method === "newConnect" && !receivedMessage.clientId) {
            clients[clientId] = {
                "Id": clientId,
                "name": receivedMessage.name,
                'connection': ws
            };
            
            if (clients[clientId]) {
                let payload = {
                    "method": "newConnection",
                    "status": "successful",
                    "yourId": clients[clientId].Id
                };
                clients[clientId].connection.send(JSON.stringify(payload));
            }
        }
        else if (clients.hasOwnProperty(receivedMessage.clientId)) {
            switch (receivedMessage.method) {
                case 'createRoom':
                    let gameId = guid();
                    gameRoom[gameId] = {
                        "creator": receivedMessage.clientId,
                        "gameMembersId": [receivedMessage.clientId],
                        "name": receivedMessage.name
                    };

                    let payload = {
                        "method": "createRoom",
                        "status": "successful",
                        "gameId": gameId,
                        "gameName": gameRoom[gameId].name
                    };
                    clients[clientId].connection.send(JSON.stringify(payload));
                    break;
                case 'joinRoom':
                    if (gameRoom.hasOwnProperty(receivedMessage.gameId)) {
                        gameRoom[receivedMessage.gameId].gameMembersId.push(receivedMessage.clientId);
                        let status = gameRoom[receivedMessage.gameId].gameMembersId.includes(receivedMessage.clientId);
                        if (status) {
                            let payload = {
                                "method": "joinRoom",
                                "status": "successful",
                                "gameId": receivedMessage.gameId,
                                "gameName": gameRoom[receivedMessage.gameId].name
                            };
                            clients[receivedMessage.clientId].connection.send(JSON.stringify(payload));

                            gameRoom[receivedMessage.gameId].gameMembersId.forEach(ele => {
                                if (ele !== receivedMessage.clientId) {
                                    let payload = {
                                        "method": "serverUpdate",
                                        "status": "successful",
                                        "sender": "server",
                                        "reason": "newMember",
                                        "update": `${clients[receivedMessage.clientId].name} joined the Room`
                                    };
                                    clients[`${ele}`].connection.send(JSON.stringify(payload));
                                }
                            });
                        }
                    }
                    break;
                case 'chat':
                    if(gameRoom.hasOwnProperty(receivedMessage.gameId)){
                        gameRoom[receivedMessage.gameId].gameMembersId.forEach(ele => {
                            let payload = {
                                "method": "chat",
                                "status": "successful",
                                "senderId": receivedMessage.clientId,
                                "senderName": clients[receivedMessage.clientId].name,
                                "senderMessage": receivedMessage.chatMessage,
                                "gameId": receivedMessage.gameId
                            };
                            clients[`${ele}`].connection.send(JSON.stringify(payload));
                        });
                    }
                    break;
            }
        }
    });

    ws.on('close', () => {
        console.log('WebSocket was closed');
        // Handle disconnection
    });
});

server.listen(port, () => console.log(`Server listening on port ${port}`));

function S4() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}

const guid = () => (S4() + S4() + "-" + S4() + "-4" + S4().substr(0, 3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
