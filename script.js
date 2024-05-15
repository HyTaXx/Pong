/**
 * Gère le dessin et la logique de base du jeu Pong.
 */
const canvas = document.getElementById("pongCanvas");
const ctx = canvas.getContext("2d");

/**
 * État global du jeu.
 * @type {boolean}
 */
let gameRunning = false;

/**
 * Hauteur et largeur de la raquette.
 * @type {number}
 */
let paddleHeight = 100;
let paddleWidth = 15;

/**
 * Position verticale des raquettes.
 * @type {number}
 */
let playerPaddleY = (canvas.height - paddleHeight) / 2;
let opponentPaddleY = (canvas.height - paddleHeight) / 2;

/**
 * Position et vitesse de la balle.
 * @type {number}
 */
let ballX = canvas.width / 2;
let ballY = canvas.height / 2;
let ballRadius = 10;
let dx = 2;
let dy = -2;

/**
 * Rôle du joueur (gauche ou droite).
 * @type {string|null}
 */
let playerRole = null;

/**
 * Scores des joueurs.
 * @type {number}
 */

let playerScore = 0;
let opponentScore = 0;

/**
 * Noms des joueurs.
 * @type {string}
 */

let playerName = "";
let opponentName = "";

/**
 * Dessine une raquette sur le canvas.
 * @param {number} x - La position horizontale de la raquette.
 * @param {number} y - La position verticale de la raquette.
 */

function drawPaddle(x, y) {
  ctx.fillStyle = "#fff";
  ctx.fillRect(x, y, paddleWidth, paddleHeight);
}

/**
 * Dessine la balle sur le canvas.
 * @param {number} x - La position horizontale de la balle.
 * @param {number} y - La position verticale de la balle.
 */
function drawBall(x, y) {
  ctx.beginPath();
  ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.closePath();
}

/**
 * Dessine tous les éléments du canva
 */
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

/**
 * Met à jour l'état du jeu.
 */
function update() {
  ballX += dx;
  ballY += dy;

  if (ballY + ballRadius > canvas.height || ballY - ballRadius < 0) {
    dy = -dy;
  }

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

  // Balle hors des limites
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

/**
 * Reset la position de la balle au scoring
 */
function resetBall() {
  ballX = canvas.width / 2;
  ballY = canvas.height / 2;
  dx = -dx;
}

/**
 * Boucle principale du jeu.
 */
function gameLoop() {
  if (!gameRunning) return;
  update();
  requestAnimationFrame(gameLoop);
}

/**
 * Document ready handler
 */
document.addEventListener("DOMContentLoaded", () => {
  const socket = io("http://localhost:3000");
  // const socket = io("https://pong-ehes.onrender.com");
  const nameInput = document.getElementById("nameInput");
  const roomInput = document.getElementById("roomInput");
  const joinButton = document.getElementById("joinButton");

  /**
   * Gère l'événement au clic du bouton "Join Game"
   */
  joinButton.addEventListener("click", () => {
    const name = nameInput.value;
    const room = roomInput.value;
    playerName = name;
    socket.emit("joinGame", { name, room });
  });

  /**
   * Socket connexion event listener
   */
  socket.on("connect", () => {
    console.log("Connecté au serveur");
  });

  /**
   * Socket déconnexion event listener
   */
  socket.on("disconnect", () => {
    console.log("Déconnecté du serveur");
  });

  /**
   * Socket lancement du jeu event listener
   */
  socket.on("gameStart", (names) => {
    playerName = names[0];
    opponentName = names[1];
    gameRunning = true;
    document.getElementById("exitButton").style.display = "block";
    document.getElementById("joinButton").style.display = "none";
    gameLoop();
  });

  /**
   * Socket déplacement de la raquette event listener
   */
  socket.on("paddleMove", (data) => {
    if (data.player === "left") {
      playerPaddleY = data.y;
    } else {
      opponentPaddleY = data.y;
    }
  });

  /**
   * Socket role du joueur event listener
   */
  socket.on("playerRole", (role) => {
    playerRole = role;
    if (playerRole === "left") {
      playerName = nameInput.value;
      socket.emit("playerName", playerName);
    } else {
      opponentName = nameInput.value;
      socket.emit("playerName", opponentName);
    }
  });

  /**
   * Socket position de la balle event listener
   */
  socket.on("ballPosition", (position) => {
    ballX = position.x;
    ballY = position.y;
  });

  /**
   * Socket déconnexion de l'adversaire event listener
   */
  socket.on("otherPlayerDisconnected", () => {
    console.log("other player disconnected");
    ctx.font = "30px Arial";
    ctx.fillStyle = "#fff";
    ctx.fillText(
      "L'autre joueur s'est déconnecté",
      canvas.width / 1.25,
      canvas.height / 2
    );

    gameRunning = false;
    playerScore = 0;
    opponentScore = 0;
    playerName = "";
    opponentName = "";
    gameRunning = false;

    document.getElementById("exitButton").style.display = "none";
    document.getElementById("joinButton").style.display = "block";
  });

  /**
   * Gestion de l'événement au déplacement de la souris sur le canva
   */
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

  /**
   * Gestion de l'événement au clic du bouton #exitButton
   */
  document.getElementById("exitButton").addEventListener("click", () => {
    console.log("disconnect");
    ctx.font = "30px Arial";

    ctx.fillText(
      "Vous vous êtes déconnecté",
      canvas.width / 1.25,
      canvas.height / 2
    );

    playerScore = 0;
    opponentScore = 0;
    playerName = "";
    opponentName = "";
    gameRunning = false;

    document.getElementById("exitButton").style.display = "none";
    document.getElementById("joinButton").style.display = "block";

    socket.emit("requestDisconnect");
  });
});

/**
 * Ends the game and displays the winner.
 * @param {string} winner - The name of the winning player.
 */
function endGame(winner) {
  alert(`${winner} remporte la partie !`);
  document.location.reload();
}
