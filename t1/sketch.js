// Original code taken from:
// https://p5js.org/examples/simulate-flocking.html

const salt = fxhash.split("")
const totalPts = salt.length * 12;
const steps = totalPts + 1;
let points = []
let flock;
let t = 0;
function setup() {
    createCanvas(window.innerWidth, window.innerHeight);
    noCursor();
    stroke(255);
    let k = 0
    let j = 0
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
        j++
    }
    flock = new Flock();
    // Add an initial set of boids into the system
    for (let i = 0; i < parseInt(points[0][0]); i++) {
        let b = new Boid(width / 2, height / 2);
        flock.addBoid(b);
    }
    fxpreview();
}

function draw() {
    background(0);
    for (let k in points) {
        point((width / steps) * k, points[k][0]);
        point((width / steps) * k, points[k][1]);
    }
    flock.run();
}

function derive(tmp) {
    var str = '';
    for (var i = 0; i < tmp.length; i++) {
        str += tmp[i].charCodeAt(0).toString(16);
    }
    return parseInt(str, 16);
}

function mouseDragged() {
    flock.addBoid(new Boid(mouseX, mouseY));
}

function Flock() {
    this.boids = [];
}

Flock.prototype.run = function () {
    for (let i = 0; i < this.boids.length; i++) {
        this.boids[i].run(this.boids);
    }
}

Flock.prototype.addBoid = function (b) {
    this.boids.push(b);
}

function Boid(x, y) {
    this.acceleration = createVector(0, 0);
    this.velocity = createVector(fxrand() * fxrand() * 5, fxrand() * fxrand() * 5);
    this.position = createVector(x, y);
    this.r = 3.0;
    this.maxspeed = 4;    // Maximum speed
    this.maxforce = 0.05; // Maximum steering force
}

Boid.prototype.run = function (boids) {
    this.flock(boids);
    this.update();
    this.borders();
    this.render();
}

Boid.prototype.applyForce = function (force) {
    this.acceleration.add(force);
}

Boid.prototype.flock = function (boids) {
    if (points[t] === undefined) {
        t = 0
    }
    let sep = this.separate(boids);
    let ali = this.align(boids);
    let coh = this.cohesion(boids);
    sep.mult(points[t][0] / 25);
    ali.mult(1.0);
    coh.mult(0.1);
    this.applyForce(sep);
    this.applyForce(ali);
    this.applyForce(coh);
    t++
}

// Method to update location
Boid.prototype.update = function () {
    // Update velocity
    this.velocity.add(this.acceleration);
    // Limit speed
    this.velocity.limit(this.maxspeed);
    this.position.add(this.velocity);
    // Reset accelertion to 0 each cycle
    this.acceleration.mult(0);
}

// A method that calculates and applies a steering force towards a target
// STEER = DESIRED MINUS VELOCITY
Boid.prototype.seek = function (target) {
    let desired = p5.Vector.sub(target, this.position);  // A vector pointing from the location to the target
    // Normalize desired and scale to maximum speed
    desired.normalize();
    desired.mult(this.maxspeed);
    // Steering = Desired minus Velocity
    let steer = p5.Vector.sub(desired, this.velocity);
    steer.limit(this.maxforce);  // Limit to maximum steering force
    return steer;
}

Boid.prototype.render = function () {
    // Draw a triangle rotated in the direction of velocity
    let theta = this.velocity.heading() + radians(90);
    fill(127);
    stroke(200);
    push();
    translate(this.position.x, this.position.y);
    rotate(theta);
    beginShape();
    vertex(0, -this.r * 2);
    vertex(-this.r, this.r * 2);
    vertex(this.r, this.r * 2);
    endShape(CLOSE);
    pop();
}

Boid.prototype.borders = function () {
    if (this.position.x < -this.r) this.position.x = width + this.r;
    if (this.position.y < -this.r) this.position.y = height + this.r;
    if (this.position.x > width + this.r) this.position.x = -this.r;
    if (this.position.y > height + this.r) this.position.y = -this.r;
}

Boid.prototype.separate = function (boids) {
    let desiredseparation = 25.0;
    let steer = createVector(0, 0);
    let count = 0;
    // For every boid in the system, check if it's too close
    for (let i = 0; i < boids.length; i++) {
        let d = p5.Vector.dist(this.position, boids[i].position);
        // If the distance is greater than 0 and less than an arbitrary amount (0 when you are yourself)
        if ((d > 0) && (d < desiredseparation)) {
            // Calculate vector pointing away from neighbor
            let diff = p5.Vector.sub(this.position, boids[i].position);
            diff.normalize();
            diff.div(d);        // Weight by distance
            steer.add(diff);
            count++;            // Keep track of how many
        }
    }
    // Average -- divide by how many
    if (count > 0) {
        steer.div(count);
    }

    // As long as the vector is greater than 0
    if (steer.mag() > 0) {
        // Implement Reynolds: Steering = Desired - Velocity
        steer.normalize();
        steer.mult(this.maxspeed);
        steer.sub(this.velocity);
        steer.limit(this.maxforce);
    }
    return steer;
}

Boid.prototype.align = function (boids) {
    let neighbordist = 50;
    let sum = createVector(0, 0);
    let count = 0;
    for (let i = 0; i < boids.length; i++) {
        let d = p5.Vector.dist(this.position, boids[i].position);
        if ((d > 0) && (d < neighbordist)) {
            sum.add(boids[i].velocity);
            count++;
        }
    }
    if (count > 0) {
        sum.div(count);
        sum.normalize();
        sum.mult(this.maxspeed);
        let steer = p5.Vector.sub(sum, this.velocity);
        steer.limit(this.maxforce);
        return steer;
    } else {
        return createVector(0, 0);
    }
}

Boid.prototype.cohesion = function (boids) {
    let neighbordist = 50;
    let sum = createVector(0, 0);   // Start with empty vector to accumulate all locations
    let count = 0;
    for (let i = 0; i < boids.length; i++) {
        let d = p5.Vector.dist(this.position, boids[i].position);
        if ((d > 0) && (d < neighbordist)) {
            sum.add(boids[i].position); // Add location
            count++;
        }
    }
    if (count > 0) {
        sum.div(count);
        return this.seek(sum);  // Steer towards the location
    } else {
        return createVector(0, 0);
    }
}