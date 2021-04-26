let intervalID = null;
class canvas
{
    constructor (container, sendFunction)
    {
        this.setup = false;
        this.canvas = document.createElement("canvas");
        this.canvas.width = container.offsetWidth;
        this.canvas.height = container.offsetWidth;
        container.insertBefore(this.canvas, document.getElementById('palette'));

        this.ctx = this.canvas.getContext("2d");

        this.virtualCanvas = document.createElement("canvas");
        this.virtualCanvas.width = 700;
        this.virtualCanvas.height = 700;
        this.virtualCtx = this.virtualCanvas.getContext("2d");
        this.drawing = false;

        this.prev = { x: 0, y: 0 };
        this.curr = { x: 0, y: 0 };

        this.send = sendFunction;

        this.color = 'blue';
        this.lineWidth = document.getElementById("brushSize").value;

        
        // This array stores lines that need to be send to other clients
        this.outgoingLines = [];

        // Queues of incoming changes as well as changes made by this user.
        // Because there can only be 1 line drawn at a time we need to alternate when incoming requests and ownlines need to be drawn
        this.incomingLines = [];
        this.ownlines = [];
        this.selectOwn = true;
        // EVENTS
        // -------------------------------------
        // Touch events


        // https://stackoverflow.com/questions/10000083/javascript-event-handler-with-parameters
        this.canvas.addEventListener("touchstart", (e) => ((c) => {
            let rect = c.canvas.getBoundingClientRect();
            c.prev.x = e.touches[0].clientX - rect.left;
            c.prev.y = e.touches[0].clientY - rect.top;
            intervalID = setInterval(() => {
                this.send(this.outgoingLines);
                this.outgoingLines = [];
            }, 1000);

        })(this), false);

        this.canvas.addEventListener("touchmove", (e) => ((c) => {
            e.preventDefault();
            let rect = c.canvas.getBoundingClientRect();
            c.curr.x = e.touches[0].clientX - rect.left;
            c.curr.y = e.touches[0].clientY - rect.top;
            c.ownlines.push({prev:{x:parseInt(c.prev.x), y:parseInt(c.prev.y)}, curr:{x:parseInt(c.curr.x), y:parseInt(c.curr.y)}, color:c.color, lineWidth: Math.ceil(c.lineWidth)});
            let scalingFactor = 700 / c.canvas.width
            c.outgoingLines.push({prev:{x:parseInt(c.prev.x * scalingFactor), y:parseInt(c.prev.y * scalingFactor)}, curr:{x:parseInt(c.curr.x * scalingFactor), y:parseInt(c.curr.y * scalingFactor)}, color:c.color, lineWidth: Math.ceil(c.lineWidth * scalingFactor)});
            c.prev.x = c.curr.x;
            c.prev.y = c.curr.y;
            c.draw();            
        })(this), false);

        document.addEventListener("touchend", (e) => ((c) => {
            clearInterval(intervalID);
            this.send(this.outgoingLines);
            this.outgoingLines = [];
        })(this), false);

        // Mouse events
        this.canvas.addEventListener("mousedown", (e) => ((c) => {
            c.drawing = true;
            intervalID = setInterval(() => { 
                this.send(this.outgoingLines);
                this.outgoingLines = [];
            }, 1000);

            let rect = c.canvas.getBoundingClientRect();
            c.prev.x = e.clientX - rect.left;
            c.prev.y = e.clientY - rect.top;

        })(this), false);

        this.canvas.addEventListener("mousemove", (e) => ((c) => {

            if (this.drawing)
            {
                let rect = c.canvas.getBoundingClientRect();
                c.curr.x = e.clientX - rect.left;
                c.curr.y = e.clientY - rect.top;
                c.ownlines.push({prev:{x:parseInt(c.prev.x), y:parseInt(c.prev.y)}, curr:{x:parseInt(c.curr.x), y:parseInt(c.curr.y)}, color:c.color, lineWidth: Math.ceil(c.lineWidth)});
                let scalingFactor = 700 / c.canvas.width
                c.outgoingLines.push({prev:{x:parseInt(c.prev.x * scalingFactor), y:parseInt(c.prev.y * scalingFactor)}, curr:{x:parseInt(c.curr.x * scalingFactor), y:parseInt(c.curr.y * scalingFactor)}, color:c.color, lineWidth: Math.ceil(c.lineWidth * scalingFactor)});

                c.prev.x = c.curr.x;
                c.prev.y = c.curr.y;
                this.draw();
            }           
        })(this), false);

        document.addEventListener("mouseup", (e) => ((c) => {
            c.drawing = false;
            clearInterval(intervalID);
            this.send(this.outgoingLines);
            this.outgoingLines = [];
        })(this), false);


        // window resize event
        
        window.addEventListener("resize", (e) => ((c) => {
            // change canvas size
            c.canvas.width = container.offsetWidth;
            c.canvas.height = container.offsetWidth;
    
            c.ctx.drawImage(c.virtualCanvas, 0, 0, c.canvas.width, c.canvas.width);

        })(this), false);
    }

    changeColor (color)
    {
        document.getElementsByClassName(this.color)[0].classList.remove("active");
        this.color = color;
        document.getElementsByClassName(color)[0].classList.add("active");
    }
    
    // draws lines from incomingList
    drawIncoming (line)
    {
        this.virtualCtx.beginPath();
        this.virtualCtx.strokeStyle = line.color;
        this.virtualCtx.lineWidth = line.lineWidth;
        this.virtualCtx.lineCap = "round";
        this.virtualCtx.moveTo(line.prev.x, line.prev.y);
        this.virtualCtx.lineTo(line.curr.x, line.curr.y);
        this.virtualCtx.stroke();
        
        this.ctx.scale(this.canvas.width / 700, this.canvas.width / 700);
        this.ctx.beginPath();
        this.ctx.strokeStyle = line.color;
        this.ctx.lineWidth = line.lineWidth;
        this.ctx.lineCap = "round";
        this.ctx.moveTo(line.prev.x, line.prev.y);
        this.ctx.lineTo(line.curr.x, line.curr.y);
        this.ctx.stroke();

        // reset the scaling to 1
        this.ctx.scale(700 / this.canvas.width, 700 / this.canvas.width);
    }

    drawOwn (line)
    {   
        this.ctx.beginPath();
        this.ctx.strokeStyle = line.color;
        this.ctx.lineWidth = line.lineWidth;
        this.ctx.lineCap = "round";
        this.ctx.moveTo(line.prev.x, line.prev.y);
        this.ctx.lineTo(line.curr.x, line.curr.y);
        this.ctx.stroke();

        this.virtualCtx.scale(700 / this.canvas.width, 700 / this.canvas.width);
        this.virtualCtx.beginPath();
        this.virtualCtx.strokeStyle = line.color;
        this.virtualCtx.lineWidth = line.lineWidth;
        this.virtualCtx.lineCap = "round";
        this.virtualCtx.moveTo(line.prev.x, line.prev.y);
        this.virtualCtx.lineTo(line.curr.x, line.curr.y);
        this.virtualCtx.stroke();
        // reset the scaling to 1
        this.virtualCtx.scale(this.canvas.width / 700, this.canvas.width/700);
    }

    // alternates between the two draws
    draw ()
    {
        if (this.ownlines.length == 0)
        {
            this.drawIncoming(this.incomingLines.shift());
        }

        else if (this.incomingLines == 0)
        {
            this.drawOwn(this.ownlines.shift());
        }

        else 
        {
            if (this.selectOwn)
            {
                this.selectOwn = false
                this.drawOwn(this.ownlines.shift());
            }
            else
            {
                this.selectOwn = true;
                this.drawIncoming(this.incomingLines.shift());
            }
        }
    }
}

export default canvas;