const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const levelEl = document.getElementById("level");
const timeEl = document.getElementById("time");
const scoreEl = document.getElementById("score");
const targetEl = document.getElementById("target");
const streakEl = document.getElementById("streak");

const startButton = document.getElementById("startButton");
const barkButton = document.getElementById("barkButton");
const pauseButton = document.getElementById("pauseButton");
const restartButton = document.getElementById("restartButton");
const soundToggle = document.getElementById("soundToggle");
const mobileStartButton = document.getElementById("mobileStartButton");
const mobilePauseButton = document.getElementById("mobilePauseButton");
const mobileRestartButton = document.getElementById("mobileRestartButton");
const mobileBarkButton = document.getElementById("mobileBarkButton");
const mobileLeftButton = document.getElementById("mobileLeftButton");
const mobileRightButton = document.getElementById("mobileRightButton");

const lukaIdleSprite = new Image();
lukaIdleSprite.src = "assets/luka-sit-idle-v3.png";
const lukaBarkSprite = new Image();
lukaBarkSprite.src = "assets/luka-sit-bark-v3.png";

const LEVEL_DURATION = 75;

const GAME_STATE = {
  TITLE: "title",
  LEVEL_INTRO: "levelIntro",
  PLAYING: "playing",
  PAUSED: "paused",
  LEVEL_COMPLETE: "levelComplete",
  GAME_OVER: "gameOver",
  WON: "won"
};

const levels = [
  { name: "Lazy Afternoon", subtitle: "A gentle start. Luka pretends this is casual.", target: 8, spawnMin: 2100, spawnMax: 4200, speed: 1.35, maxActive: 2 },
  { name: "Busy Garden", subtitle: "More movement. More opinions.", target: 13, spawnMin: 1500, spawnMax: 3300, speed: 1.7, maxActive: 3 },
  { name: "Suspicious Movement", subtitle: "The garden is clearly plotting something.", target: 18, spawnMin: 1100, spawnMax: 2600, speed: 2.1, maxActive: 3 },
  { name: "Window Emergency", subtitle: "Multiple threats. Zero chill.", target: 24, spawnMin: 760, spawnMax: 2100, speed: 2.55, maxActive: 4 },
  { name: "Full Bark Mode", subtitle: "Tiny body. Maximum authority.", target: 31, spawnMin: 520, spawnMax: 1600, speed: 3.05, maxActive: 5 }
];

const passerTypes = [
  { kind: "person", name: "Jogger", color: "#f0a56a", accent: "#fff1a8", hair: "#6a432b", speedBonus: 0.45, points: 1, reaction: "RUN!" },
  { kind: "person", name: "Courier", color: "#82aee8", accent: "#3f3646", hair: "#3f3646", speedBonus: 0.2, points: 1, reaction: "DROP!" },
  { kind: "person", name: "Grandma", color: "#c6a0d8", accent: "#fffaf4", hair: "#ddd6ce", speedBonus: -0.2, points: 1, reaction: "OH!" },
  { kind: "person", name: "Scooter Kid", color: "#97c59f", accent: "#fffaf4", hair: "#6c4a35", speedBonus: 0.75, points: 1, reaction: "ZOOM!" },
  { kind: "person", name: "Neighbour", color: "#d68697", accent: "#fffaf4", hair: "#2d2730", speedBonus: 0.05, points: 1, reaction: "NOPE!" },
  { kind: "cat", name: "Cat", color: "#403841", accent: "#f0d7df", speedBonus: 0.9, points: 2, reaction: "HISS!" },
  { kind: "bee", name: "Bee", color: "#fff04a", accent: "#3f3646", speedBonus: 0.6, points: -2, reaction: "BZZ!" }
];

let gameState = GAME_STATE.TITLE;
let currentLevel = 0;
let score = 0;
let streak = 0;
let timeLeft = LEVEL_DURATION;
let lastTime = 0;
let nextSpawnAt = 0;
let passers = [];
let particles = [];
let barkFlash = 0;
let missFlash = 0;
let lukaX = 0;
let lukaTargetX = 0;
let animationClock = 0;
let soundEnabled = true;
let audioCtx = null;
let animationStarted = false;
let moveHoldDirection = 0;
let lastHeldMoveAt = 0;

function setupAudio() {
  if (!soundEnabled) return;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playTone(freq, duration, type = "sine", volume = 0.08) {
  if (!audioCtx || !soundEnabled) return;
  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  oscillator.type = type;
  oscillator.frequency.value = freq;
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

  oscillator.connect(gain);
  gain.connect(audioCtx.destination);
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + duration);
}

function playBarkSound() {
  playTone(150, 0.08, "square", 0.07);
  setTimeout(() => playTone(95, 0.12, "sawtooth", 0.07), 55);
  setTimeout(() => playTone(185, 0.07, "square", 0.045), 140);
}

function playScoreSound() {
  playTone(520, 0.09, "triangle", 0.055);
  setTimeout(() => playTone(760, 0.11, "triangle", 0.05), 90);
}

function playMistakeSound() {
  playTone(120, 0.18, "sawtooth", 0.07);
  setTimeout(() => playTone(80, 0.12, "sawtooth", 0.05), 130);
}

function playLevelSound() {
  [420, 540, 690, 880].forEach((f, i) => {
    setTimeout(() => playTone(f, 0.13, "triangle", 0.055), i * 100);
  });
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function chance(value) {
  return Math.random() < value;
}

function scheduleNextSpawn(now) {
  const settings = levels[currentLevel];
  nextSpawnAt = now + randomBetween(settings.spawnMin, settings.spawnMax);
}

function pickPasserType() {
  const level = currentLevel + 1;
  const beeChance = Math.min(0.08 + level * 0.025, 0.18);
  const catChance = Math.min(0.10 + level * 0.025, 0.20);

  if (chance(beeChance)) return passerTypes.find(t => t.kind === "bee");
  if (chance(catChance)) return passerTypes.find(t => t.kind === "cat");

  const people = passerTypes.filter(t => t.kind === "person");
  return people[Math.floor(Math.random() * people.length)];
}

function spawnPasser(forceType = null) {
  const settings = levels[currentLevel];
  if (passers.length >= settings.maxActive) return;

  const type = forceType || pickPasserType();
  const lane = type.kind === "bee" ? randomBetween(155, 230) : randomBetween(318, 370);

  passers.push({
    x: canvas.width + 80,
    y: lane,
    speed: settings.speed + type.speedBonus + randomBetween(-0.25, 0.45),
    scared: false,
    barked: false,
    type,
    wobble: randomBetween(0, Math.PI * 2),
    size: type.kind === "bee" ? randomBetween(0.8, 1.1) : randomBetween(0.9, 1.1)
  });
}

function updateHud() {
  levelEl.textContent = currentLevel + 1;
  timeEl.textContent = Math.max(0, Math.ceil(timeLeft));
  scoreEl.textContent = score;
  targetEl.textContent = levels[currentLevel].target;
  streakEl.textContent = streak;
}

function resetLevelValues() {
  score = 0;
  streak = 0;
  timeLeft = LEVEL_DURATION;
  passers = [];
  particles = [];
  barkFlash = 0;
  missFlash = 0;
  lukaX = 0;
  lukaTargetX = 0;
  updateHud();
}

function showLevelIntro(levelIndex) {
  currentLevel = levelIndex;
  resetLevelValues();
  gameState = GAME_STATE.LEVEL_INTRO;
  playLevelSound();
  draw();
}

function beginPlaying() {
  resetLevelValues();
  gameState = GAME_STATE.PLAYING;
  lastTime = performance.now();
  scheduleNextSpawn(lastTime);
  updateHud();
  requestAnimationFrame(gameLoop);
}

function startGame() {
  setupAudio();

  if (gameState === GAME_STATE.TITLE) {
    showLevelIntro(0);
    return;
  }

  if (gameState === GAME_STATE.LEVEL_INTRO) {
    beginPlaying();
    return;
  }

  if (gameState === GAME_STATE.PAUSED) {
    resumeGame();
    return;
  }

  if (gameState === GAME_STATE.LEVEL_COMPLETE) {
    showLevelIntro(currentLevel);
    return;
  }

  if (gameState === GAME_STATE.GAME_OVER || gameState === GAME_STATE.WON) {
    showLevelIntro(0);
  }
}

function pauseGame() {
  if (gameState === GAME_STATE.PLAYING) {
    gameState = GAME_STATE.PAUSED;
    draw();
  }
}

function resumeGame() {
  if (gameState === GAME_STATE.PAUSED) {
    gameState = GAME_STATE.PLAYING;
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
  }
}

function restartFromBeginning() {
  showLevelIntro(0);
}

function addTextParticle(text, x, y, color = "#3f3646") {
  particles.push({ text, x, y, vy: -1.6, life: 60, color });
}

function bark() {
  if (gameState === GAME_STATE.TITLE) {
    startGame();
    return;
  }

  if (gameState === GAME_STATE.LEVEL_INTRO) {
    beginPlaying();
    return;
  }

  if (gameState === GAME_STATE.LEVEL_COMPLETE) {
    showLevelIntro(currentLevel);
    return;
  }

  if (gameState === GAME_STATE.PAUSED || gameState === GAME_STATE.GAME_OVER || gameState === GAME_STATE.WON) return;
  if (gameState !== GAME_STATE.PLAYING) return;

  setupAudio();
  playBarkSound();
  barkFlash = 16;

  let hitSomething = false;
  let hitPositive = false;
  let hitNegative = false;

  passers.forEach(p => {
    const barkCenter = 610 + lukaX * 0.35;
    const barkWidth = p.type.kind === "bee" ? 100 : 165;
    const inBarkZone = p.x > barkCenter - barkWidth && p.x < barkCenter + barkWidth;

    if (inBarkZone && !p.barked) {
      hitSomething = true;
      p.barked = true;
      p.scared = true;
      p.speed *= p.type.kind === "bee" ? 1.7 : 2.85;

      if (p.type.points > 0) {
        hitPositive = true;
        streak += 1;
        const streakBonus = streak > 0 && streak % 5 === 0 ? 2 : 0;
        score += p.type.points + streakBonus;
        addTextParticle(streakBonus ? `+${p.type.points + streakBonus} STREAK!` : `+${p.type.points}`, p.x, p.y - 105, "#5b8566");
      } else {
        hitNegative = true;
        streak = 0;
        score += p.type.points;
        missFlash = 18;
        addTextParticle("-2 poor bee", p.x, p.y - 65, "#d96b7c");
      }
    }
  });

  if (!hitSomething) {
    score = Math.max(0, score - 1);
    streak = 0;
    missFlash = 18;
    addTextParticle("-1 empty bark", 515 + lukaX * 0.2, 245, "#d96b7c");
    playMistakeSound();
  } else if (hitNegative) {
    playMistakeSound();
  } else if (hitPositive) {
    playScoreSound();
  }

  updateHud();
}

function moveLuka(direction) {
  if (gameState !== GAME_STATE.PLAYING) return;
  lukaTargetX += direction * 36;
  lukaTargetX = Math.max(-95, Math.min(95, lukaTargetX));
}

function endLevel() {
  const target = levels[currentLevel].target;

  if (score >= target) {
    if (currentLevel < levels.length - 1) {
      currentLevel += 1;
      gameState = GAME_STATE.LEVEL_COMPLETE;
      playLevelSound();
    } else {
      gameState = GAME_STATE.WON;
      playLevelSound();
    }
  } else {
    gameState = GAME_STATE.GAME_OVER;
    playMistakeSound();
  }

  draw();
}

function gameLoop(now) {
  if (gameState !== GAME_STATE.PLAYING) {
    draw();
    return;
  }

  const delta = (now - lastTime) / 1000;
  lastTime = now;
  animationClock += delta;

  timeLeft -= delta;
  lukaX += (lukaTargetX - lukaX) * 0.12;

  if (moveHoldDirection !== 0 && now - lastHeldMoveAt > 120) {
    moveLuka(moveHoldDirection);
    lastHeldMoveAt = now;
  }

  if (now >= nextSpawnAt) {
    spawnPasser();
    if (currentLevel >= 3 && chance(0.22)) {
      setTimeout(() => spawnPasser(), randomBetween(180, 480));
    }
    scheduleNextSpawn(now);
  }

  passers.forEach(p => {
    p.wobble += delta * 5;
    const wobbleY = p.type.kind === "bee" ? Math.sin(p.wobble) * 0.7 : 0;
    p.x -= p.speed * 60 * delta;
    p.y += wobbleY;
  });

  passers = passers.filter(p => p.x > -120);

  particles.forEach(pt => {
    pt.y += pt.vy;
    pt.life -= 1;
  });
  particles = particles.filter(pt => pt.life > 0);

  if (barkFlash > 0) barkFlash--;
  if (missFlash > 0) missFlash--;

  updateHud();
  draw();

  if (timeLeft <= 0) {
    timeLeft = 0;
    updateHud();
    endLevel();
    return;
  }

  requestAnimationFrame(gameLoop);
}

function animateIdle() {
  animationClock += 0.012;
  draw();
  requestAnimationFrame(animateIdle);
}

function roundedRect(x, y, w, h, r, fillStyle) {
  ctx.fillStyle = fillStyle;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

function strokeRoundedRect(x, y, w, h, r, strokeStyle, lineWidth = 3) {
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.stroke();
}

function drawBackground() {
  const wall = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  wall.addColorStop(0, "#f8efe8");
  wall.addColorStop(1, "#edf4ed");
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(255, 241, 168, 0.45)";
  ctx.beginPath();
  ctx.arc(92, 84, 72, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(183, 134, 151, 0.18)";
  ctx.beginPath();
  ctx.arc(892, 92, 84, 0, Math.PI * 2);
  ctx.fill();

  roundedRect(239, 52, 638, 350, 24, "rgba(63,54,70,0.12)");
  roundedRect(250, 44, 620, 345, 22, "#fffaf4");

  const sky = ctx.createLinearGradient(0, 70, 0, 360);
  sky.addColorStop(0, "#a9daff");
  sky.addColorStop(1, "#e1f4ff");
  roundedRect(274, 68, 572, 298, 12, sky);

  ctx.fillStyle = "#fff1a8";
  ctx.beginPath();
  ctx.arc(770, 115, 34, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#dceadf";
  ctx.fillRect(274, 256, 572, 110);

  ctx.fillStyle = "#c7ab8c";
  ctx.beginPath();
  ctx.moveTo(274, 321);
  ctx.bezierCurveTo(410, 306, 540, 355, 846, 324);
  ctx.lineTo(846, 366);
  ctx.lineTo(274, 366);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#7ea07d";
  [325, 380, 430, 740, 790, 820].forEach((x, i) => {
    ctx.beginPath();
    ctx.arc(x, 258 + (i % 2) * 10, 38 + (i % 3) * 8, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.strokeStyle = "#8a684c";
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(705, 272);
  ctx.lineTo(720, 172);
  ctx.moveTo(724, 218);
  ctx.lineTo(758, 180);
  ctx.stroke();

  ctx.strokeStyle = "#3f3646";
  ctx.lineWidth = 8;
  ctx.strokeRect(250, 44, 620, 345);
  ctx.beginPath();
  ctx.moveTo(560, 44);
  ctx.lineTo(560, 389);
  ctx.moveTo(250, 216);
  ctx.lineTo(870, 216);
  ctx.stroke();

  ctx.fillStyle = "rgba(240, 215, 223, 0.82)";
  ctx.beginPath();
  ctx.moveTo(884, 36);
  ctx.bezierCurveTo(920, 100, 902, 235, 932, 396);
  ctx.lineTo(870, 396);
  ctx.bezierCurveTo(892, 260, 858, 125, 884, 36);
  ctx.fill();

  roundedRect(120, 402, 450, 112, 28, "#efd6de");
  ctx.fillStyle = "rgba(255,255,255,0.24)";
  ctx.beginPath();
  ctx.ellipse(280, 426, 130, 24, 0, 0, Math.PI * 2);
  ctx.fill();

  roundedRect(0, 462, canvas.width, 94, 26, "#d8d0c4");
  ctx.fillStyle = "#c2b8a7";
  for (let x = 22; x < canvas.width; x += 46) {
    ctx.fillRect(x, 462, 14, 94);
  }

  if (missFlash > 0) {
    ctx.fillStyle = `rgba(217, 107, 124, ${missFlash / 72})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}






function drawLuka() {
  const barking = barkFlash > 0;
  const x = lukaX;
  const sprite = barking ? lukaBarkSprite : lukaIdleSprite;

  // softer grounded shadows under a more seated Luka
  ctx.fillStyle = "rgba(63,54,70,0.11)";
  ctx.beginPath();
  ctx.ellipse(276 + x, 492, 146, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(63,54,70,0.07)";
  ctx.beginPath();
  ctx.ellipse(318 + x, 462, 92, 24, 0, 0, Math.PI * 2);
  ctx.fill();

  if (sprite && sprite.complete && sprite.naturalWidth > 0) {
    // Fresh sprite filenames to avoid caching.
    // Draw Luka smaller, lower, and more vertically compressed so she feels seated.
    const drawWidth = barking ? 345 : 330;
    const drawHeight = barking ? 265 : 250;
    const drawX = 116 + x;
    const drawY = barking ? 176 : 188;
    ctx.drawImage(sprite, drawX, drawY, drawWidth, drawHeight);
  } else {
    // simple fallback while image loads
    ctx.fillStyle = "#ece8e2";
    ctx.strokeStyle = "#3f3646";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.ellipse(320 + x, 405, 145, 82, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(445 + x, 320, 86, 64, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  if (barking) {
    ctx.save();
    ctx.translate(548 + x * 0.18, 238);
    ctx.rotate(-0.06);
    roundedRect(-18, -42, 154, 60, 18, "#fff1a8");
    strokeRoundedRect(-12, -36, 142, 48, 10, "#3f3646", 4);
    ctx.fillStyle = "#5b8566";
    ctx.font = "bold 38px Arial";
    ctx.fillText("WOOF!", 2, 0);
    ctx.restore();
  }
}

function drawPerson(p) {
  const x = p.x;
  const y = p.y;
  const s = p.size;
  const run = p.scared ? Math.sin(p.wobble * 4) * 8 : Math.sin(p.wobble) * 3;
  const bob = p.scared ? Math.abs(Math.sin(p.wobble * 4)) * 4 : Math.sin(p.wobble * 2) * 1.5;

  ctx.fillStyle = "rgba(63,54,70,0.22)";
  ctx.beginPath();
  ctx.ellipse(x, y + 28, 32 * s, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#3f3646";
  ctx.lineWidth = 5 * s;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x - 8 * s, y - 8 * s - bob);
  ctx.lineTo(x - (18 + run) * s, y + 28 * s);
  ctx.moveTo(x + 8 * s, y - 8 * s - bob);
  ctx.lineTo(x + (20 - run) * s, y + 28 * s);
  ctx.stroke();

  roundedRect(x - 22 * s, y - 70 * s - bob, 44 * s, 62 * s, 14 * s, p.type.color);
  strokeRoundedRect(x - 22 * s, y - 70 * s - bob, 44 * s, 62 * s, 14 * s, "#3f3646", 3 * s);

  ctx.fillStyle = p.type.accent;
  ctx.fillRect(x - 19 * s, y - 44 * s - bob, 38 * s, 8 * s);

  ctx.fillStyle = "#f0c7a4";
  ctx.beginPath();
  ctx.arc(x, y - 90 * s - bob, 18 * s, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = p.type.hair;
  ctx.beginPath();
  ctx.arc(x, y - 101 * s - bob, 17 * s, Math.PI, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#3f3646";
  ctx.beginPath();
  ctx.arc(x - 5 * s, y - 91 * s - bob, 2 * s, 0, Math.PI * 2);
  ctx.arc(x + 6 * s, y - 91 * s - bob, 2 * s, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#3f3646";
  ctx.lineWidth = 5 * s;
  ctx.beginPath();
  ctx.moveTo(x - 20 * s, y - 52 * s - bob);
  ctx.lineTo(x - (37 - run) * s, y - 27 * s - bob);
  ctx.moveTo(x + 20 * s, y - 52 * s - bob);
  ctx.lineTo(x + (37 + run) * s, y - 27 * s - bob);
  ctx.stroke();

  if (p.type.name === "Courier") {
    roundedRect(x + 28 * s, y - 38 * s - bob, 25 * s, 22 * s, 4 * s, "#c99a5b");
    strokeRoundedRect(x + 28 * s, y - 38 * s - bob, 25 * s, 22 * s, 4 * s, "#3f3646", 2 * s);
  }

  if (p.type.name === "Grandma") {
    ctx.strokeStyle = "#3f3646";
    ctx.lineWidth = 3 * s;
    ctx.beginPath();
    ctx.arc(x - 7 * s, y - 91 * s - bob, 6 * s, 0, Math.PI * 2);
    ctx.arc(x + 8 * s, y - 91 * s - bob, 6 * s, 0, Math.PI * 2);
    ctx.stroke();

    roundedRect(x - 51 * s, y - 26 * s - bob, 18 * s, 24 * s, 4 * s, "#fff1a8");
    strokeRoundedRect(x - 51 * s, y - 26 * s - bob, 18 * s, 24 * s, 4 * s, "#3f3646", 2 * s);
  }

  if (p.type.name === "Scooter Kid") {
    ctx.strokeStyle = "#3f3646";
    ctx.lineWidth = 4 * s;
    ctx.beginPath();
    ctx.moveTo(x - 34 * s, y + 31 * s);
    ctx.lineTo(x + 42 * s, y + 31 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x - 24 * s, y + 36 * s, 6 * s, 0, Math.PI * 2);
    ctx.arc(x + 34 * s, y + 36 * s, 6 * s, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (p.type.name === "Neighbour") {
    ctx.fillStyle = "#3f3646";
    ctx.fillRect(x - 25 * s, y - 113 * s - bob, 50 * s, 8 * s);
    ctx.fillRect(x - 13 * s, y - 133 * s - bob, 26 * s, 22 * s);
  }

  if (p.type.name === "Jogger") {
    ctx.strokeStyle = "#fff1a8";
    ctx.lineWidth = 3 * s;
    ctx.beginPath();
    ctx.moveTo(x - 12 * s, y - 66 * s - bob);
    ctx.lineTo(x + 12 * s, y - 12 * s - bob);
    ctx.stroke();
  }

  if (p.scared) {
    drawReaction(p.type.reaction, x + 23 * s, y - 118 * s - bob);
  }
}

function drawCat(p) {
  const x = p.x;
  const y = p.y;
  const s = p.size;
  const jump = p.scared ? Math.abs(Math.sin(p.wobble * 5)) * 18 : Math.sin(p.wobble * 2) * 4;

  ctx.fillStyle = "rgba(63,54,70,0.18)";
  ctx.beginPath();
  ctx.ellipse(x, y + 26, 42 * s, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = p.type.color;
  ctx.beginPath();
  ctx.ellipse(x, y - jump, 42 * s, 23 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x + 35 * s, y - 12 * s - jump, 22 * s, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x + 22 * s, y - 31 * s - jump);
  ctx.lineTo(x + 28 * s, y - 58 * s - jump);
  ctx.lineTo(x + 41 * s, y - 35 * s - jump);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x + 43 * s, y - 34 * s - jump);
  ctx.lineTo(x + 58 * s, y - 55 * s - jump);
  ctx.lineTo(x + 56 * s, y - 27 * s - jump);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = p.type.color;
  ctx.lineWidth = 12 * s;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x - 35 * s, y - 5 * s - jump);
  ctx.quadraticCurveTo(x - 75 * s, y - 45 * s - jump, x - 42 * s, y - 75 * s - jump);
  ctx.stroke();

  ctx.fillStyle = "#fff1a8";
  ctx.beginPath();
  ctx.arc(x + 29 * s, y - 14 * s - jump, 4 * s, 0, Math.PI * 2);
  ctx.arc(x + 45 * s, y - 14 * s - jump, 4 * s, 0, Math.PI * 2);
  ctx.fill();

  if (p.scared) {
    drawReaction(p.type.reaction, x + 48 * s, y - 65 * s - jump);
  }
}

function drawBee(p) {
  const x = p.x;
  const y = p.y;
  const s = p.size;
  const bob = Math.sin(p.wobble * 4) * 6;

  ctx.fillStyle = "rgba(255,255,255,0.82)";
  ctx.beginPath();
  ctx.ellipse(x - 10 * s, y - 12 * s + bob, 14 * s, 9 * s, -0.4, 0, Math.PI * 2);
  ctx.ellipse(x + 10 * s, y - 13 * s + bob, 14 * s, 9 * s, 0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#fff04a";
  ctx.beginPath();
  ctx.ellipse(x, y + bob, 22 * s, 14 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#3f3646";
  ctx.lineWidth = 4 * s;
  ctx.beginPath();
  ctx.moveTo(x - 8 * s, y - 12 * s + bob);
  ctx.lineTo(x - 8 * s, y + 12 * s + bob);
  ctx.moveTo(x + 5 * s, y - 12 * s + bob);
  ctx.lineTo(x + 5 * s, y + 12 * s + bob);
  ctx.stroke();

  ctx.fillStyle = "#3f3646";
  ctx.beginPath();
  ctx.arc(x + 16 * s, y - 3 * s + bob, 3 * s, 0, Math.PI * 2);
  ctx.fill();

  if (p.scared) {
    drawReaction(p.type.reaction, x + 20 * s, y - 28 * s + bob);
  }
}

function drawReaction(text, x, y) {
  roundedRect(x - 18, y - 34, 94, 38, 14, "#fff1a8");
  strokeRoundedRect(x - 13, y - 29, 84, 28, 8, "#3f3646", 3);
  ctx.fillStyle = "#3f3646";
  ctx.font = "bold 18px Arial";
  ctx.fillText(text, x - 4, y - 8);
}

function drawPasser(p) {
  if (p.type.kind === "cat") {
    drawCat(p);
  } else if (p.type.kind === "bee") {
    drawBee(p);
  } else {
    drawPerson(p);
  }
}

function drawParticles() {
  particles.forEach(pt => {
    ctx.globalAlpha = Math.max(0, pt.life / 60);
    ctx.fillStyle = pt.color;
    ctx.font = "bold 24px Arial";
    ctx.fillText(pt.text, pt.x, pt.y);
    ctx.globalAlpha = 1;
  });
}

function drawLevelTag() {
  if (gameState !== GAME_STATE.PLAYING) return;
  roundedRect(22, 22, 280, 48, 16, "rgba(255, 250, 244, 0.92)");
  strokeRoundedRect(30, 30, 264, 32, 10, "#3f3646", 3);
  ctx.fillStyle = "#3f3646";
  ctx.font = "bold 19px Arial";
  ctx.fillText(levels[currentLevel].name, 44, 53);
}

function drawBarkZone() {
  if (gameState !== GAME_STATE.PLAYING) return;
  const barkCenter = 610 + lukaX * 0.35;
  ctx.fillStyle = "rgba(91,133,102,0.06)";
  ctx.fillRect(barkCenter - 165, 82, 330, 285);
  ctx.strokeStyle = "rgba(91,133,102,0.24)";
  ctx.setLineDash([8, 10]);
  ctx.lineWidth = 3;
  ctx.strokeRect(barkCenter - 165, 82, 330, 285);
  ctx.setLineDash([]);
}

function drawOverlayBox(title, bodyLines, buttonText, footerText = "") {
  ctx.fillStyle = "rgba(255, 250, 244, 0.96)";
  ctx.beginPath();
  ctx.roundRect(130, 92, 700, 360, 30);
  ctx.fill();

  strokeRoundedRect(148, 110, 664, 324, 24, "#3f3646", 5);

  ctx.textAlign = "center";
  ctx.fillStyle = "#3f3646";
  ctx.font = "bold 44px Arial";
  ctx.fillText(title, 480, 172);

  ctx.font = "18px Arial";
  bodyLines.forEach((line, index) => {
    ctx.fillText(line, 480, 220 + index * 28);
  });

  roundedRect(350, 316, 260, 58, 999, "#5b8566");
  strokeRoundedRect(350, 316, 260, 58, 999, "#3f3646", 4);
  ctx.fillStyle = "#f7ffdb";
  ctx.font = "bold 22px Arial";
  ctx.fillText(buttonText, 480, 353);

  if (footerText) {
    ctx.fillStyle = "#3f3646";
    ctx.font = "15px Arial";
    ctx.fillText(footerText, 480, 405);
  }

  ctx.textAlign = "left";
}

function drawTitleScreen() {
  drawOverlayBox(
    "Luka: Window Patrol",
    [
      "The garden is full of suspicious movement.",
      "Bark at people and cats. Do not bark at bees.",
      "Finish all 5 levels to prove Luka owns the window."
    ],
    "Start game",
    "Press Enter, Space or click Start / Continue"
  );
}

function drawLevelIntro() {
  const level = levels[currentLevel];
  drawOverlayBox(
    `Level ${currentLevel + 1}`,
    [
      level.name,
      level.subtitle,
      `Target: ${level.target} good barks in ${LEVEL_DURATION} seconds`
    ],
    "Begin level",
    "Press Enter, Space or click BARK"
  );
}

function drawLevelComplete() {
  drawOverlayBox(
    "Level complete!",
    [
      `Score: ${score}`,
      `Next level: ${levels[currentLevel].name}`,
      "Luka is not done supervising."
    ],
    "Continue",
    "Press Enter, Space or click Start / Continue"
  );
}

function drawPausedScreen() {
  drawOverlayBox(
    "Paused",
    [
      "Luka is still watching the window.",
      "Nothing suspicious will move while paused.",
      "Resume when you are ready."
    ],
    "Resume",
    "Press Enter, click Start / Continue or press Pause again"
  );
}

function drawGameOver() {
  drawOverlayBox(
    "Almost!",
    [
      `Score: ${score}`,
      `Target: ${levels[currentLevel].target}`,
      "Too many suspicious things passed calmly."
    ],
    "Try again",
    "Press Enter or click Restart from beginning"
  );
}

function drawWonScreen() {
  drawOverlayBox(
    "Luka wins!",
    [
      "Nobody passed calmly.",
      "The window remains under strict supervision.",
      "Final status: tiny, fluffy, unstoppable."
    ],
    "Play again",
    "Press Enter or click Restart from beginning"
  );
}

function drawScreenOverlay() {
  if (gameState === GAME_STATE.TITLE) drawTitleScreen();
  if (gameState === GAME_STATE.LEVEL_INTRO) drawLevelIntro();
  if (gameState === GAME_STATE.LEVEL_COMPLETE) drawLevelComplete();
  if (gameState === GAME_STATE.PAUSED) drawPausedScreen();
  if (gameState === GAME_STATE.GAME_OVER) drawGameOver();
  if (gameState === GAME_STATE.WON) drawWonScreen();
}

function draw() {
  drawBackground();
  drawBarkZone();
  passers.forEach(drawPasser);
  drawLuka();
  drawParticles();
  drawLevelTag();
  drawScreenOverlay();
}

startButton.addEventListener("click", startGame);
barkButton.addEventListener("click", bark);
pauseButton.addEventListener("click", () => {
  if (gameState === GAME_STATE.PAUSED) {
    resumeGame();
  } else {
    pauseGame();
  }
});
restartButton.addEventListener("click", restartFromBeginning);

soundToggle.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundToggle.textContent = soundEnabled ? "Sound: on" : "Sound: off";
  if (soundEnabled) {
    setupAudio();
    playScoreSound();
  }
});


function bindTapButton(button, handler) {
  if (!button) return;
  button.addEventListener("click", event => {
    event.preventDefault();
    handler();
  });
}

function bindHoldButton(button, direction) {
  if (!button) return;

  const startHold = event => {
    event.preventDefault();
    setupAudio();
    moveHoldDirection = direction;
    lastHeldMoveAt = 0;
    moveLuka(direction);
    button.classList.add("is-pressed");
  };

  const endHold = event => {
    if (event) event.preventDefault();
    if (moveHoldDirection === direction) {
      moveHoldDirection = 0;
    }
    button.classList.remove("is-pressed");
  };

  button.addEventListener("pointerdown", startHold);
  button.addEventListener("pointerup", endHold);
  button.addEventListener("pointercancel", endHold);
  button.addEventListener("pointerleave", endHold);
}

bindTapButton(mobileStartButton, startGame);
bindTapButton(mobilePauseButton, () => {
  if (gameState === GAME_STATE.PAUSED) {
    resumeGame();
  } else {
    pauseGame();
  }
});
bindTapButton(mobileRestartButton, restartFromBeginning);
bindTapButton(mobileBarkButton, bark);
bindHoldButton(mobileLeftButton, -1);
bindHoldButton(mobileRightButton, 1);

canvas.addEventListener("pointerdown", event => {
  const isMobileLayout = window.matchMedia("(max-width: 768px)").matches;
  if (!isMobileLayout) return;
  event.preventDefault();
  bark();
});


document.addEventListener("keydown", event => {
  if (event.code === "Space") {
    event.preventDefault();
    bark();
  }

  if (event.code === "Enter") {
    event.preventDefault();
    startGame();
  }

  if (event.code === "Escape") {
    event.preventDefault();
    if (gameState === GAME_STATE.PLAYING) {
      pauseGame();
    } else if (gameState === GAME_STATE.PAUSED) {
      resumeGame();
    }
  }

  if (event.code === "ArrowLeft") {
    event.preventDefault();
    moveLuka(-1);
  }

  if (event.code === "ArrowRight") {
    event.preventDefault();
    moveLuka(1);
  }
});

updateHud();
draw();
if (!animationStarted) {
  animationStarted = true;
  animateIdle();
}
