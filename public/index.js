

const newGame = document.getElementById('newGame');
const joinGame = document.getElementById('joinGame');
const input = document.getElementById('input');
const inputSend = document.getElementById('sendInput');
const sendButton = document.getElementById('sendButton');
const messageArea = document.getElementById('messageArea');
const nameInput = document.getElementById('name');
const roomInput = document.getElementById('roomName');
const connect = document.getElementById('connect');
const div = document.getElementById('div')

let myId = null;
let ws = null;
let gameId = null;

connect.addEventListener('click', wsConnect);
newGame.addEventListener('click', createRoom);
joinGame.addEventListener('click', joinRoom);
sendButton.addEventListener("click", sendChat)

function wsConnect() {
    if (nameInput.value == 'type your name..' || nameInput.value == '') {
        alert('enter name first');
        return;
    };
    var host =  window.location.host;
    
    console.log(host);
    ws = new WebSocket("wss://" + host);

    ws.onopen = () => {
        let payload = {
            "method": 'newConnect',
            "name": nameInput.value,
            "clientId": myId
        }
        ws.send(JSON.stringify(payload))
        document.getElementById('WebsocketConnection').remove()
        div.style.display = '';

        ws.onmessage = (message) => {
            let recievedMessage = JSON.parse(message.data);
            if (recievedMessage.status === "successful") {
                switch (recievedMessage.method) {
                    case "newConnection":
                        myId = recievedMessage.yourId
                        break;
                    case "createRoom":
                        gameId = recievedMessage.gameId;
                        document.getElementById('gameId').innerHTML = `your Room id is => ${gameId}`
                        messageArea.innerHTML = `Created  Room &nbsp; &nbsp; &nbsp;===> &nbsp; &nbsp; &nbsp;${recievedMessage.gameName}`
                        break;
                    case "joinRoom":
                        gameId = recievedMessage.gameId;
                        document.getElementById("gameId").innerHTML = `you joined game => ${gameId}`;
                        messageArea.innerHTML = `Joined game &nbsp; &nbsp;===> &nbsp; &nbsp; &nbsp; ${recievedMessage.gameName}`;
                        document.getElementById('send').style.display = "";
                        break;
                    case "serverUpdate":
                        if (recievedMessage.reason === 'newMember') {
                            document.getElementById('send').style.display = "";
                        }
                        let ele = document.createElement('span');
                        ele.style.backgroundColor = "yellow";
                        ele.innerHTML = `${recievedMessage.sender}:&nbsp; &nbsp; &nbsp;${recievedMessage.update}`
                        messageArea.append(document.createElement('br'), document.createElement('br'), ele);
                        messageArea.scrollTop = messageArea.scrollHeight;
                        break;
                    case "chat":
                       let name = "you";
                       if(recievedMessage.senderId !== myId){
                           name = recievedMessage.senderName
                       }
                       let mess = document.createElement('span');
                        
                        mess.innerHTML = `${name}:&nbsp; &nbsp; &nbsp;${recievedMessage.senderMessage}`
                        messageArea.append(document.createElement('br'), document.createElement('br'), mess);
                        messageArea.scrollTop = messageArea.scrollHeight;
                        break;

                }

            }

        }

    }

}
function createRoom() {
    if (roomInput.value == 'enter Room Name..' || nameInput.value == '') {
        alert('enter room name first');
        return;
    };
    let payload = {
        "clientId": myId,
        "method": "createRoom",
        "name": roomInput.value
    }
    ws.send(JSON.stringify(payload));
    messageArea.innerHTML = " ";
    // document.getElementById('send').style.display = "";
    input.value = '';
}
function joinRoom() {
    if (input.value !== "" && input.value !== gameId) {
        let payl = {
            "clientId": myId,
            "method": "joinRoom",
            "gameId": input.value
        }
        ws.send(JSON.stringify(payl))
        messageArea.innerHTML = " ";
        // document.getElementById('send').style.display = "";
    }

}
function sendChat() {
    if (inputSend.value !== '' && !inputSend.value.match(/^\s+$/)) {

        let payload = {
            "method": "chat",
            "clientId": myId,
            "gameId": gameId,
            "chatMessage": inputSend.value
        }
        ws.send(JSON.stringify(payload))
        // inputSend.value = "";
    } else {
        alert('type some message to send :)) ')
    }
}


