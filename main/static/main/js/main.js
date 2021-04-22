// let peerConnections = null


class socket
{
    constructor()
    {
        this.socket = new WebSocket(`${window.location.protocol == "https:" ? "wss" : "ws"}://${window.location.host}`);
        this.socket.onmessage = e => this.messageHandler(e.data);
        this.socket.onopen = e => {
            console.log("Connected to webserver");
            this.socket.send(JSON.stringify({'type':'p2p request'}))
        }
    }

    messageHandler(data)
    {
        data = JSON.parse(data);

        switch (data.type)
        {
            case "sendOffer":
                console.log("Offer send");
                this.socket.send(JSON.stringify(pc.createOffer()));
            case "offer":
                this.socket.send(JSON.stringify(pc.sendAnswer()));
                console.log("Answer end");
            case "answer":
                pc.setAnswer();
                console.log('Answer received');
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
            this.dc.onmessage = e => console.log(e.data);
            this.dc.onopen = e => console.log("Connection opened");
        }
        
       
    }

    waitToCompleteIceGathering() {
        return new Promise(resolve => {
            this.pc.addEventListener('icegatheringstatechange', e => (e.target.iceGatheringState === 'complete') && resolve(this.pc.localDescription));
        });
    }


    async createOffer()
    {
        this.dc = this.pc.createDataChannel("channel");
        this.dc.onmessage = e => console.log(e.data);
        this.dc.onopen = e => console.log("Connection opened");
        this.pc.createOffer().then( o => this.pc.setLocalDescription(o) )
        const offer = await this.waitToCompleteIceGathering()
        return offer;
    }

    async sendAnswer (sdp)
    {
        this.pc.setRemoteDescription(sdp);
        this.pc.createAnswer().then(a => this.pc.setLocalDescription(a));
        const answer = await this.waitToCompleteIceGathering();
        return answer;
    }

    setAnswer (sdp)
    {
        this.pc.setRemoteDescription(sdp)
    }

    sendData (value)
    {
        this.dc.send(value)
        console.log('send')
    }
}

let pc = new peerConnection();
let s = new socket();