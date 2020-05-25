////////////////////////////////////////////////////////////////////////////
//                           IMPORTS AND MODULES                          //
////////////////////////////////////////////////////////////////////////////
var styleSheet = document.createElement("link");
styleSheet.rel = "stylesheet";
styleSheet.type = "text/css";
styleSheet.href = "styleSheet.css";
document.getElementsByTagName("HEAD")[0].appendChild(styleSheet);

////////////////////////////////////////////////////////////////////////////
//                             GLOBAL VARIABLES                           //
////////////////////////////////////////////////////////////////////////////
const TOTAL = 800;
const SCREEN_WIDTH = 500;
const SCREEN_HEIGHT = 880;

let imageBackground;
let imagePipe;
let imageBird = [];
let imageBase;
let spriteSheet;
let spriteData;

let birds = [];
let pipes = [];
let terrain = [];

let counter = 0;
let slider;
let neat;
let score = -1;
let humanPlayer = false;
let genomes = [];
let generation = 1;

////////////////////////////////////////////////////////////////////////////
//                               NEAT CONFIG                              //
////////////////////////////////////////////////////////////////////////////
let config = {
	model: [
		{nodeCount: 5, type: "input"},
		{nodeCount: 2, type: "output", activationfunc: activation.SOFTMAX}
	],
	mutationRate: 0.2,
	crossoverMethod: crossover.RANDOM,
	mutationMethod: mutate.RANDOM,
	populationSize: TOTAL
};

////////////////////////////////////////////////////////////////////////////
//                           CLASSES AND MODULES                          //
////////////////////////////////////////////////////////////////////////////
/*-----------------------------------BIRD---------------------------------*/
class Bird {
  constructor() {
      this.y = height / 2;
      this.x = 64;
      this.dead = false;
  
      this.gravity = 0.8
      this.lift = -14
      this.velocity = 0;
  
      this.score = 0;
  }

  show() {
      if (!this.dead)  image(imageBird[frameCount % imageBird.length], this.x, this.y, 34*2, 24*2)
  }

  jump() {
      if (!this.dead) {
          if (humanPlayer) this.velocity = this.lift;
          else {
              this.velocity += this.lift;
              setTimeout(function() {}, 1000)
          }
      }
  }

  closestP(pipes) {
      let closest = null;
      let closestD = Infinity;
      for (let i = 0; i < pipes.length; i++) {
          let d = (pipes[i].x + pipes[i].w) - this.x;
          if (d < closestD && d > 0) {
              closest = pipes[i];
              closestD = d;
          }
      }
      return closest;
  }
  
  inputss(pipes) {
      let inputs = [];
      let closest = this.closestP(pipes);
      inputs[0] = map(closest.x, this.x, width, 0, 1);
      // top of closest pipe opening
      inputs[1] = map(closest.top, 0, height, 0, 1);
      // bottom of closest pipe opening
      inputs[2] = map(closest.bottom, 0, height, 0, 1);
      // bird's y position
      inputs[3] = map(this.y, 0, height, 0, 1);
      // bird's y velocity
      inputs[4] = map(this.velocity, -5, 5, 0, 1);
      return inputs;
  }

  offScreen() {
      return (this.y > height || this.y < 0);
  }

  update() {
      this.score++;
      this.velocity += this.gravity;
      this.y += this.velocity;

      if (humanPlayer) {
          this.gravity = 0.6;
          this.lift = -10;
      } else {
          this.gravity = 0.8;
          this.lift = -14;
      }
  }
}

/*----------------------------------PIPE---------------------------------*/
class Pipe {
  constructor() {
      this.w = 54*2;
      this.x = width;

      this.height = random(50, 450)
      this.top = this.height - 320*2
      this.bottom = this.height + 200
  }

  collision(bird) {
      if (collideRectCircle(this.x, this.top, 54*2, 320*2, bird.x + 34, bird.y + 24, 23*2) || collideRectCircle(this.x, this.bottom, 54*2, 320*2, bird.x + 34, bird.y + 24, 23*2) || collideRectCircle(0, 512+112*2, SCREEN_WIDTH, 512+112*2, bird.x + 34, bird.y + 24, 32*2)) return true;
      else return false
  }

  show() {
      image(imagePipe, this.x, this.top, 54*2, 320*2)
      image(imagePipe, this.x, this.bottom, 54*2, 320*2)
  }

  update() {
      this.x -= 5;
  }

  offscreen() {
      if (this.x < -this.w) return true;
      else return false;
  }
}

/*-----------------------------TERRAIN--------------------------------*/
class Base {
  constructor() {
      this.vel = 5
      this.w = 336*2
      this.x1 = 0
      this.x2 = 0 + this.w
  }

  show() {
      image(imageBase, this.x1, 512+112*2, 336*2, 112*2);
      image(imageBase, this.x2, 512+112*2, 336*2, 112*2);
  }

  update() {
      this.x1 -= this.vel;
      this.x2 -= this.vel;
      if (this.x1 + this.w < 0) this.x1 = this.x2 + this.w;
      if (this.x2 + this.w < 0) this.x2 = this.x1 + this.w;
  }
}

class Background {
  constructor() {
    this.vel = 2;
    this.x1 = 0;
    this.x2 = 0 + SCREEN_WIDTH;
  }

  show() {
    image(imageBackground, this.x1, -20, SCREEN_WIDTH, SCREEN_HEIGHT + 20);
    image(imageBackground, this.x2, -20, SCREEN_WIDTH, SCREEN_HEIGHT + 20);
  }

  update() {
    this.x1 -= this.vel;
    this.x2 -= this.vel;
    if (this.x1 + SCREEN_WIDTH < 0) this.x1 = this.x2 + SCREEN_WIDTH;
    if (this.x2 + SCREEN_WIDTH < 0) this.x2 = this.x1 + SCREEN_WIDTH;
  }
}


////////////////////////////////////////////////////////////////////////////
//                              MAIN FUNCTIONS                            //
////////////////////////////////////////////////////////////////////////////
/*-------------------------------PRELOAD----------------------------------*/
function preload() {
  spriteSheet = loadImage("imgs/spriteSheet.png");
  spriteData = loadJSON("spriteData.json");
}

/*--------------------------------SETUP-----------------------------------*/
function setup() {
  document.addEventListener('contextmenu', event => event.preventDefault());
  slider = createSlider(1, 10000, 1);
  createCanvas(SCREEN_WIDTH, SCREEN_HEIGHT);
  for (let i = 0; i < 3; i++) {
    let position = spriteData.frames[i].position;
    let image = spriteSheet.get(position.x, position.y, position.width, position.height);
    imageBird.push(image);
  }
  let frames = spriteData.frames
  imageBase = spriteSheet.get(frames[4].position.x, frames[4].position.y, frames[4].position.width, frames[4].position.height);
  imagePipe = spriteSheet.get(frames[5].position.x, frames[5].position.y, frames[5].position.width, frames[5].position.height);
  imageBackground = spriteSheet.get(frames[3].position.x, frames[3].position.y, frames[3].position.width, frames[3].position.height);
  for (let i = 0; i < TOTAL; i++) {
    birds[i] = new Bird();
  }
  neat = new NEAT(config);
  terrain.push(new Base());
  terrain.push(new Background());
}

/*--------------------------------INPUT---------------------------------*/
function keyPressed() {
  if (keyCode === 80) humanPlayer = !humanPlayer;
  if (humanPlayer) for (let bird of birds) if (keyCode === 67 || keyCode === 38 || keyCode === 32) bird.jump();
}

function touchStarted() {
  if (mouseX >= 320 && mouseY <= 50 && mouseY >= 0 && mouseX <= 500) humanPlayer = !humanPlayer;
  else if (humanPlayer) for (let bird of birds) bird.jump();
}
function touchEnded() {
  return false;
}

/*----------------------------DRAW FUNCTION----------------------------*/
function draw() {
  drawAdjustments()
  for (let n = 0; n < slider.value() / 1000; n++) {
    if (counter % 75 == 0) {
      pipes.push(new Pipe());
      score++;
    }
    counter++;

    terrain[0].update();
    terrain[1].update();

    for (let i = pipes.length - 1; i >= 0; i--) {
      pipes[i].update();

      for (let j = birds.length - 1; j >= 0; j--) {
        if (pipes[i].collision(birds[j])) {
          birds[j].dead = true;
        }
      }

      if (pipes[i].offscreen()) {
        pipes.splice(i, 1);
      }
    }

    for (let i = birds.length - 1; i >= 0; i--) {
      if (birds[i].offScreen()) {
        birds[i].dead = true;
      }
    }

    for (let bird of birds) {
      if (!bird.dead) bird.update();
    }

    for (let i = 0; i < TOTAL; i++) {
      neat.setInputs(birds[i].inputss(pipes), i);
    }

    neat.feedForward();

	let desicions = neat.getDesicions();
    for (let i = 0; i < TOTAL; i++) {
      if (desicions[i] === 1) {
        if (!humanPlayer) birds[i].jump();
      }
    }

    let finish = true;
    for (let z = 0; z < birds.length; z++) {
      if (!birds[z].dead) {
        finish = false;
        break;
      }
    }
    if (finish) {
      counter = 0;
      score = -1;
      pipes = [];
      if (!humanPlayer) {
        generation += 1;
        for (let i = 0; i < TOTAL; i++) {
          neat.setFitness(birds[i].score, i);
          birds[i] = new Bird();
        }
      } else {
        for (let i = 0; i < 1; i++) {
          neat.setFitness(birds[i].score, i);
          birds[i] = new Bird();
        }
      }
      neat.doGen();
    }
  }

  terrain[1].show();
  for (let bird of birds) bird.show();
  for (let pipe of pipes) pipe.show();
  terrain[0].show();

  if (!humanPlayer) {
    text("Generation: " + generation, 100 + generation.toString().length * 10, 35);
    text("AI Playing", SCREEN_WIDTH - 90, 35);
  } else text("humanPlayer", SCREEN_WIDTH - 115, 35);
  text(score, 250, 200);
}

function drawAdjustments() {
  if (mouseX >= 320 && mouseY <= 50 && mouseY >= 0) cursor("pointer");
  else cursor("default");
  noSmooth();
  textSize(35);
  fill(255);
  textAlign(CENTER)
}