// Original code taken from:
// https://p5js.org/examples/simulate-flocking.html

let socket
const salt = fxhash.split("")
const totalPts = salt.length * 12;
const steps = totalPts + 1;
let points = []
let t = 0;
let contributions = []
let my_contributions = []
let canSend = true
let sent = false
let pattern = ["K", "S", "K", "K", "S", "K", "S", "S", "S", "S"]
let last = 0
let sounds = { "K": '', "S": '' }
let loaded = 0

function setup() {
    // Load sounds
    sounds['K'] = loadSound('sound/kick.mp3', function () {
        console.log("KICK_LOADED")
        loaded++
    });
    sounds['S'] = loadSound('sound/snare.mp3', function () {
        console.log("SNARE_LOADED")
        loaded++
    });
    // Create canvas
    createCanvas(window.innerWidth, window.innerHeight);
    noCursor();
    stroke(255);
    // Init socket
    socket = io.connect("https://socket.yomi.dance");
    socket.on('connect', function () {
        console.log("SOCKET_CONNECTED");
    });
    // Initial space points
    let k = 0
    for (let i = 1; i < steps; i++) {
        if (salt[k] === undefined) {
            k = 0
        }
        const b = salt[k]
        const n = derive(b)
        const y1 = height / 2 - n - fxrand() * height / 3
        const y2 = height / 2 + n + fxrand() * height / 3
        points.push([y1, y2])
        k++
    }
    // Listen for contribution
    socket.on('contribution', function (data) {
        if (loaded === 2) {
            contributions.push(data);
            background(255, 255, 255);
            if (pattern[last] === undefined) {
                last = 0
            }
            sounds[pattern[last]].play();
            last++
        }
    });
    // Throttle a bit the mouse
    setInterval(function () {
        canSend = !canSend
        sent = false
    }, 100);

}

function mousePressed() {
    if (canSend && !sent && loaded === 2) {
        sent = true
        if (socket !== undefined) {
            const contribution = { x: mouseX, y: mouseY }
            socket.emit("contribute", contribution);
        }
    }
}

function mouseMoved() {
    if (canSend && !sent && loaded === 2) {
        sent = true
        if (socket !== undefined) {
            const contribution = { x: mouseX, y: mouseY }
            socket.emit("contribute", contribution, (response) => {
                console.log(response);
            });
        }
    }
}

function draw() {
    background(0);
    // for (let k in points) {
    //     point((width / steps) * k, points[k][0]);
    //     point((width / steps) * k, points[k][1]);
    // }
    ellipse(mouseX, mouseY, 12, 12);
    for (let k in contributions) {
        point(contributions[k].x, contributions[k].y);
    }
}

function derive(tmp) {
    var str = '';
    for (var i = 0; i < tmp.length; i++) {
        str += tmp[i].charCodeAt(0).toString(16);
    }
    return parseInt(str, 16);
}
