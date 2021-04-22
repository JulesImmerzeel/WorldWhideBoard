// let peerConnections = null


class socket
{
    constructor()
    {
        this.socket = new WebSocket(`${window.location.protocol == "https:" ? "wss" : "ws"}://${window.location.host}`);
        this.socket.onmessage = e => this.messageHandler(e.data);
        this.socket.onopen = e => {
            console.log("Connected to webserver");
        }
    }

    async messageHandler(data)
    {
        data = JSON.parse(data);
        switch (data.type)
        {
            case "sendOffer":
                console.log("Offer send");
                const offer = await pc.createOffer();
                this.socket.send(JSON.stringify({type: 'sendOffer', sdp: offer}));
                break;
            case "offer":
                let answer = await pc.sendAnswer(data.sdp);
                this.socket.send(JSON.stringify({'type':'offer', 'anwser':JSON.stringify(answer)}))
                console.log("Answer send");
                break;
            case "answer":
                pc.setAnswer(data.answer);
                console.log('Answer received');
                break;
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
        const offer = await this.waitToCompleteIceGathering();
        return JSON.stringify(offer);
    }

    async sendAnswer (sdp)
    {
        this.pc.setRemoteDescription(JSON.parse(sdp));
        this.pc.createAnswer().then(a => this.pc.setLocalDescription(a));
        const answer = await this.waitToCompleteIceGathering();
        return answer;
    }

    setAnswer (sdp)
    {
        this.pc.setRemoteDescription(JSON.parse(sdp));
        console.log(sdp);
    }

    sendData (value)
    {
        this.dc.send(value)
        console.log('send')
    }
}

window.pc = new peerConnection();
let s = new socket();