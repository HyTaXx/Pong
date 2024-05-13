const canvas = document.getElementById("pongCanvas");
const ctx = canvas.getContext("2d");

let paddleHeight = 100;
let paddleWidth = 15;
let playerPaddleY = (canvas.height - paddleHeight) / 2;
let opponentPaddleY = (canvas.height - paddleHeight) / 2;
let ballX = canvas.width / 2;
let ballY = canvas.height / 2;
let ballRadius = 10;
let dx = 2;
let dy = -2;
let playerRole = null;
let playerScore = 0;
let opponentScore = 0;
let playerName = ""; // To store the player's name
let opponentName = ""; // To store the opponent's name

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

    drawPaddle(10, playerPaddleY);
    drawPaddle(canvas.width - 20, opponentPaddleY);

    drawBall(ballX, ballY);

    ctx.font = "30px Arial";
    ctx.textAlign = "left";
    ctx.fillText(`${playerName}: ${playerScore}`, 20, 50);
    ctx.textAlign = "right";
    ctx.fillText(`${opponentName}: ${opponentScore}`, canvas.width - 20, 50);
}

function update() {
    ballX += dx;
    ballY += dy;

    // Ball collision with top and bottom walls
    if (ballY + ballRadius > canvas.height || ballY - ballRadius < 0) {
        dy = -dy;
    }

    // Ball collision with paddles
    if (
        ballX - ballRadius <= paddleWidth &&
        ballY >= playerPaddleY &&
        ballY <= playerPaddleY + paddleHeight
    ) {
        dx = -dx;
    } else if (
        ballX + ballRadius >= canvas.width - paddleWidth &&
        ballY >= opponentPaddleY &&
        ballY <= opponentPaddleY + paddleHeight
    ) {
        dx = -dx;
    }

    // Ball out of bounds
    if (ballX + ballRadius > canvas.width) {
        playerScore++;
        if (playerScore === 5) {
            endGame(playerName);
        } else {
            resetBall();
        }
    } else if (ballX - ballRadius < 0) {
        opponentScore++;
        if (opponentScore === 5) {
            endGame(opponentName);
        } else {
            resetBall();
        }
    }

    draw();
}

function resetBall() {
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    dx = -dx; // Reverse direction
}

function gameLoop() {
    update();
    requestAnimationFrame(gameLoop);
}

document.addEventListener("DOMContentLoaded", () => {
    const socket = io("http://localhost:3000");
    const nameInput = document.getElementById("nameInput");
    const roomInput = document.getElementById("roomInput");
    const joinButton = document.getElementById("joinButton");

    joinButton.addEventListener("click", () => {
        const name = nameInput.value;
        const room = roomInput.value;
        playerName = name; // Store the player's name
        socket.emit("joinGame", { name, room });
    });

    socket.on("connect", () => {
        console.log("Connected to server");
    });

    socket.on("disconnect", () => {
        console.log("Disconnected from server");
    });

    socket.on("gameStart", (message) => {
        console.log(message);
        gameLoop();
    });

    socket.on("paddleMove", (data) => {
        if (data.player === "left") {
            playerPaddleY = data.y;
        } else {
            opponentPaddleY = data.y;
        }
    });

    socket.on("playerRole", (role) => {
        playerRole = role;
        if (playerRole === "left") {
            playerName = nameInput.value; // Update player's name
            socket.emit("playerName", playerName);
        } else {
            opponentName = nameInput.value; // Update opponent's name
            socket.emit("playerName", opponentName);
        }
    });

    socket.on("opponentName", (name) => {
        opponentName = name;
    });

    document.addEventListener("mousemove", (e) => {
        const mouseY = e.clientY - canvas.offsetTop - paddleHeight / 2;
        if (playerRole === "left") {
            if (mouseY < 0) {
                playerPaddleY = 0;
            } else if (mouseY > canvas.height - paddleHeight) {
                playerPaddleY = canvas.height - paddleHeight;
            } else {
                playerPaddleY = mouseY;
            }
            socket.emit("paddleMove", { y: mouseY, player: playerRole });
        } else if (playerRole === "right") {
            if (mouseY < 0) {
                opponentPaddleY = 0;
            } else if (mouseY > canvas.height - paddleHeight) {
                opponentPaddleY = canvas.height - paddleHeight;
            } else {
                opponentPaddleY = mouseY;
            }
            socket.emit("paddleMove", { y: mouseY, player: playerRole });
        }
    });
});

function endGame(winner) {
    alert(`${winner} wins the game!`);
    document.location.reload();
}
