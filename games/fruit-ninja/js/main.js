// GENERAL VARIABLES
var cnv;
var retryButton;
var score,
  points = 0;
var lives,
  x = 0;
var isPlay = false;
var retryPressed = false;
var gravity = 0.1;
var sword;
var fruit = [];
var fruitsList = [
  "apple",
  "banana",
  "peach",
  "strawberry",
  "watermelon",
  "boom",
];
var fruitsImgs = [],
  slicedFruitsImgs = [];
var livesImgs = [],
  livesImgs2 = [];
var boom, spliced, missed, over, start;

let canvasWidth;
let canvasHeight;
let highscoreButton;

function preload() {
  // LOAD SOUNDS
  boom = loadSound("sounds/boom.mp3");
  spliced = loadSound("sounds/splatter.mp3");
  missed = loadSound("sounds/missed.mp3");
  start = loadSound("sounds/start.mp3");
  over = loadSound("sounds/over.mp3");

  // LOAD IMAGES
  for (var i = 0; i < fruitsList.length - 1; i++) {
    slicedFruitsImgs[2 * i] = loadImage("images/" + fruitsList[i] + "-1.png");
    slicedFruitsImgs[2 * i + 1] = loadImage(
      "images/" + fruitsList[i] + "-2.png"
    );
  }
  for (var i = 0; i < fruitsList.length; i++) {
    fruitsImgs[i] = loadImage("images/" + fruitsList[i] + ".png");
  }
  for (var i = 0; i < 3; i++) {
    livesImgs[i] = loadImage("images/x" + (i + 1) + ".png");
  }
  for (var i = 0; i < 3; i++) {
    livesImgs2[i] = loadImage("images/xx" + (i + 1) + ".png");
  }
  bg = loadImage("images/background.jpg");
  foregroundImg = loadImage("images/home-mask.png");
  fruitLogo = loadImage("images/fruit.png");
  ninjaLogo = loadImage("images/ninja.png");
  scoreImg = loadImage("images/score.png");
  newGameImg = loadImage("images/new-game.png");
  fruitImg = loadImage("images/fruitMode.png");
  gameOverImg = loadImage("images/game-over.png");
}

function setup() {
  if (windowWidth > 800) {
    canvasWidth = 800;
    canvasHeight = 635;
  } else {
    let scaleWidth = windowWidth / (800 * 1.2);
    let scaleHeight = windowHeight / (635 * 1.02);

    canvasWidth = 800 * scaleWidth;
    canvasHeight = 635 * scaleHeight;
  }
  cnv = createCanvas(canvasWidth, canvasHeight);

  let highscoreButtonX =
    windowWidth < 800 ? canvasWidth * 0.5 : canvasWidth * 0.9;
  let highscoreButtonY = canvasHeight * 0.595;
  highscore = select("#highscores");
  highscore.position(highscoreButtonX, highscoreButtonY);
  retryButton = createButton("Retry");
  retryButton.position(highscoreButtonX, canvasHeight * 0.5492);
  retryButton.addClass("lightblue-button");
  retryButton.hide();
  retryButton.mousePressed(retryGame);
  document.getElementById("highscores").style.display = "none";

  sword = new Sword(color("#FFFFFF"));
  frameRate(60);
  score = 0;
  lives = 3;
}

function draw() {
  clear();
  background(bg);

  image(this.foregroundImg, 0, 0, canvasWidth, canvasHeight * 0.35);
  image(
    this.fruitLogo,
    canvasWidth * 0.05,
    canvasHeight * 0.03,
    canvasWidth * 0.44,
    canvasHeight * 0.172
  );
  image(
    this.ninjaLogo,
    canvasWidth * 0.525,
    canvasHeight * 0.08,
    canvasWidth * 0.3975,
    canvasHeight * 0.13
  );
  image(
    this.newGameImg,
    canvasWidth * 0.3875,
    canvasHeight * 0.565,
    canvasWidth * 0.15,
    canvasHeight * 0.142
  );
  image(
    this.fruitImg,
    canvasWidth * 0.434,
    canvasHeight * 0.605,
    canvasWidth * 0.06,
    canvasHeight * 0.06
  );

  cnv.mouseClicked(check);
  if (isPlay) {
    game();
    check();
  }
}

function check() {
  let mousePositionX = canvasWidth * 0.434;
  let mousePositionXDist = canvasWidth * 0.06 + mousePositionX;
  let mousePositionY = canvasHeight * 0.605;
  let mousePositionYDist = canvasHeight * 0.06 + mousePositionY;
  // Check for game start
  if (
    !isPlay &&
    mouseX >= mousePositionX &&
    mouseX < mousePositionXDist &&
    mouseY > mousePositionY &&
    mouseY < mousePositionYDist
  ) {
    start.play();
    isPlay = true;
  } else if (retryPressed) {
    retryPressed = false;
    document.getElementById("highscores").style.display = "none";
    game();
  }
}

function game() {
  clear();
  background(bg);
  if (mouseIsPressed) {
    // Draw sword
    sword.swipe(mouseX, mouseY);
  }
  if (frameCount % 2 === 0) {
    if (noise(frameCount) > 0.76) {
      fruit.push(randomFruit()); // Display new fruit
    }
  }
  points = 0;
  for (var i = fruit.length - 1; i >= 0; i--) {
    fruit[i].update();
    fruit[i].draw();
    if (!fruit[i].visible) {
      if (!fruit[i].sliced && fruit[i].name != "boom") {
        // Missed fruit
        image(this.livesImgs2[0], fruit[i].x, fruit[i].y - 120, 50, 50);
        missed.play();
        lives--;
        x++;
      }
      if (lives < 1) {
        // Check for lives
        gameOver();
      }
      fruit.splice(i, 1);
    } else {
      if (fruit[i].sliced && fruit[i].name == "boom") {
        // Check for bomb
        boom.play();
        gameOver();
      }
      if (sword.checkSlice(fruit[i]) && fruit[i].name != "boom") {
        // Sliced fruit
        spliced.play();
        points++;
        fruit[i].update();
        fruit[i].draw();
      }
    }
  }
  if (frameCount % 2 === 0) {
    sword.update();
  }
  sword.draw();
  score += points;
  drawScore();
  drawLives();
}

function drawLives() {
  image(
    this.livesImgs[0],
    width - 110,
    20,
    livesImgs[0].width,
    livesImgs[0].height
  );
  image(
    this.livesImgs[1],
    width - 88,
    20,
    livesImgs[1].width,
    livesImgs[1].height
  );
  image(
    this.livesImgs[2],
    width - 60,
    20,
    livesImgs[2].width,
    livesImgs[2].height
  );
  if (lives <= 2) {
    image(
      this.livesImgs2[0],
      width - 110,
      20,
      livesImgs2[0].width,
      livesImgs2[0].height
    );
  }
  if (lives <= 1) {
    image(
      this.livesImgs2[1],
      width - 88,
      20,
      livesImgs2[1].width,
      livesImgs2[1].height
    );
  }
  if (lives === 0) {
    image(
      this.livesImgs2[2],
      width - 60,
      20,
      livesImgs2[2].width,
      livesImgs2[2].height
    );
  }
}

function drawScore() {
  image(this.scoreImg, 10, 10, 40, 40);
  textAlign(LEFT);
  noStroke();
  fill(255, 147, 21);
  textSize(50);
  text(score, 50, 50);
}

function gameOver() {
  noLoop();
  over.play();
  clear();
  background(bg);
  image(
    this.gameOverImg,
    canvasWidth * 0.194,
    canvasHeight * 0.4094,
    canvasWidth * 0.6125,
    canvasHeight * 0.11
  );
  lives = 0;
  document.getElementById("highscores").style.display = "block";
  console.log("lost");

  retryButton.show();
  console.log(`Sending score to server: ${score}`);
  sendScoreToServer(score);
}

function sendScoreToServer(score) {
  console.log("Score:", score);

  // LocalStorage Logic
  let scores = JSON.parse(localStorage.getItem('fruitNinjaHighScores')) || [];
  let name = prompt("Game Over! Enter your name for the leaderboard:", "Ninja");
  if (!name) name = "Ninja";

  scores.push({ name: name, score: score });
  scores.sort((a, b) => b.score - a.score); // Sort descending
  scores = scores.slice(0, 10); // Keep top 10

  localStorage.setItem('fruitNinjaHighScores', JSON.stringify(scores));
}

function retryGame() {
  retryPressed = true;
  score = 0;
  lives = 3;
  x = 0;
  fruit = [];

  retryButton.hide();
  loop();
}
