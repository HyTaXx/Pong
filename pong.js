const canvas = document.getElementById("pongCanvas");
const ctx = canvas.getContext("2d");
const socket = io("http://localhost:3000");

let paddleHeight = 100;
let paddleWidth = 15;
let paddleY = (canvas.height - paddleHeight) / 2;
let ballX = canvas.width / 2;
let ballY = canvas.height / 2;
let ballRadius = 10;
let dx = 2;
let dy = -2;

function drawPaddle(x, y) {
    ctx.fillStyle = "#fff";
    ctx.fillRect(x, y, paddleWidth, paddleHeight);
}

function drawBall(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.closePath();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPaddle(10, paddleY);
    drawPaddle(canvas.width - 20, paddleY);
    drawBall(ballX, ballY);
}

function update() {
    ballX += dx;
    ballY += dy;

    if (ballY + ballRadius > canvas.height || ballY - ballRadius < 0) {
        dy = -dy;
    }

    if (ballX + ballRadius > canvas.width || ballX - ballRadius < 0) {
        dx = -dx;
    }

    if (
        ballX + ballRadius > canvas.width - 20 &&
        ballY > paddleY &&
        ballY < paddleY + paddleHeight
    ) {
        dx = -dx;
    }

    if (
        ballX - ballRadius < 20 &&
        ballY > paddleY &&
        ballY < paddleY + paddleHeight
    ) {
        dx = -dx;
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

socket.on("connect", () => {
    console.log("Connected to server");
});

// Wait for the game to start before starting the game loop
socket.on("gameStart", (message) => {
    console.log(message);
    gameLoop();
});

socket.on("paddleMove", (data) => {
    // Determine which paddle to move based on the player
    if (data.player === "left") {
        paddleY = data.y;
    } else if (data.player === "right") {
        // For the right paddle, we'll need to adjust the logic to control it separately
        // This requires additional logic to distinguish between the two paddles
    }
});

document.addEventListener("mousemove", (e) => {
    paddleY = e.clientY - canvas.offsetTop - paddleHeight / 2;
    if (paddleY < 0) paddleY = 0;
    if (paddleY > canvas.height - paddleHeight)
        paddleY = canvas.height - paddleHeight;
    socket.emit("paddleMove", { y: paddleY, player: "left" }); // Assuming this player controls the left paddle
});
