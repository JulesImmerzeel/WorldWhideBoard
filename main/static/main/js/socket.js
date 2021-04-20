class socket
{
    constructor (canvas)
    {
        this.socket = new WebSocket(`ws://${window.location.host}`);
        this.canvas = canvas;
        this.currOnline = null;

        
        this.socket.onmessage = (e) => ((s) => {
            const data = JSON.parse(e.data);
            this.currOnline = data.currOnline;
            document.getElementById("counter").innerText = `Currently online: ${this.currOnline}`
            // If it's not the entire canvas being send
            switch (data.type)
            {
                case 'lines':
                    let lines = data.lines
                    for(let i = 0; i < lines.length; i++)
                    {
                        s.canvas.incomingLines.push({prev:lines[i].prev, curr:lines[i].curr, color:data.color, lineWidth:data.lineWidth})
                    }
                    while (s.canvas.incomingLines.length > 0) {
                        s.canvas.draw();
                    }

                // If someone just left need to send canvas incase current client also leave
                case 'counter':
                    if (this.currOnline == 1)
                    {
                        this.send();
                    }

                case 'canvas':
                    let img =  new Image();
                    img.src = `data:image/png;base64,${data.centralCanvas}`;
                    img.onload = () => {
                        canvas.virtualCtx.drawImage(img, 0, 0, 700, 700)
                        canvas.ctx.drawImage(canvas.virtualCanvas, 0, 0, canvas.canvas.width, canvas.canvas.height)
                    };
                }
        })(this)

        this.socket.onclose = function(e) {
            console.error('socket closed unexpectedly');
        };
 
    }

    send()
    {
        // send lines
        if (this.currOnline > 1)
        {
            this.socket.send(JSON.stringify({lines: this.canvas.outgoingLines, color: this.canvas.color, lineWidth:this.canvas.lineWidth}));
            this.canvas.outgoingLines = [];
            console.log('sending lines');
        }
        // send canvas
        else
        {
            this.socket.send(this.canvas.virtualCanvas.toDataURL());
            console.log('sending canvas');
        }
    }
}

export default socket;