/**
 * Nokia 3310 Snake II - Game Engine
 * Authentic Dot-Matrix Canvas Renderer, Game Loops, Nokia Logic & Controls
 */

class NokiaSnakeGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    // Display & Grid Parameters
    this.cols = 28;
    this.rows = 19;
    this.cellSize = 10; // 28 * 10 = 280, 19 * 10 = 190

    // Game States: 'TITLE', 'PLAYING', 'PAUSED', 'GAMEOVER'
    this.state = 'TITLE';

    // Settings
    this.mode = 'wraparound'; // 'classic', 'wraparound', 'labyrinth', 'box'
    this.speedLevel = 5; // 1 to 9
    this.bonusEnabled = true;

    // Game Variables
    this.snake = [];
    this.direction = { x: 1, y: 0 };
    this.nextDirection = { x: 1, y: 0 };
    this.food = null;
    this.bonus = null; // { x, y, timeLeft, maxTime, value }
    this.applesEaten = 0;
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('nokia_snake_highscore') || '0', 10);
    this.walls = [];

    // Timing & Loop
    this.lastTickTime = 0;
    this.animationFrameId = null;
    this.blinkTimer = 0;

    // LCD Colors (read dynamically from CSS custom properties)
    this.colors = {
      bg: '#c2cd9c',
      pixel: '#232c1b',
      ghost: '#b6c18f'
    };

    // Cache DOM Elements
    this.dom = {
      liveScore: document.getElementById('liveScore'),
      liveHighScore: document.getElementById('liveHighScore'),
      liveMode: document.getElementById('liveMode'),
      liveSpeed: document.getElementById('liveSpeed'),
      liveEaten: document.getElementById('liveEaten'),
      leftSoftLabel: document.getElementById('leftSoftLabel'),
      centerSoftLabel: document.getElementById('centerSoftLabel'),
      rightSoftLabel: document.getElementById('rightSoftLabel'),
      lcdGameModeText: document.getElementById('lcdGameModeText'),
      lcdSoundIndicator: document.getElementById('lcdSoundIndicator'),
      phoneBody: document.getElementById('phoneBody'),
      lcdScreen: document.getElementById('lcdScreen'),
      speedSlider: document.getElementById('speedSlider'),
      speedValLabel: document.getElementById('speedValLabel'),
      gameModeSelect: document.getElementById('gameModeSelect'),
      soundToggleCheckbox: document.getElementById('soundToggleCheckbox'),
      bonusInsectCheckbox: document.getElementById('bonusInsectCheckbox'),
      btnResetHighScore: document.getElementById('btnResetHighScore')
    };

    this.init();
  }

  init() {
    this.updateColors();
    this.setupEventListeners();
    this.updateSideStats();
    this.setSoftKeys('Start', 'Play', 'Exit');

    // Title screen setup
    this.resetGame();
    this.state = 'TITLE';

    // Start render loop
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  updateColors() {
    const style = getComputedStyle(this.dom.lcdScreen);
    this.colors.bg = style.getPropertyValue('--lcd-bg').trim() || '#c2cd9c';
    this.colors.pixel = style.getPropertyValue('--lcd-pixel').trim() || '#232c1b';
    this.colors.ghost = style.getPropertyValue('--lcd-ghost').trim() || '#b6c18f';
  }

  // Calculate speed delay in milliseconds (1 = 220ms, 9 = 55ms)
  getSpeedInterval() {
    return Math.max(50, 240 - (this.speedLevel * 20));
  }

  resetGame() {
    const startX = Math.floor(this.cols / 2);
    const startY = Math.floor(this.rows / 2);

    this.snake = [
      { x: startX, y: startY },
      { x: startX - 1, y: startY },
      { x: startX - 2, y: startY },
      { x: startX - 3, y: startY }
    ];

    this.direction = { x: 1, y: 0 };
    this.nextDirection = { x: 1, y: 0 };
    this.score = 0;
    this.applesEaten = 0;
    this.bonus = null;
    this.buildWalls();
    this.spawnFood();
    this.updateSideStats();
  }

  buildWalls() {
    this.walls = [];

    // Outer border for classic mode
    if (this.mode === 'classic') {
      for (let x = 0; x < this.cols; x++) {
        this.walls.push({ x, y: 0 });
        this.walls.push({ x, y: this.rows - 1 });
      }
      for (let y = 1; y < this.rows - 1; y++) {
        this.walls.push({ x: 0, y });
        this.walls.push({ x: this.cols - 1, y });
      }
    }
    // Labyrinth walls (authentic Nokia Snake II maze)
    else if (this.mode === 'labyrinth') {
      // Horizontal interior dividers with gaps
      for (let x = 4; x < this.cols - 4; x++) {
        if (x < 11 || x > 16) {
          this.walls.push({ x, y: 5 });
          this.walls.push({ x, y: this.rows - 6 });
        }
      }
      // Vertical posts
      for (let y = 8; y <= 10; y++) {
        this.walls.push({ x: 7, y });
        this.walls.push({ x: this.cols - 8, y });
      }
    }
    // Box mode: 4 corner blockades
    else if (this.mode === 'box') {
      const boxSize = 3;
      // Top Left
      for (let x = 3; x < 3 + boxSize; x++) {
        for (let y = 3; y < 3 + boxSize; y++) {
          this.walls.push({ x, y });
        }
      }
      // Top Right
      for (let x = this.cols - 6; x < this.cols - 3; x++) {
        for (let y = 3; y < 3 + boxSize; y++) {
          this.walls.push({ x, y });
        }
      }
      // Bottom Left
      for (let x = 3; x < 3 + boxSize; x++) {
        for (let y = this.rows - 6; y < this.rows - 3; y++) {
          this.walls.push({ x, y });
        }
      }
      // Bottom Right
      for (let x = this.cols - 6; x < this.cols - 3; x++) {
        for (let y = this.rows - 6; y < this.rows - 3; y++) {
          this.walls.push({ x, y });
        }
      }
    }
  }

  isOccupied(x, y) {
    if (this.snake.some(seg => seg.x === x && seg.y === y)) return true;
    if (this.walls.some(w => w.x === x && w.y === y)) return true;
    if (this.food && this.food.x === x && this.food.y === y) return true;
    if (this.bonus && this.bonus.x === x && this.bonus.y === y) return true;
    return false;
  }

  spawnFood() {
    let emptyCells = [];
    for (let x = 0; x < this.cols; x++) {
      for (let y = 0; y < this.rows; y++) {
        if (!this.isOccupied(x, y)) {
          emptyCells.push({ x, y });
        }
      }
    }

    if (emptyCells.length > 0) {
      const rand = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      this.food = { x: rand.x, y: rand.y };
    }
  }

  spawnBonus() {
    if (!this.bonusEnabled) return;
    let emptyCells = [];
    for (let x = 2; x < this.cols - 2; x++) {
      for (let y = 2; y < this.rows - 2; y++) {
        if (!this.isOccupied(x, y)) {
          emptyCells.push({ x, y });
        }
      }
    }

    if (emptyCells.length > 0) {
      const rand = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      this.bonus = {
        x: rand.x,
        y: rand.y,
        timeLeft: 40, // 40 game ticks
        maxTime: 40,
        value: 50
      };
      window.nokiaAudio.playBonusSpawn();
    }
  }

  startGame() {
    this.resetGame();
    this.state = 'PLAYING';
    this.setSoftKeys('Pause', 'Turn', 'Menu');
    window.nokiaAudio.playKeyClick();
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      this.setSoftKeys('Resume', 'Continue', 'Menu');
      window.nokiaAudio.playPause();
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.setSoftKeys('Pause', 'Turn', 'Menu');
      window.nokiaAudio.playPause();
    }
  }

  gameOver() {
    this.state = 'GAMEOVER';
    window.nokiaAudio.playDie();

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('nokia_snake_highscore', this.highScore.toString());
      setTimeout(() => window.nokiaAudio.playNokiaTune(), 400);
    }

    this.updateSideStats();
    this.setSoftKeys('Restart', 'Play', 'Menu');
  }

  setSoftKeys(left, center, right) {
    this.dom.leftSoftLabel.textContent = left;
    this.dom.centerSoftLabel.textContent = center;
    this.dom.rightSoftLabel.textContent = right;
  }

  changeDirection(dir) {
    // Prevent immediate 180 reverse
    if (this.direction.x + dir.x === 0 && this.direction.y + dir.y === 0) {
      return;
    }
    this.nextDirection = dir;
  }

  // Core Game Loop
  gameLoop(currentTime) {
    if (!this.lastTickTime) this.lastTickTime = currentTime;
    const delta = currentTime - this.lastTickTime;
    this.blinkTimer = (this.blinkTimer + 1) % 60;

    if (this.state === 'PLAYING') {
      const interval = this.getSpeedInterval();
      if (delta >= interval) {
        this.lastTickTime = currentTime;
        this.tick();
      }
    }

    // Always render
    this.render();

    this.animationFrameId = requestAnimationFrame((t) => this.gameLoop(t));
  }

  tick() {
    this.direction = this.nextDirection;

    // Calculate new head
    let newHead = {
      x: this.snake[0].x + this.direction.x,
      y: this.snake[0].y + this.direction.y
    };

    // Mode-specific boundary handling
    if (this.mode === 'wraparound' || this.mode === 'labyrinth' || this.mode === 'box') {
      // Screen-wrap behavior
      if (newHead.x < 0) newHead.x = this.cols - 1;
      if (newHead.x >= this.cols) newHead.x = 0;
      if (newHead.y < 0) newHead.y = this.rows - 1;
      if (newHead.y >= this.rows) newHead.y = 0;
    } else {
      // Classic wall collision
      if (newHead.x < 0 || newHead.x >= this.cols || newHead.y < 0 || newHead.y >= this.rows) {
        this.gameOver();
        return;
      }
    }

    // Check collision with walls
    if (this.walls.some(w => w.x === newHead.x && w.y === newHead.y)) {
      this.gameOver();
      return;
    }

    // Check collision with self
    if (this.snake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
      this.gameOver();
      return;
    }

    // Move snake forward
    this.snake.unshift(newHead);

    // Check food collision
    if (this.food && newHead.x === this.food.x && newHead.y === this.food.y) {
      this.score += 10 * this.speedLevel;
      this.applesEaten++;
      window.nokiaAudio.playEat();

      // Check for bonus spawn (every 5 apples)
      if (this.applesEaten % 5 === 0 && !this.bonus) {
        this.spawnBonus();
      }

      this.spawnFood();
      this.updateSideStats();
    } else if (this.bonus && newHead.x === this.bonus.x && newHead.y === this.bonus.y) {
      // Caught the bonus insect!
      const bonusScore = Math.floor((this.bonus.timeLeft / this.bonus.maxTime) * this.bonus.value) + 10;
      this.score += bonusScore;
      this.bonus = null;
      window.nokiaAudio.playBonusEat();
      this.updateSideStats();
    } else {
      // Normal movement: pop tail
      this.snake.pop();
    }

    // Update bonus timer
    if (this.bonus) {
      this.bonus.timeLeft--;
      if (this.bonus.timeLeft <= 0) {
        this.bonus = null;
      }
    }
  }

  // =========================================================================
  // Canvas Rendering (Authentic Nokia Dot-Matrix LCD Graphics)
  // =========================================================================

  render() {
    this.ctx.fillStyle = this.colors.bg;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.state === 'TITLE') {
      this.renderTitleScreen();
    } else if (this.state === 'PLAYING') {
      this.renderGameBoard();
    } else if (this.state === 'PAUSED') {
      this.renderGameBoard();
      this.renderPauseOverlay();
    } else if (this.state === 'GAMEOVER') {
      this.renderGameBoard();
      this.renderGameOverOverlay();
    }
  }

  renderTitleScreen() {
    const ctx = this.ctx;
    ctx.fillStyle = this.colors.pixel;

    // Nokia title banner
    ctx.font = 'bold 20px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SNAKE II', this.canvas.width / 2, 48);

    // Decorative retro snake graphic on title screen
    const snakePattern = [
      { x: 5, y: 8 }, { x: 6, y: 8 }, { x: 7, y: 8 }, { x: 8, y: 8 },
      { x: 9, y: 8 }, { x: 10, y: 8 }, { x: 10, y: 9 }, { x: 10, y: 10 },
      { x: 11, y: 10 }, { x: 12, y: 10 }, { x: 13, y: 10 }, { x: 14, y: 10 },
      { x: 15, y: 10 }, { x: 16, y: 10 }, { x: 17, y: 10 }, { x: 18, y: 10 },
      { x: 19, y: 10 }, { x: 20, y: 10 }, { x: 21, y: 10 }, { x: 22, y: 10 }
    ];
    snakePattern.forEach((p, idx) => {
      this.drawPixelBlock(p.x * 10, p.y * 10, 10, idx === snakePattern.length - 1);
    });

    // Food dot next to snake mouth
    this.drawNokiaApple(240, 100);

    // Instruction prompt (blinking)
    if (this.blinkTimer < 35) {
      ctx.font = '12px "VT323", monospace';
      ctx.fillText('PRESS NAVI OR 5 TO PLAY', this.canvas.width / 2, 142);
    }

    // High score teaser
    ctx.font = '11px "VT323", monospace';
    ctx.fillText(`TOP SCORE: ${this.highScore}`, this.canvas.width / 2, 168);
  }

  renderGameBoard() {
    // 1. Draw Walls
    this.walls.forEach(w => {
      this.drawNokiaWall(w.x * this.cellSize, w.y * this.cellSize);
    });

    // 2. Draw Apple / Food
    if (this.food) {
      this.drawNokiaApple(this.food.x * this.cellSize, this.food.y * this.cellSize);
    }

    // 3. Draw Bonus Insect (if active)
    if (this.bonus) {
      // Blink when under 15 ticks left
      if (this.bonus.timeLeft > 15 || this.blinkTimer % 20 < 10) {
        this.drawNokiaBug(this.bonus.x * this.cellSize, this.bonus.y * this.cellSize);
      }
      // Draw bonus timer bar at top
      this.drawBonusTimerBar();
    }

    // 4. Draw Snake
    this.snake.forEach((seg, idx) => {
      const isHead = idx === 0;
      const isTail = idx === this.snake.length - 1;
      this.drawSnakeSegment(seg.x * this.cellSize, seg.y * this.cellSize, isHead, isTail, idx);
    });
  }

  drawBonusTimerBar() {
    if (!this.bonus) return;
    const ctx = this.ctx;
    const progress = this.bonus.timeLeft / this.bonus.maxTime;
    const barWidth = Math.floor(100 * progress);
    const startX = (this.canvas.width - 100) / 2;

    ctx.fillStyle = this.colors.ghost;
    ctx.fillRect(startX, 3, 100, 3);
    ctx.fillStyle = this.colors.pixel;
    ctx.fillRect(startX, 3, barWidth, 3);
  }

  // Authentic Nokia Snake Body Segment (checkered dot-matrix look)
  drawSnakeSegment(x, y, isHead, isTail, index) {
    const ctx = this.ctx;
    const sz = this.cellSize;

    if (isHead) {
      // Solid outer with eye pixels
      ctx.fillStyle = this.colors.pixel;
      ctx.fillRect(x + 1, y + 1, sz - 2, sz - 2);

      // Cute eye cutouts based on direction
      ctx.fillStyle = this.colors.bg;
      if (this.direction.x === 1) { // Moving Right
        ctx.fillRect(x + sz - 3, y + 2, 2, 2);
        ctx.fillRect(x + sz - 3, y + sz - 4, 2, 2);
      } else if (this.direction.x === -1) { // Moving Left
        ctx.fillRect(x + 1, y + 2, 2, 2);
        ctx.fillRect(x + 1, y + sz - 4, 2, 2);
      } else if (this.direction.y === -1) { // Moving Up
        ctx.fillRect(x + 2, y + 1, 2, 2);
        ctx.fillRect(x + sz - 4, y + 1, 2, 2);
      } else { // Moving Down
        ctx.fillRect(x + 2, y + sz - 3, 2, 2);
        ctx.fillRect(x + sz - 4, y + sz - 3, 2, 2);
      }
    } else if (isTail) {
      // Smaller tapered segment
      ctx.fillStyle = this.colors.pixel;
      ctx.fillRect(x + 2, y + 2, sz - 4, sz - 4);
    } else {
      // Classic Nokia textured body
      ctx.fillStyle = this.colors.pixel;
      ctx.fillRect(x + 1, y + 1, sz - 2, sz - 2);
      // Small hollow dot inside body segment
      ctx.fillStyle = this.colors.bg;
      ctx.fillRect(x + 3, y + 3, sz - 6, sz - 6);
      ctx.fillStyle = this.colors.pixel;
      ctx.fillRect(x + 4, y + 4, sz - 8, sz - 8);
    }
  }

  // Classic Nokia 3310 Apple Pellet
  drawNokiaApple(x, y) {
    const ctx = this.ctx;
    ctx.fillStyle = this.colors.pixel;
    // Apple round body (8x8 pixel cluster)
    ctx.fillRect(x + 2, y + 3, 6, 5);
    ctx.fillRect(x + 3, y + 2, 4, 7);
    // Stem
    ctx.fillRect(x + 4, y + 1, 2, 2);
    // Tiny bite/shine pixel
    ctx.fillStyle = this.colors.bg;
    ctx.fillRect(x + 3, y + 4, 1, 1);
  }

  // Classic Snake II Bonus Insect/Bug
  drawNokiaBug(x, y) {
    const ctx = this.ctx;
    ctx.fillStyle = this.colors.pixel;

    // Beetle body
    ctx.fillRect(x + 2, y + 2, 6, 6);
    // Head & Antennae
    ctx.fillRect(x + 3, y + 1, 4, 1);
    ctx.fillRect(x + 1, y, 1, 2);
    ctx.fillRect(x + 8, y, 1, 2);
    // Legs
    ctx.fillRect(x, y + 3, 10, 1);
    ctx.fillRect(x, y + 6, 10, 1);

    // Eye cutouts
    ctx.fillStyle = this.colors.bg;
    ctx.fillRect(x + 4, y + 4, 2, 2);
  }

  // Nokia Wall block with retro cross-hatch pattern
  drawNokiaWall(x, y) {
    const ctx = this.ctx;
    const sz = this.cellSize;
    ctx.fillStyle = this.colors.pixel;
    ctx.fillRect(x, y, sz, sz);
    ctx.fillStyle = this.colors.bg;
    // Brick pattern
    ctx.fillRect(x + 1, y + 1, sz - 2, 1);
    ctx.fillRect(x + 1, y + Math.floor(sz / 2), sz - 2, 1);
    ctx.fillRect(x + Math.floor(sz / 2), y + 2, 1, Math.floor(sz / 2) - 2);
  }

  drawPixelBlock(x, y, sz, isHead) {
    const ctx = this.ctx;
    ctx.fillStyle = this.colors.pixel;
    ctx.fillRect(x + 1, y + 1, sz - 2, sz - 2);
    if (!isHead) {
      ctx.fillStyle = this.colors.bg;
      ctx.fillRect(x + 3, y + 3, sz - 6, sz - 6);
    }
  }

  renderPauseOverlay() {
    const ctx = this.ctx;
    // Semitransparent box
    ctx.fillStyle = this.colors.bg;
    ctx.fillRect(40, 60, this.canvas.width - 80, 70);

    ctx.strokeStyle = this.colors.pixel;
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 60, this.canvas.width - 80, 70);

    ctx.fillStyle = this.colors.pixel;
    ctx.font = 'bold 16px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', this.canvas.width / 2, 94);

    if (this.blinkTimer < 35) {
      ctx.font = '12px "VT323", monospace';
      ctx.fillText('PRESS NAVI TO RESUME', this.canvas.width / 2, 118);
    }
  }

  renderGameOverOverlay() {
    const ctx = this.ctx;
    ctx.fillStyle = this.colors.bg;
    ctx.fillRect(25, 45, this.canvas.width - 50, 100);

    ctx.strokeStyle = this.colors.pixel;
    ctx.lineWidth = 2;
    ctx.strokeRect(25, 45, this.canvas.width - 50, 100);

    ctx.fillStyle = this.colors.pixel;
    ctx.font = 'bold 14px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', this.canvas.width / 2, 75);

    ctx.font = '15px "VT323", monospace';
    ctx.fillText(`SCORE: ${this.score}`, this.canvas.width / 2, 100);
    ctx.fillText(`HIGH:  ${this.highScore}`, this.canvas.width / 2, 116);

    if (this.blinkTimer < 35) {
      ctx.font = '12px "VT323", monospace';
      ctx.fillText('PRESS NAVI OR 5 TO RESTART', this.canvas.width / 2, 134);
    }
  }

  // =========================================================================
  // User Input & Event Handling
  // =========================================================================

  setupEventListeners() {
    // 1. Keyboard Controls
    window.addEventListener('keydown', (e) => {
      // Prevent arrow scrolling
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      this.handleActionInput(e.key);
    });

    // 2. Physical Button Bindings (Tactile phone clicks)
    const attachButton = (id, action) => {
      const btn = document.getElementById(id);
      if (!btn) return;

      const trigger = (e) => {
        if (e) e.preventDefault();
        btn.classList.add('pressed');
        window.nokiaAudio.playKeyClick();
        action();
        setTimeout(() => btn.classList.remove('pressed'), 120);
      };

      btn.addEventListener('click', trigger);
      btn.addEventListener('touchstart', (e) => {
        trigger(e);
      }, { passive: false });
    };

    // Directional keys
    attachButton('btnArrowUp', () => this.handleDirectionInput('up'));
    attachButton('btnArrowDown', () => this.handleDirectionInput('down'));
    attachButton('btnArrowLeft', () => this.handleDirectionInput('left'));
    attachButton('btnArrowRight', () => this.handleDirectionInput('right'));

    // Numpad Direction keys (2, 4, 6, 8)
    attachButton('key2', () => this.handleDirectionInput('up'));
    attachButton('key4', () => this.handleDirectionInput('left'));
    attachButton('key6', () => this.handleDirectionInput('right'));
    attachButton('key8', () => this.handleDirectionInput('down'));

    // Key 5 (Confirm / Start)
    attachButton('key5', () => this.handlePrimaryAction());

    // Navi Button (Central Select / Action)
    attachButton('btnNavi', () => this.handlePrimaryAction());

    // Soft Keys
    attachButton('btnLeftSoft', () => this.handleLeftSoftKey());
    attachButton('btnRightSoft', () => this.handleRightSoftKey());

    // Keypad * (Toggle Sound)
    attachButton('keyStar', () => this.toggleSound());

    // Keypad # (Cycle LCD Theme)
    attachButton('keyHash', () => this.cycleLcdTheme());

    // Extra Numpad Keys (Nostalgia sounds)
    ['key1', 'key3', 'key7', 'key9', 'key0'].forEach(id => {
      attachButton(id, () => {
        // Just tactile beep
      });
    });

    // 3. Touch Swipes on Canvas (for direct mobile interaction)
    let touchStartX = 0;
    let touchStartY = 0;
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      window.nokiaAudio.init();
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      const diffX = touch.clientX - touchStartX;
      const diffY = touch.clientY - touchStartY;
      const threshold = 25;

      if (Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > threshold) this.handleDirectionInput('right');
        else if (diffX < -threshold) this.handleDirectionInput('left');
      } else {
        if (diffY > threshold) this.handleDirectionInput('down');
        else if (diffY < -threshold) this.handleDirectionInput('up');
      }
    }, { passive: false });

    // 4. Side Panel Controls & Options
    this.dom.gameModeSelect.addEventListener('change', (e) => {
      this.mode = e.target.value;
      this.dom.lcdGameModeText.textContent = this.getModeDisplayTitle();
      this.resetGame();
      this.updateSideStats();
    });

    this.dom.speedSlider.addEventListener('input', (e) => {
      this.speedLevel = parseInt(e.target.value, 10);
      this.dom.speedValLabel.textContent = this.speedLevel;
      this.updateSideStats();
    });

    this.dom.soundToggleCheckbox.addEventListener('change', (e) => {
      const active = window.nokiaAudio.toggleSound(e.target.checked);
      this.updateSoundIcon(active);
    });

    this.dom.bonusInsectCheckbox.addEventListener('change', (e) => {
      this.bonusEnabled = e.target.checked;
      if (!this.bonusEnabled) this.bonus = null;
    });

    this.dom.btnResetHighScore.addEventListener('click', () => {
      if (confirm('Reset high score to 0?')) {
        this.highScore = 0;
        localStorage.removeItem('nokia_snake_highscore');
        this.updateSideStats();
      }
    });

    // 5. Phone Shell Color Switchers
    document.querySelectorAll('.shell-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.shell-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const shell = btn.dataset.shell;
        this.dom.phoneBody.className = `phone-body ${shell}`;
        window.nokiaAudio.playKeyClick();
      });
    });

    // 6. LCD Theme Switchers
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const theme = btn.dataset.lcd;
        this.dom.lcdScreen.className = `lcd-screen ${theme}`;
        this.updateColors();
        window.nokiaAudio.playKeyClick();
      });
    });
  }

  handleActionInput(key) {
    window.nokiaAudio.init();

    switch (key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
      case '2':
        this.handleDirectionInput('up');
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
      case '8':
        this.handleDirectionInput('down');
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
      case '4':
        this.handleDirectionInput('left');
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
      case '6':
        this.handleDirectionInput('right');
        break;
      case ' ':
      case 'Enter':
      case '5':
        this.handlePrimaryAction();
        break;
      case 'Escape':
      case 'Backspace':
      case 'c':
      case 'C':
        this.handleRightSoftKey();
        break;
      case '*':
        this.toggleSound();
        break;
      case '#':
        this.cycleLcdTheme();
        break;
    }
  }

  handleDirectionInput(dirStr) {
    if (this.state === 'PLAYING') {
      if (dirStr === 'up' && this.direction.y === 0) this.changeDirection({ x: 0, y: -1 });
      if (dirStr === 'down' && this.direction.y === 0) this.changeDirection({ x: 0, y: 1 });
      if (dirStr === 'left' && this.direction.x === 0) this.changeDirection({ x: -1, y: 0 });
      if (dirStr === 'right' && this.direction.x === 0) this.changeDirection({ x: 1, y: 0 });
    } else if (this.state === 'TITLE' || this.state === 'GAMEOVER') {
      this.startGame();
    }
  }

  handlePrimaryAction() {
    if (this.state === 'TITLE' || this.state === 'GAMEOVER') {
      this.startGame();
    } else if (this.state === 'PLAYING' || this.state === 'PAUSED') {
      this.togglePause();
    }
  }

  handleLeftSoftKey() {
    if (this.state === 'TITLE' || this.state === 'GAMEOVER') {
      this.startGame();
    } else if (this.state === 'PLAYING' || this.state === 'PAUSED') {
      this.togglePause();
    }
  }

  handleRightSoftKey() {
    if (this.state === 'PLAYING') {
      this.togglePause();
    } else if (this.state === 'PAUSED' || this.state === 'GAMEOVER') {
      this.state = 'TITLE';
      this.setSoftKeys('Start', 'Play', 'Exit');
    }
  }

  toggleSound() {
    const active = window.nokiaAudio.toggleSound();
    this.dom.soundToggleCheckbox.checked = active;
    this.updateSoundIcon(active);
  }

  updateSoundIcon(active) {
    this.dom.lcdSoundIndicator.textContent = active ? '🔊' : '🔇';
  }

  cycleLcdTheme() {
    const themes = ['classic', 'ice', 'amber', 'mono'];
    const currentTheme = themes.find(t => this.dom.lcdScreen.classList.contains(t)) || 'classic';
    const nextIdx = (themes.indexOf(currentTheme) + 1) % themes.length;
    const nextTheme = themes[nextIdx];

    this.dom.lcdScreen.className = `lcd-screen ${nextTheme}`;
    document.querySelectorAll('.theme-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.lcd === nextTheme);
    });
    this.updateColors();
  }

  getModeDisplayTitle() {
    switch (this.mode) {
      case 'classic': return 'SNAKE I';
      case 'wraparound': return 'SNAKE II';
      case 'labyrinth': return 'LABYRINTH';
      case 'box': return 'BOX MAZE';
      default: return 'SNAKE II';
    }
  }

  updateSideStats() {
    this.dom.liveScore.textContent = this.score;
    this.dom.liveHighScore.textContent = this.highScore;
    this.dom.liveMode.textContent = this.getModeDisplayTitle();
    this.dom.liveSpeed.textContent = `${this.speedLevel} / 9`;
    this.dom.liveEaten.textContent = this.applesEaten;
  }
}

// Initialize on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.snakeGame = new NokiaSnakeGame();
});
