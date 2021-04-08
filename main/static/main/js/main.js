let container = document.querySelector('.container');
let intervalID = null;


class canvas
{
    constructor(container)
    {
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

        this.socket = null;

        this.color = 'blue';
        this.lineWidth = document.getElementById("brushSize").value;

        this.resizing = false;

        // EVENTS
        // -------------------------------------
        // Touch events


        // https://stackoverflow.com/questions/10000083/javascript-event-handler-with-parameters
        this.canvas.addEventListener("touchstart", (e) => ((c) => {
            let rect = c.canvas.getBoundingClientRect();
            c.prev.x = e.touches[0].clientX - rect.left;
            c.prev.y = e.touches[0].clientY - rect.top;
            intervalID = setInterval(() => { this.socket.send() }, 1000);

        })(this), false);

        this.canvas.addEventListener("touchmove", (e) => ((c) => {
            e.preventDefault();
            let rect = c.canvas.getBoundingClientRect();
            c.curr.x = e.touches[0].clientX - rect.left;
            c.curr.y = e.touches[0].clientY - rect.top;

            c.draw();            
        })(this), false);

        document.addEventListener("touchend", (e) => ((c) => {
            clearInterval(intervalID);
            this.socket.send();
        })(this), false);

        // Mouse events
        this.canvas.addEventListener("mousedown", (e) => ((c) => {
            c.drawing = true;
            intervalID = setInterval(() => { this.socket.send() }, 1000);

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
    
                c.draw(); 
            }           
        })(this), false);

        document.addEventListener("mouseup", (e) => ((c) => {
            c.drawing = false;
            clearInterval(intervalID);
            this.socket.send();
        })(this), false);


        // window resize event
        
        window.addEventListener("resize", (e) => ((c) => {
            // change canvas size
            c.canvas.width = container.offsetWidth;
            c.canvas.height = container.offsetWidth;
    
            c.ctx.drawImage(c.virtualCanvas, 0, 0, c.canvas.width, c.canvas.width);

        })(this), false);
    }

    draw()
    {
        this.ctx.lineCap = "round";
        this.ctx.strokeStyle = this.color;
        this.ctx.lineWidth = this.lineWidth;
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.prev.x, this.prev.y);
        this.ctx.lineTo(this.curr.x, this.curr.y);
        this.ctx.stroke();


        // Virtual ctx
        this.virtualCtx.lineCap = "round";
        this.virtualCtx.strokeStyle = this.color;
        this.virtualCtx.lineWidth = this.lineWidth;

        // Set the scaling (for the difference in size between the virtual and actual canvas)
        this.virtualCtx.scale(700 / this.canvas.width, 700/this.canvas.width);

        this.virtualCtx.beginPath();
        this.virtualCtx.moveTo(this.prev.x, this.prev.y);
        this.virtualCtx.lineTo(this.curr.x, this.curr.y);
        this.virtualCtx.stroke();
        // reset the scaling to 1
        c.virtualCtx.scale(c.canvas.width / 700, c.canvas.width/700);

        // update coords
        this.prev.x = this.curr.x;
        this.prev.y = this.curr.y;
    }

    changeColor(color)
    {
        document.getElementsByClassName(this.color)[0].classList.remove("active");
        this.color = color;
        document.getElementsByClassName(color)[0].classList.add("active");
    }
}

class socket
{
    constructor (canvas)
    {
        this.socket = new WebSocket(`ws://${window.location.host}`);
        this.canvas = canvas;

        this.socket.onmessage = function (e) {
            const data = JSON.parse(e.data);
            let img =  new Image();
            img.src = `data:image/png;base64,${data.centralCanvas}`;
            img.onload = () => {
                canvas.virtualCtx.drawImage(img, 0, 0, 700, 700)
                canvas.ctx.drawImage(canvas.virtualCanvas, 0, 0, canvas.canvas.width, canvas.canvas.height)
            };
        }

        this.socket.onclose = function(e) {
            console.error('socket closed unexpectedly');
        };
 
    }

    send()
    {
        this.socket.send(this.canvas.virtualCanvas.toDataURL());
    }

}
let c = new canvas(container);
let s = new socket(c);
c.socket = s;