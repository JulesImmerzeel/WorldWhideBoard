import canvas from "./canvas.js";

window.peerConnections = {};

class socket
{
    constructor()
    {
        this.socket = new WebSocket(`${window.location.protocol == "https:" ? "wss" : "ws"}://${window.location.host}`);
        this.socket.onmessage = e => this.messageHandler(e.data);
        this.socket.onopen = e => {
        }
    }

    async messageHandler(data)
    {
        data = JSON.parse(data);
        let channelName = data.sender_channel_name;
        switch (data.type)
        {
            case "sendOffer":
                peerConnections[channelName] = new peerConnection();
                const offer = await peerConnections[channelName].createOffer();
                this.socket.send(JSON.stringify({type: 'sendOffer', sdp: offer, 'sender_channel_name':channelName}));
                break;

            case "offer":
                peerConnections[channelName] = new peerConnection();
                let answer = await peerConnections[channelName].sendAnswer(data.sdp);
                this.socket.send(JSON.stringify({'type':'offer', 'sender_channel_name':channelName, 'anwser':JSON.stringify(answer)}))
                break;

            case "answer":
                peerConnections[channelName].setAnswer(data.answer);
        }
    }
}


class peerConnection
{
    constructor ()
    {
        this.pc = new RTCPeerConnection();
        
        this.pc.ondatachannel = e => {
            this.dc = e.channel;
            if (c.setup == false)
            {
                // Requesting full canvas once then only send lines
                this.dc.send(JSON.stringify({'type': 'canvasRequest'}));
                c.setup = true;
            }
            this.dc.onmessage = e => this.messageCallback(e.data);
        }

        this.pc.addEventListener("iceconnectionstatechange", (e) => ((pc) => {
            if(pc.pc.iceConnectionState == "disconnected") {
                delete peerConnections[Object.keys(peerConnections).find(key => peerConnections[key] === pc)];
                document.getElementById("counter").innerText = `Currently online: ${Object.keys(peerConnections).length}`;
            }
        })(this), false);

    }

    waitToCompleteIceGathering() {
        return new Promise(resolve => {
            this.pc.addEventListener('icegatheringstatechange', e => (e.target.iceGatheringState === 'complete') && resolve(this.pc.localDescription));
        });
    }

    async createOffer()
    {
        this.dc = this.pc.createDataChannel("channel");
        this.dc.onmessage = e => this.messageCallback(e.data);
        this.pc.createOffer().then( o => this.pc.setLocalDescription(o) )
        const offer = await this.waitToCompleteIceGathering();
        return JSON.stringify(offer);
    }

    async sendAnswer (sdp)
    {
        this.pc.setRemoteDescription(JSON.parse(sdp));
        this.pc.createAnswer().then(a => this.pc.setLocalDescription(a));
        const answer = await this.waitToCompleteIceGathering();
        document.getElementById("counter").innerText = `Currently online: ${Object.keys(peerConnections).length}`;
        return answer;
    }

    setAnswer (sdp)
    {
        this.pc.setRemoteDescription(JSON.parse(sdp));
        document.getElementById("counter").innerText = `Currently online: ${Object.keys(peerConnections).length}`;
    }

    messageCallback (data)
    {
        data = JSON.parse(data);

        switch (data.type)
        {
            case 'lines':
                c.incomingLines = c.incomingLines.concat(data.lines);

                while (c.incomingLines.length > 0)
                {
                    c.draw();
                }
                break;

            case 'canvasRequest':
                this.dc.send(JSON.stringify({'type': 'canvas', 'canvas': c.canvas.toDataURL()}));
                break;

            case 'canvas':
                let img =  new Image();
                img.src = data.canvas;
                img.onload = () => {
                    c.virtualCtx.drawImage(img, 0, 0, 700, 700)
                    c.ctx.drawImage(c.virtualCanvas, 0, 0, c.canvas.width, c.canvas.height)
                };
        }
    }

    sendCanvas ()
    {
        c.canvas
    }
}


function sendData (value)
{
    for (const connection in peerConnections)
    {
        peerConnections[connection].dc.send(JSON.stringify({"type": "lines", "lines":value}));
    }
    console.log('send');
}

let container = document.querySelector('.container');
let s = new socket();
window.c = new canvas(container, sendData);