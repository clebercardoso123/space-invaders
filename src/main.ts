import './style.css'

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d')!;
const app = document.querySelector<HTMLDivElement>('#app')!;

// Game constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PLAYER_SPEED = 5;
const BULLET_SPEED = 7;
const INVADER_SPEED = 1;
const INVADER_ROWS = 5;
const INVADER_COLS = 10;

// Game state
let score = 0;
let gameOver = false;
let gameStarted = false;

// Player
const player = {
  x: CANVAS_WIDTH / 2 - 25,
  y: CANVAS_HEIGHT - 50,
  width: 50,
  height: 30,
  speed: PLAYER_SPEED,
  color: '#0f0'
};

// Bullets
const bullets: { x: number; y: number; width: number; height: number }[] = [];

// Invaders
const invaders: { x: number; y: number; width: number; height: number; alive: boolean }[] = [];
let invaderDirection = 1;
let invaderDropDistance = 0;

// Input state
const keys: { [key: string]: boolean } = {};

// Initialize game
function init() {
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  canvas.style.border = '2px solid #fff';
  app.innerHTML = '';
  app.appendChild(canvas);

  // Create invaders
  createInvaders();

  // Event listeners
  document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    // Handle space bar for starting/restarting game
    if (e.key === ' ') {
      if (!gameStarted) {
        startGame();
      } else if (gameOver) {
        restartGame();
      }
    }
  });

  document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
  });

  // Start game loop
  gameLoop();
}

function createInvaders() {
  invaders.length = 0;
  for (let row = 0; row < INVADER_ROWS; row++) {
    for (let col = 0; col < INVADER_COLS; col++) {
      invaders.push({
        x: col * 60 + 50,
        y: row * 50 + 50,
        width: 40,
        height: 30,
        alive: true
      });
    }
  }
}

function startGame() {
  gameStarted = true;
  gameOver = false;
  score = 0;
  resetGame();
}

function restartGame() {
  gameOver = false;
  score = 0;
  resetGame();
}

function resetGame() {
  // Reset player
  player.x = CANVAS_WIDTH / 2 - 25;
  
  // Clear bullets
  bullets.length = 0;
  
  // Reset invaders
  createInvaders();
  
  invaderDirection = 1;
  invaderDropDistance = 0;
}

function gameLoop() {
  if (!gameOver && gameStarted) {
    update();
  }
  draw();
  requestAnimationFrame(gameLoop);
}

function update() {
  // Player movement
  if (keys['ArrowLeft'] && player.x > 0) {
    player.x -= player.speed;
  }
  if (keys['ArrowRight'] && player.x < CANVAS_WIDTH - player.width) {
    player.x += player.speed;
  }

  // Shooting (only if game is active)
  if (keys[' '] && bullets.length < 3 && !gameOver) {
    bullets.push({
      x: player.x + player.width / 2 - 2,
      y: player.y,
      width: 4,
      height: 10
    });
    keys[' '] = false; // Prevent continuous shooting
  }

  // Update bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].y -= BULLET_SPEED;
    
    // Remove bullets that go off screen
    if (bullets[i].y < 0) {
      bullets.splice(i, 1);
      continue;
    }
    
    // Check bullet-invader collisions
    for (let j = 0; j < invaders.length; j++) {
      if (invaders[j].alive && checkCollision(bullets[i], invaders[j])) {
        invaders[j].alive = false;
        bullets.splice(i, 1);
        score += 10;
        break;
      }
    }
  }

  // Update invaders
  let allDead = true;
  let moveDown = false;
  
  // Check if any invaders hit the edge
  for (const invader of invaders) {
    if (invader.alive) {
      allDead = false;
      if ((invaderDirection === 1 && invader.x + invader.width >= CANVAS_WIDTH) ||
          (invaderDirection === -1 && invader.x <= 0)) {
        moveDown = true;
        break;
      }
    }
  }

  if (moveDown) {
    invaderDirection *= -1;
    invaderDropDistance += 20;
    
    // Move all invaders down
    for (const invader of invaders) {
      if (invader.alive) {
        invader.y += 20;
      }
    }
  } else {
    // Move invaders horizontally
    for (const invader of invaders) {
      if (invader.alive) {
        invader.x += INVADER_SPEED * invaderDirection;
      }
    }
  }

  // Check if invaders reached the bottom
  for (const invader of invaders) {
    if (invader.alive && invader.y + invader.height >= player.y) {
      gameOver = true;
      break;
    }
  }

  // Check win condition
  if (allDead) {
    gameOver = true;
  }
}

function draw() {
  // Clear canvas
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  if (!gameStarted) {
    // Start screen
    ctx.fillStyle = '#fff';
    ctx.font = '36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SPACE INVADERS', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
    ctx.font = '24px Arial';
    ctx.fillText('Press SPACE to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    ctx.fillText('Use ARROW KEYS to move, SPACE to shoot', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
    return;
  }

  // Draw player
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);
  
  // Draw player cannon
  ctx.fillRect(player.x + player.width / 2 - 5, player.y - 10, 10, 10);

  // Draw bullets
  ctx.fillStyle = '#ff0';
  for (const bullet of bullets) {
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  }

  // Draw invaders
  for (const invader of invaders) {
    if (invader.alive) {
      ctx.fillStyle = '#f00';
      ctx.fillRect(invader.x, invader.y, invader.width, invader.height);
      
      // Draw invader details
      ctx.fillStyle = '#000';
      ctx.fillRect(invader.x + 5, invader.y + 5, 8, 8);
      ctx.fillRect(invader.x + invader.width - 13, invader.y + 5, 8, 8);
      ctx.fillRect(invader.x + 15, invader.y + 15, 10, 5);
    }
  }

  // Draw score
  ctx.fillStyle = '#fff';
  ctx.font = '20px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${score}`, 10, 30);

  // Draw game over
  if (gameOver) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    ctx.fillStyle = '#fff';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    
    const allDead = invaders.every(invader => !invader.alive);
    if (allDead) {
      ctx.fillText('YOU WIN!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
    } else {
      ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
    }
    
    ctx.font = '24px Arial';
    ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    ctx.fillText('Press SPACE to play again', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
  }
}

function checkCollision(rect1: { x: number; y: number; width: number; height: number }, 
                       rect2: { x: number; y: number; width: number; height: number }): boolean {
  return rect1.x < rect2.x + rect2.width &&
         rect1.x + rect1.width > rect2.x &&
         rect1.y < rect2.y + rect2.height &&
         rect1.y + rect1.height > rect2.y;
}

// Start the game
init();
