// ========================
// 1. 전역 상태 및 상수
// ========================

let globalPhase = 0; // 0: Heart, 1: Star, 2: Blackhole
let phase = "heart";
let switchFrame = -1;
let t = 0;
let BGCOLOR = "#010713";

// paste1 변수
let particleTexture;
let particleSystem;
let paths = [];
let currentPath = [];
let isDrawing = false;
let heartBroken = false;
let heartFragments = [];
let centerCircleAlpha = 0;
let centerCircleSize = 0;
let particles = [];

// paste2 변수 (별/초신성)
let starImg, neutronImg;
let stage = 0;
let timer = 0;
let baseSize = 150;
let currentSize = baseSize;
let growAmount = 25;
let shrinkRate = 0.8;
let currentTintG = 255;
let currentTintB = 255;
let tintDecreaseRate = 12;
let tintRecoverRate = 6;
let redGiantThreshold = 280;
let wasClicked = false;
let supernovaParticles = [];
let coreParticles = [];
let shockwaves = [];
let bgParticles = [];
let neutronBaseSize = 80;
let neutronSize = neutronBaseSize;
let neutronMaxSize = 240;
let neutronAlpha = 0;
let neutronPulsePhase = 0;
let cx, cy;

// paste3 변수 (블랙홀/손인식)
let state = {
  phase: "blackhole",
  mouseDown: false,
  dustGathered: false,
  dustPhaseStarted: false
};
const CONFIG = { dustCount: 180 };
let dustParticles = [];
let nebulaAlpha = 0;
let nebulaTimer = 0;
let heartAlpha = 0;
let heartRotation = 0;
let heartSize = 0.5;
let typewriterText = "넌 너의 기억을 믿어";
let typewriterIndex = 0;
let typewriterTimer = 0;
let blackholePos;
let blackholeR = 80;
let flashAlpha = 0;
let heartImg;
let finalHeartImg; // 마지막 하트 이미지 추가
let nebulaFlashAlpha = 0;

// MediaPipe Hands 변수
let videoElement;
let hands;
let camera;
let isFist = false;
let lastFist = false;
let handDetected = false;
let isMediaPipeReady = false;
let mediaPipeError = false;
let fistDebugInfo = {
  angles: false,
  distances: false,
  keyPoints: false,
  confidence: 0
};

// ========================
// 2. preload()
// ========================
function preload() {
  particleTexture = loadImage('assets/particle_texture_32.png');
  heartImg = loadImage('assets/AnT_heart_white.png');
  finalHeartImg = loadImage('f5zhlg8oaqzpqfcctux8.png'); // 마지막 하트 이미지 로드
  starImg    = loadImage('assets/sirius.png');
  neutronImg = loadImage('assets/neutron.png');
}

// ========================
// 3. setup()
// ========================
function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(RGB, 255);
  t = 0;
  generateParticles();
  particleSystem = new ParticleSystem(
    0,
    createVector(width / 2, height - 60),
    particleTexture
  );
  cx = width / 2;
  cy = height / 2;
  for (let i = 0; i < 350; i++) {
    bgParticles.push({
      x: random(width),
      y: random(height),
      size: random(1, 6),
      phase: random(TWO_PI),
      noiseX: random(1000),
      noiseY: random(2000),
      r: random(120, 180),
      g: random(80, 120),
      b: random(200, 255),
      alpha: random(30, 80)
    });
  }
  blackholePos = createVector(width / 2, height / 2);
  initializeMediaPipe();
}

// ========================
// 4. draw() - 메인 루프
// ========================
function draw() {
  background(BGCOLOR);

  if (globalPhase === 0) {
    drawHeartScene();
    if (heartBroken && switchFrame > 0 && frameCount >= switchFrame) {
      globalPhase = 1;
      phase = "star";
      stage = 0;
    }
  } else if (globalPhase === 1) {
    drawStarSupernovaScene();
    if (stage === 3 && timer > 240) {
      globalPhase = 2;
      state.phase = "blackhole";
    }
  } else if (globalPhase === 2) {
    drawBlackholeMain();
  }
}

// ========================
// 5. paste1: 하트 씬
// ========================
function drawHeartScene() {
  if (heartBroken) {
    drawCenterCircle();
    updateAndDrawHeartFragments();
  } else {
    drawHeart(width / 2, height / 2, 400);
  }

  if (!heartBroken) {
    stroke(BGCOLOR);
    noFill();
    strokeWeight(4);
    for (let path of paths) {
      beginShape();
      for (let v of path) vertex(v.x, v.y);
      endShape();
    }
  }
  if (isDrawing) {
    beginShape();
    for (let v of currentPath) vertex(v.x, v.y);
    endShape();
  }

  particleSystem.origin = createVector(mouseX, mouseY);
  particleSystem.run();
  for (let i = 0; i < 2; i++) {
    particleSystem.addParticle();
  }
}

function drawHeart(x, y, s) {
  imageMode(CENTER);
  noTint();
  let floatOffset = sin(frameCount * 0.03) * 10;
  let aspect = heartImg.width / heartImg.height;
  let w = s;
  let h = s / aspect;
  image(heartImg, x, y + floatOffset, w * 2, h * 2);
}

function drawCenterCircle() {
  if (centerCircleAlpha < 255) centerCircleAlpha += 4;
  if (centerCircleSize < 140) centerCircleSize += 3;
  push();
  noStroke();
  fill(255, centerCircleAlpha);
  ellipse(width / 2, height / 2, centerCircleSize);
  pop();
}

function updateAndDrawHeartFragments() {
  for (let frag of heartFragments) {
    frag.pos.add(frag.velocity);
    frag.alpha -= 3;
    fill(255, frag.alpha);
    noStroke();
    ellipse(frag.pos.x, frag.pos.y, frag.size);
  }
}

function breakHeartIntoFragments(x, y, s, numFragments = 30) {
  heartFragments = [];
  for (let i = 0; i < numFragments; i++) {
    let angle = random(TWO_PI);
    let radius = random(s / 2);
    let pos = createVector(x + cos(angle) * radius, y + sin(angle) * radius);
    let velocity = p5.Vector.fromAngle(angle).mult(random(2, 5));
    heartFragments.push({
      pos: pos,
      velocity: velocity,
      size: random(5, 20),
      alpha: 255
    });
  }
}

function generateParticles() {
  particles = [];
  for (let i = 0; i < 60; i++) {
    particles.push({
      x: random(width),
      y: random(height),
      size: random(1, 4)
    });
  }
}

// ========================
// 6. paste2: 별/초신성/잔해 씬
// ========================
function drawStarSupernovaScene() {
  drawRadialGradient(10, 10, 40, 0, 0, 20);
  drawDreamyBackground();

  if (stage === 0) {
    drawInteractiveStage();
    checkRedGiantThreshold();
  } else if (stage === 2) {
    drawHighQualitySupernova();
  } else if (stage === 3) {
    drawHighQualityRemnant();
  }
}

function drawRadialGradient(r1, g1, b1, r2, g2, b2) {
  let steps = 50;
  for (let i = steps; i > 0; i--) {
    let inter = i / steps;
    let r = lerp(r1, r2, inter);
    let g = lerp(g1, g2, inter);
    let b = lerp(b1, b2, inter);
    noStroke();
    fill(r, g, b);
    ellipse(cx, cy, width * inter, height * inter);
  }
}

function drawDreamyBackground() {
  noStroke();
  for (let p of bgParticles) {
    p.noiseX += 0.002;
    p.noiseY += 0.002;
    p.x = noise(p.noiseX, p.noiseY) * width;
    p.y = noise(p.noiseY, p.noiseX) * height;
    let flicker = map(sin(frameCount * 0.008 + p.phase), -1, 1, 0.2, 1);
    fill(p.r, p.g, p.b, p.alpha * flicker * 0.6);
    ellipse(p.x, p.y, p.size * flicker);
  }
}

function drawInteractiveStage() {
  if (wasClicked) {
    currentSize += growAmount;
    currentTintG = max(0, currentTintG - tintDecreaseRate);
    currentTintB = max(0, currentTintB - tintDecreaseRate);
    wasClicked = false;
  } else {
    currentSize = max(baseSize, currentSize - shrinkRate);
    currentTintG = min(255, currentTintG + tintRecoverRate);
    currentTintB = min(255, currentTintB + tintRecoverRate);
  }
  currentSize = constrain(currentSize, baseSize, 600);
  drawStarAura(cx, cy, currentSize);

  push();
  translate(cx, cy);
  rotate(sin(frameCount * 0.5) * 2);
  tint(255, currentTintG, currentTintB, 255);
  image(starImg, 0, 0, currentSize, currentSize);
  noTint();
  pop();

  fill(255);
  text("Click the star", cx, height - 20);
}

function drawStarAura(x, y, size) {
  let t = frameCount * 0.02;
  let sides = 100;
  for (let layer = 0; layer < 3; layer++) {
    let alpha = map(layer, 0, 2, 80, 30);
    let weight = map(layer, 0, 2, 2, 0.8);
    strokeWeight(weight);
    let c1 = color(160, 220, 255, 0);
    let c2 = color(200, 120, 255, 0);
    let lerpFactor = layer / 2;
    let baseCol = lerpColor(c1, c2, lerpFactor);
    baseCol.setAlpha(alpha);
    stroke(baseCol);

    noFill();
    beginShape();
    for (let i = 0; i < sides; i++) {
      let angle = map(i, 0, sides, 0, 360);
      let noiseVal = noise(cos(radians(angle)) * 0.01 + t, sin(radians(angle)) * 0.01 + t, layer * 10);
      let radius = size * 0.6 + layer * 8 + noiseVal * 30;
      let vx = x + cos(angle) * radius;
      let vy = y + sin(angle) * radius;
      vertex(vx, vy);
    }
    endShape(CLOSE);
  }
}

function checkRedGiantThreshold() {
  if (currentSize >= redGiantThreshold) {
    stage = 2;
    timer = 0;
    for (let i = 0; i < 150; i++) coreParticles.push(new CoreParticle(cx, cy));
    for (let i = 0; i < 800; i++) supernovaParticles.push(new SupernovaParticle(cx, cy));
    shockwaves.push(new Shockwave(cx, cy));
  }
}

function drawHighQualitySupernova() {
  timer++;
  if (timer < 20) {
    blendMode(ADD);
    let alpha = map(timer, 0, 20, 0, 200);
    fill(255, 255, 240, alpha);
    ellipse(cx, cy, 550 + timer * 100);
    blendMode(BLEND);
  }
  for (let sw of shockwaves) { sw.update(); sw.show(); }
  for (let p of coreParticles) { p.update(); p.show(); }
  for (let p of supernovaParticles) { p.update(); p.show(); }
  fill(10, 10, 20, 20);
  rect(0, 0, width, height);
  if (timer > 180) { stage = 3; timer = 0; }
}

function drawHighQualityRemnant() {
  timer++;
  neutronAlpha = min(255, neutronAlpha + 1.5);
  neutronSize = min(neutronMaxSize, neutronSize + 0.12);
  neutronPulsePhase += 0.015;
  let pulseOffset = sin(neutronPulsePhase) * 12;
  for (let i = 0; i < 4; i++) {
    let d = neutronSize + i * 50 + pulseOffset;
    let alpha = map(i, 0, 3, 140, 50) * (neutronAlpha / 255);
    noFill();
    stroke(200, 220, 255, alpha);
    strokeWeight(2 + i * 0.5);
    ellipse(cx, cy, d, d);
  }
  noStroke();
  push();
  translate(cx, cy);
  rotate(timer * 0.8);
  tint(255, 255, 255, neutronAlpha);
  image(neutronImg, 0, 0, neutronSize + pulseOffset * 0.3, neutronSize + pulseOffset * 0.3);
  noTint();
  pop();
  for (let p of supernovaParticles) {
    let dx = cx - p.pos.x;
    let dy = cy - p.pos.y;
    let dist = sqrt(dx * dx + dy * dy);
    if (dist > 5 && p.alpha > 0) {
      let force = map(dist, 0, width / 2, 0.06, 0.002);
      p.pos.x += (dx / dist) * force * 6;
      p.pos.y += (dy / dist) * force * 6;
    }
  }
  for (let p of bgParticles) {
    let dx = cx - p.x;
    let dy = cy - p.y;
    let dist = sqrt(dx * dx + dy * dy);
    if (dist > 5) {
      let force = map(dist, 0, width / 2, 0.06, 0.002);
      p.x += (dx / dist) * force * 6;
      p.y += (dy / dist) * force * 6;
    }
  }
}

// ========================
// 7. paste3: 블랙홀/손인식/네뷸라/엔딩
// ========================
function drawBlackholeMain() {
  if (state.phase === "blackhole" && !state.dustPhaseStarted) {
    if (isFist && !lastFist) {
      createDustParticles();
      state.phase = "dust";
    }
    lastFist = isFist;
  }

  switch (state.phase) {
    case "blackhole": drawBlackholeCommon(); break;
    case "dust":      drawDustPhase(); break;
    case "nebula":    drawNebulaPhase(); break;
    case "heart":     drawPrettyHeartPhase(); break;
    case "flash":     drawFlashPhase(); break;
    case "black":     drawTypewriterPhase(); break;
    case "ending":    drawEnding(); break;
  }
  drawDebugInfo();
}

function drawBlackholeCommon() {
  background(16, 18, 22, 255);
  push();
  translate(width / 2, height / 2);
  for (let i = 0; i < 38; i++) {
    let r = 140 + i * 7;
    let a1 = random(TWO_PI);
    let a2 = a1 + random(PI / 2, PI);
    stroke(60, 70, 100, 60 - i * 1.2);
    strokeWeight(16 - i * 0.4);
    noFill();
    arc(0, 0, r, r, a1, a2);
  }
  pop();
  for (let i = 0; i < 8; i++) {
    fill(0, 0, 0, 150 - i * 16);
    ellipse(width / 2, height / 2, 180 - i * 10, 180 - i * 10);
  }
  t += 0.02;
}

function drawDustPhase() {
  drawBlackholeCommon();
  updateAndDrawDust();
  if (state.dustGathered) {
    state.phase = "nebula";
    nebulaAlpha = 0;
    nebulaTimer = 0;
    nebulaFlashAlpha = 1;
  }
}

function drawNebulaPhase() {
  drawNebula(nebulaAlpha);
  nebulaAlpha = min(nebulaAlpha + 0.01, 1);
  nebulaTimer++;
  if (nebulaFlashAlpha > 0) {
    noStroke();
    fill(255, 255, 255, 255 * nebulaFlashAlpha);
    rect(0, 0, width, height);
    nebulaFlashAlpha -= 0.28;
    if (nebulaFlashAlpha < 0) nebulaFlashAlpha = 0;
  }
  if (nebulaTimer > 60 * 1.67) {
    state.phase = "heart";
    heartAlpha = 0;
    heartRotation = 0;
    heartSize = 0.5;
  }
}

function drawPrettyHeartPhase() {
  background(8, 10, 24);
  let fade = min(heartAlpha + 0.016, 1);
  heartAlpha = fade;
  let maxRotation = TWO_PI * 1;
  heartRotation = min(heartRotation + 7.5, maxRotation);
  let maxHeartSize = min(width, height) * 0.7;
  heartSize = map(fade, 0, 1, 1.0, maxHeartSize);
  // 마지막 하트만 다른 이미지로 출력
  drawPrettyHeart(width / 2, height / 2, heartSize, fade, heartRotation, finalHeartImg);
  if (heartSize > maxHeartSize * 0.75 && heartRotation >= maxRotation * 0.9) {
    state.phase = "flash";
    flashAlpha = 0;
  }
}

// heartImg를 파라미터로 받도록 수정
function drawPrettyHeart(cx, cy, size, alpha, rotation, img) {
  if (typeof alpha === 'undefined') alpha = 1;
  if (typeof rotation === 'undefined') rotation = 0;
  if (!img) img = heartImg; // 기본값
  push();
  translate(cx, cy);
  rotate(-rotation);
  push();
  translate(3, 6);
  tint(0, 0, 0, 30 * alpha);
  image(img, -size / 2, -size / 2, size * 1.1, size * 1.1);
  pop();
  push();
  tint(255, 255, 255, 255 * alpha);
  image(img, -size / 2, -size / 2, size, size);
  pop();
  pop();
}

function drawFlashPhase() {
  flashAlpha += 0.02;
  background(255, 255, 255, flashAlpha * 255);
  if (flashAlpha >= 1) {
    state.phase = "black";
    typewriterIndex = 0;
    typewriterTimer = 0;
  }
}

function drawTypewriterPhase() {
  background(0);
  typewriterTimer++;
  if (typewriterTimer > 30 && typewriterIndex < typewriterText.length) {
    typewriterIndex++;
    typewriterTimer = 0;
  }
  if (typewriterIndex > 0) {
    let displayText = typewriterText.substring(0, typewriterIndex);
    fill(255, 255, 255, 200);
    textAlign(CENTER, CENTER);
    textSize(48);
    text(displayText, width / 2, height / 2);
    if (typewriterIndex < typewriterText.length && frameCount % 30 < 15) {
      text("_", width / 2 + textWidth(displayText) / 2 + 10, height / 2);
    }
  }
  if (typewriterIndex >= typewriterText.length && typewriterTimer > 180) {
    state.phase = "ending";
  }
}

function drawEnding() {

}

function drawNebula(alpha) {
  if (typeof alpha === 'undefined') alpha = 1;
  background(8, 10, 24, 255 * alpha);
  push();
  translate(width / 2, height / 2);
  for (let i = 0; i < 60; i++) {
    let r = map(i, 0, 60, 60, 350);
    let a = map(i, 0, 60, 0, TWO_PI * 2) + frameCount * 0.002;
    let x = cos(a) * r * random(0.95, 1.05);
    let y = sin(a) * r * random(0.95, 1.05);
    let c = lerpColor(color(110, 70, 180, 12 * alpha), color(80, 120, 255, 19 * alpha), i / 60.0);
    fill(c);
    ellipse(x, y, map(i, 0, 60, 120, 10) * random(0.8, 1.2));
  }
  for (let i = 0; i < 30; i++) {
    fill(180, 120, 255, 24 * alpha * (1 - i / 30));
    ellipse(0, 0, 180 - i * 3);
  }
  pop();
}

function createDustParticles() {
  dustParticles = [];
  let maxRadius = min(width, height) * 0.48;
  for (let i = 0; i < CONFIG.dustCount; i++) {
    let angle = random(TWO_PI);
    let radius = random(blackholeR * 2.2, maxRadius);
    let pos = createVector(width / 2 + cos(angle) * radius, height / 2 + sin(angle) * radius);
    let vel = createVector(random(-1, 1), random(-1, 1)).mult(random(0.5, 1.2));
    let c = color(180 + random(60), 180 + random(60), 255, random(90, 200));
    dustParticles.push({
      pos: pos,
      vel: vel,
      baseColor: c,
      size: random(2, 7),
      gathered: false
    });
  }
  state.dustGathered = false;
  state.dustPhaseStarted = true;
}

function updateAndDrawDust() {
  let allIn = true;
  for (let d of dustParticles) {
    let mouse = createVector(mouseX, mouseY);
    let distMouse = dist(d.pos.x, d.pos.y, mouseX, mouseY);
    if (mouseIsPressed && distMouse < 60) {
      let repel = p5.Vector.sub(d.pos, mouse).setMag(2.5);
      d.vel.add(repel);
    }
    let toCenter = p5.Vector.sub(blackholePos, d.pos);
    let distToCenter = toCenter.mag();
    let grav = toCenter.copy().setMag(map(distToCenter, 0, width / 2, 0.07 * 4, 0.45 * 4/120));
    d.vel.add(grav);
    d.vel.mult(0.97);
    d.pos.add(d.vel);
    fill(d.baseColor);
    ellipse(d.pos.x, d.pos.y, d.size + random(-0.5, 0.5));
    if (distToCenter > blackholeR * 1.2) allIn = false;
  }
  if (allIn && state.dustPhaseStarted) {
    state.dustGathered = true;
    state.dustPhaseStarted = false;
  }
}

function drawDebugInfo() {
  fill(255, 220);
  textAlign(LEFT, TOP);
  textSize(16);
  text(`손 감지: ${handDetected ? "✅" : "❌"}`, 20, 20);
  text(`주먹: ${isFist ? "✊" : "✋"} (${(fistDebugInfo.confidence * 100).toFixed(0)}%)`, 20, 45);
  text(`단계: ${state.phase}`, 20, 70);
  if (handDetected) {
    textSize(12);
    fill(200, 200, 255, 180);
    text(`각도: ${fistDebugInfo.angles ? "✓" : "✗"}  거리: ${fistDebugInfo.distances ? "✓" : "✗"}  핵심점: ${fistDebugInfo.keyPoints ? "✓" : "✗"}`, 20, 95);
  }
  if (state.phase === "blackhole") {
    fill(255, 255, 0, 200);
    text("👆 주먹을 쥐어서 시작하세요!", 20, 120);
    fill(200, 200, 200, 180);
    textSize(14);
    text("또는 마우스 클릭 / 'p' 키", 20, 145);
  }
}

// ========================
// 8. MediaPipe Hands
// ========================
async function initializeMediaPipe() {
  try {
    videoElement = createCapture(VIDEO);
    videoElement.size(640, 480);
    videoElement.hide();
    hands = new Hands({
      locateFile: function(file) {
        return 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/' + file;
      }
    });
    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.6
    });
    hands.onResults(onHandsResults);
    camera = new Camera(videoElement.elt, {
      onFrame: async function() {
        try {
          if (!mediaPipeError) {
            await hands.send({image: videoElement.elt});
          }
        } catch (error) {
          mediaPipeError = true;
        }
      },
      width: 640,
      height: 480
    });
    await camera.start();
    isMediaPipeReady = true;
  } catch (error) {
    mediaPipeError = true;
  }
}

function onHandsResults(results) {
  try {
    if (mediaPipeError) return;
    handDetected = results.multiHandLandmarks && results.multiHandLandmarks.length > 0;
    isFist = false;
    if (handDetected) {
      const landmarks = results.multiHandLandmarks[0];
      isFist = detectFist(landmarks);
    } else {
      fistDebugInfo = {
        angles: false,
        distances: false,
        keyPoints: false,
        confidence: 0
      };
    }
  } catch (error) {}
}

function detectFist(landmarks) {
  const angleResult = detectFistByAngles(landmarks);
  const distanceResult = detectFistByDistances(landmarks);
  const keyPointResult = detectFistByKeyPoints(landmarks);
  const confidence = (angleResult ? 0.5 : 0) +
                     (distanceResult ? 0.3 : 0) +
                     (keyPointResult ? 0.2 : 0);
  fistDebugInfo = {
    angles: angleResult,
    distances: distanceResult,
    keyPoints: keyPointResult,
    confidence: confidence
  };
  return confidence >= 0.5;
}
function detectFistByAngles(landmarks) {
  let closedFingers = 0;
  const fingerStates = {
    thumb: isFingerClosed(landmarks, [1, 2, 3, 4]),
    index: isFingerClosed(landmarks, [5, 6, 7, 8]),
    middle: isFingerClosed(landmarks, [9, 10, 11, 12]),
    ring: isFingerClosed(landmarks, [13, 14, 15, 16]),
    pinky: isFingerClosed(landmarks, [17, 18, 19, 20])
  };
  Object.values(fingerStates).forEach(isClosed => {
    if (isClosed) closedFingers++;
  });
  return closedFingers >= 4;
}
function isFingerClosed(landmarks, joints) {
  if (joints.length !== 4) return false;
  const [mcp, pip, dip, tip] = joints.map(i => landmarks[i]);
  const vector1 = { x: pip.x - mcp.x, y: pip.y - mcp.y };
  const vector2 = { x: tip.x - dip.x, y: tip.y - dip.y };
  const dotProduct = vector1.x * vector2.x + vector1.y * vector2.y;
  const magnitude1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y);
  const magnitude2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y);
  if (magnitude1 === 0 || magnitude2 === 0) return false;
  const cosAngle = dotProduct / (magnitude1 * magnitude2);
  const angle = Math.acos(Math.max(-1, Math.min(1, cosAngle))) * (180 / Math.PI);
  const threshold = joints[0] === 4 ? 165 : 150;
  return angle < threshold;
}
function detectFistByDistances(landmarks) {
  const thumb_mcp = landmarks[1];
  const pinky_mcp = landmarks[17];
  const palmSize = Math.sqrt(
    Math.pow(thumb_mcp.x - pinky_mcp.x, 2) + 
    Math.pow(thumb_mcp.y - pinky_mcp.y, 2)
  );
  if (palmSize === 0) return false;
  let closedFingers = 0;
  const fingerTips = [4, 8, 12, 16, 20];
  const fingerMCPs = [1, 5, 9, 13, 17];
  for (let i = 0; i < fingerTips.length; i++) {
    const tip = landmarks[fingerTips[i]];
    const mcp = landmarks[fingerMCPs[i]];
    const distance = Math.sqrt(
      Math.pow(tip.x - mcp.x, 2) + 
      Math.pow(tip.y - mcp.y, 2)
    ) / palmSize;
    const threshold = i === 0 ? 0.8 : 0.6;
    if (distance < threshold) closedFingers++;
  }
  return closedFingers >= 4;
}
function detectFistByKeyPoints(landmarks) {
  const palmSize = Math.sqrt(
    Math.pow(landmarks[0].x - landmarks[17].x, 2) + 
    Math.pow(landmarks[0].y - landmarks[17].y, 2)
  );
  let fistIndicator = 0;
  [8, 12, 16, 20].forEach(tipIdx => {
    const tip = landmarks[tipIdx];
    const palm = landmarks[0];
    const normalizedDistance = Math.sqrt(
      Math.pow(tip.x - palm.x, 2) + 
      Math.pow(tip.y - palm.y, 2)
    ) / palmSize;
    if (normalizedDistance < 1.2) fistIndicator++;
  });
  return fistIndicator >= 3;
}

// ========================
// 9. 입력 처리
// ========================
function mousePressed() {
  if (globalPhase === 0) {
    currentPath = [];
    isDrawing = true;
  } else if (globalPhase === 1) {
    if (stage === 0) wasClicked = true;
  } else if (globalPhase === 2) {
    if (state.phase === "blackhole" && !state.dustPhaseStarted) {
      createDustParticles();
      state.phase = "dust";
    } else {
      state.mouseDown = true;
    }
  }
}
function mouseDragged() {
  if (globalPhase === 0 && isDrawing) {
    currentPath.push(createVector(mouseX, mouseY));
  }
  if (globalPhase === 1 && stage === 3) {
    for (let p of supernovaParticles) {
      let d = dist(mouseX, mouseY, p.pos.x, p.pos.y);
      if (d < 20) {
        p.pos.x = mouseX;
        p.pos.y = mouseY;
        p.alpha = 255;
      }
    }
    for (let p of bgParticles) {
      let d = dist(mouseX, mouseY, p.x, p.y);
      if (d < 15) {
        p.x = mouseX;
        p.y = mouseY;
      }
    }
  }
}
function mouseReleased() {
  if (globalPhase === 0) {
    isDrawing = false;
    if (currentPath.length > 0) {
      paths.push(currentPath);
    }
    if (!heartBroken && paths.length >= 5) {
      heartBroken = true;
      breakHeartIntoFragments(width / 2, height / 2, 400);
      switchFrame = frameCount + 120;
    }
  } else if (globalPhase === 2) {
    state.mouseDown = false;
  }
}
function keyPressed() {
  if (globalPhase === 2) {
    if (state.phase === "blackhole" && key === 'p') {
      createDustParticles();
      state.phase = "dust";
    }
  }
}
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  blackholePos = createVector(width / 2, height / 2);
  cx = width / 2;
  cy = height / 2;
}

// ========================
// 10. 클래스 정의 (paste1, paste2)
// ========================
class ParticleSystem {
  constructor(particleCount, origin, textureImage) {
    this.particles = [];
    this.origin = origin.copy();
    this.img = textureImage;
    for (let i = 0; i < particleCount; ++i) {
      this.particles.push(new Particle(this.origin, this.img));
    }
  }
  run() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      let particle = this.particles[i];
      particle.run();
      if (particle.isDead()) {
        this.particles.splice(i, 1);
      }
    }
  }
  addParticle() {
    this.particles.push(new Particle(this.origin, this.img));
  }
}
class Particle {
  constructor(pos, imageTexture) {
    this.loc = pos.copy();
    this.velocity = createVector(randomGaussian() * 0.3, randomGaussian() * 0.3 - 1.0);
    this.acceleration = createVector();
    this.lifespan = 100.0;
    this.texture = imageTexture;
    this.color = color(frameCount % 256, 255, 255);
  }
  run() {
    this.update();
    this.render();
  }
  update() {
    this.velocity.add(this.acceleration);
    this.loc.add(this.velocity);
    this.lifespan -= 2.0;
    this.acceleration.mult(0);
  }
  render() {
    imageMode(CENTER);
    tint(this.color, this.lifespan);
    image(this.texture, this.loc.x, this.loc.y);
  }
  isDead() {
    return this.lifespan <= 0.0;
  }
}
class CoreParticle {
  constructor(x, y) {
    this.pos = createVector(x, y);
    let angle = random(360);
    let speed = random(10, 30);
    this.vel = p5.Vector.fromAngle(angle).mult(speed);
    this.size = random(15, 50);
    this.alpha = random(180, 255);
    this.col = color(255, random(200, 255), 150, this.alpha);
  }
  update() {
    this.pos.add(this.vel);
    this.size *= 0.92;
    this.alpha -= 5;
  }
  show() {
    if (this.alpha <= 0) return;
    noStroke();
    fill(red(this.col), green(this.col), blue(this.col), this.alpha);
    ellipse(this.pos.x, this.pos.y, this.size);
  }
}
class SupernovaParticle {
  constructor(x, y) {
    this.pos = createVector(x, y);
    let angle = random(360);
    let speed = random(6, 22);
    this.vel = p5.Vector.fromAngle(angle).mult(speed);
    this.size = random(10, 40);
    this.alpha = random(220, 255);
    this.hue = random(240, 300);
    this.sat = random(70, 100);
    this.light = random(50, 80);
    this.history = [];
  }
  update() {
    let angleOffset = noise(
      this.pos.x * 0.005,
      this.pos.y * 0.005,
      frameCount * 0.005
    ) - 0.5;
    let perp = this.vel.copy().rotate(90).setMag(angleOffset * 3);
    this.vel.add(perp);
    this.pos.add(this.vel.mult(0.7));
    this.size *= 0.94;
    this.alpha -= 2.5;
    this.history.push(this.pos.copy());
    if (this.history.length > 8) this.history.shift();
  }
  show() {
    if (this.alpha <= 0) return;
    colorMode(HSL, 360, 100, 100, 255);
    noFill();
    stroke(this.hue, this.sat, this.light, this.alpha * 0.4);
    strokeWeight(this.size * 0.25);
    beginShape();
    for (let v of this.history) vertex(v.x, v.y);
    endShape();
    noStroke();
    fill(this.hue, this.sat, this.light, this.alpha);
    ellipse(this.pos.x, this.pos.y, this.size);
    colorMode(RGB, 255);
  }
}
class Shockwave {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 50;
    this.alpha = 200;
    this.thickness = 3;
  }
  update() {
    this.radius += 25;
    this.alpha -= 5;
    this.thickness *= 0.98;
  }
  show() {
    if (this.alpha > 0) {
      blendMode(ADD);
      noFill();
      stroke(255, 240, 220, this.alpha);
      strokeWeight(this.thickness);
      ellipse(this.x, this.y, this.radius, this.radius);
      blendMode(BLEND);
    }
  }
}
