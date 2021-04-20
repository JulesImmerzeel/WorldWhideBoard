import socket from './socket.js';
import canvas from './canvas.js';

let container = document.querySelector('.container');

let c = new canvas(container);
let s = new socket(c);
c.socket = s;