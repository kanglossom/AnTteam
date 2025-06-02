// 전역 변수 선언
// 전체 프로그램 단계 관리
let programPhase = "intro"; // "intro", "main", "ending"
let introTimer = 0;
let endingStarted = false;

// 111.txt 관련 변수 (하트 깨짐 및 파티클 시스템)
let particleTexture;
let particleSystem;
let BGCOLOR = "#010713";
let paths = [];
let currentPath = [];
let isDrawing = false;
let heartBroken = false;
let heartFragments = [];

// 222.txt 관련 변수 (별의 생애주기 및 블랙홀 이후 단계)
let starPhase = "intact";
let cracks = [];
let particles = [];
let starExplosionParticles = [];
let t = 0;
let starExplosionProgress = 0;
let phase = "heartBreak"; // 메인 프로그램 내 단계
let flashAlpha = 255;
let explosionCenter;
let explosionParticles = [];
let explosionDuration = 180;
let explosionFrame = 0;
let neutronFrame = 0;
let neutronDuration = 120;
let mouseDown = false;
let shakeTime = 0;
let shakeMag = 0;
let blackholeReveal = 0;
let blackholeFlashAlpha = 0;
let neutronShaking = false;
let debris = [];
let dustParticles = [];
let dustCount = 180;
let dustGathered = false;
let dustPhaseStarted = false;
let nebulaAlpha = 0;
let nebulaTimer = 0;
let heartAlpha = 0;
let heartRotation = 0;
let heartSize = 0.5;
let typewriterText = "넌 너의 기억을 믿어?";
let typewriterIndex = 0;
let typewriterTimer = 0;
let blackholePos;
let blackholeR = 80;
let initialDebrisCount = 110;
let blackholeDebrisCount = 60;

function preload() {
  // particleTexture = loadImage('assets/particle_texture_32.png');
}

function setup() {
  createCanvas(768, 768);
  colorMode(HSB);

  // 111.txt 초기화
  particleSystem = new ParticleSystem(0, createVector(width / 2, height - 60), particleTexture);

  // 222.txt 초기화
  blackholePos = createVector(width / 2, height / 2);
  generateCracks();
  generateParticles();
  explosionCenter = createVector(width / 2, height / 2);
  
  for (let i = 0; i < initialDebrisCount; i++) {
    let angle = random(TWO_PI);
    let radius = random(20, 60);
    let pos = explosionCenter.copy().add(p5.Vector.fromAngle(angle).mult(radius));
    let speed = random(5, 10);
    let dir = p5.Vector.fromAngle(angle).mult(speed);
    debris.push({
      pos: pos.copy(),
      vel: dir,
      angle: angle,
      speed: speed,
      size: random(18, 28),
      rot: random(TWO_PI),
      rotSpeed: random(-0.03, 0.03),
      color: color(255, random(120, 180), 0, 220)
    });
  }
  
  for (let i = 0; i < 180; i++) {
    let angle = random(TWO_PI);
    let speed = random(3, 8);
    explosionParticles.push({
      pos: explosionCenter.copy(),
      vel: p5.Vector.fromAngle(angle).mult(speed),
      alpha: random(180, 255),
      size: random(5, 18),
      color: color(255, random(180, 220), random(60, 120), 200)
    });
  }
}

function draw() {
  if (programPhase === "intro") {
    drawIntro();
  } else if (programPhase === "main") {
    drawMainProgram();
  } else if (programPhase === "ending") {
    drawEnding();
  }
}

// 처음.txt (ceoeum.txt) 내용 - 4초간 표시
function drawIntro() {
  background(0);
  
  fill(255);
  textAlign(CENTER, CENTER);
  
  textSize(48);
  text("기억의 재구성", width / 2, height / 2 - 30);
  
  textSize(24);
  text("석준혁, 조현빈, 최효우", width / 2, height / 2 + 30);
  
  introTimer++;
  if (introTimer > 60 * 4) { // 4초 후
    programPhase = "main";
    colorMode(HSB); // 메인 프로그램용 색상 모드
  }
}

// 메인 프로그램 (통합된 111.txt + 222.txt)
function drawMainProgram() {
  if (phase === "heartBreak") {
    background(BGCOLOR);

    if (heartBroken) {
      updateAndDrawHeartFragments();
    } else {
      drawHeart(width / 2, height / 2, 400);
    }

    stroke(BGCOLOR);
    noFill();
    strokeWeight(4);
    for (let path of paths) {
      beginShape();
      for (let v of path) vertex(v.x, v.y);
      endShape();
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

    if (heartBroken && heartFragments.length > 0 && heartFragments[0].alpha < 10) {
      phase = "star";
      colorMode(RGB, 255);
    }
  } else if (phase === "star") {
    background(8, 0, 0);
    push();
    translate(width / 2, height / 2 - 40);
    if (starPhase === "intact") {
      drawStar();
    } else if (starPhase === "exploding" || starPhase === "exploded") {
      drawStarExplosion();
      if (starPhase === "exploding") {
        starExplosionProgress += 0.005;
        if (starExplosionProgress >= 1) {
          starExplosionProgress = 1;
          starPhase = "exploded";
          phase = "explosion";
        }
      }
    }
    pop();
    t += 0.011;
  } else if (phase === "explosion") {
    drawExplosion();
  } else if (phase === "neutron") {
    drawNeutronPhase();
  } else if (phase === "collapse") {
    drawCollapse();
  } else if (phase === "blackhole_flash") {
    drawBlackholeFlash();
  } else if (phase === "blackhole") {
    drawBlackholeCommon();
  } else if (phase === "dust") {
    drawBlackholeCommon();
    updateAndDrawDust();
    if (dustGathered) {
      phase = "nebula";
      nebulaAlpha = 0;
      nebulaTimer = 0;
    }
  } else if (phase === "nebula") {
    drawNebula(nebulaAlpha);
    nebulaAlpha = min(nebulaAlpha + 0.01, 1);
    nebulaTimer++;
    if (nebulaTimer > 60 * 1.67) {
      phase = "heart";
      heartAlpha = 0;
      heartRotation = 0;
      heartSize = 0.5;
    }
  } else if (phase === "heart") {
    background(8, 10, 24);
    let fade = min(heartAlpha + 0.008, 1);
    heartAlpha = fade;

    let maxRotation = TWO_PI * 1;
    heartRotation = min(heartRotation + 0.04, maxRotation);

    heartSize = map(fade, 0, 1, 0.5, 80);

    drawPrettyHeart(width / 2, height / 2, heartSize, fade, heartRotation);

    if (heartSize > 60 && heartRotation >= maxRotation * 0.9) {
      phase = "flash";
      flashAlpha = 0;
    }
  } else if (phase === "flash") {
    flashAlpha += 0.02;
    background(255, 255, 255, flashAlpha * 255);

    if (flashAlpha >= 1) {
      phase = "black";
      typewriterIndex = 0;
      typewriterTimer = 0;
    }
  } else if (phase === "black") {
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
    
    // 타이핑이 끝나고 3초 후 엔딩으로 전환
    if (typewriterIndex >= typewriterText.length && typewriterTimer > 180) {
      programPhase = "ending";
      colorMode(RGB, 255); // 엔딩용 색상 모드
    }
  }
}

// 마지막.txt (majimag.txt) 내용
function drawEnding() {
  background(0);
  
  fill(255);
  textAlign(LEFT, TOP);
  textSize(16);
  
  let margin = 50;
  let lineHeight = 25;
  let currentY = 80;
  
  // 첫 번째 줄
  let text1 = "석준혁 : 프로세싱을 통해 이렇게 추상적인 주제로 짧은 미디어 아트를 만들 수 있어서 감명 깊었다.";
  let text1_2 = "특히 AI를 통해 코딩에 있어서 큰 도움을 얻을 수 있어서 좋았다.";
  
  text(text1, margin, currentY, width - margin * 2);
  currentY += lineHeight;
  text(text1_2, margin, currentY, width - margin * 2);
  currentY += lineHeight * 2;
  
  // 두 번째 줄
  let text2 = "조현빈 : 처음에 이 프로젝트를 시작할때에는 우리가 과연 1분 가까이 되는 미디어 아트를";
  let text2_2 = "만들어낼 수 있을까 하는 의문이 들었다. 그러나 우리가 만들고자 하는 작품의 방향성을";
  let text2_3 = "정확하게 수립한 후, AI에게 학습을 시켜 우리가 원하고자 하는 작품을 출력하게 한다면,";
  let text2_4 = "이정도 수준의 작품을 만드는 데는 어려움이 없는 수준까지 AI가 발전했다는 것을";
  let text2_5 = "다시금 느낄 수 있었다.";
  
  text(text2, margin, currentY, width - margin * 2);
  currentY += lineHeight;
  text(text2_2, margin, currentY, width - margin * 2);
  currentY += lineHeight;
  text(text2_3, margin, currentY, width - margin * 2);
  currentY += lineHeight;
  text(text2_4, margin, currentY, width - margin * 2);
  currentY += lineHeight;
  text(text2_5, margin, currentY, width - margin * 2);
  currentY += lineHeight * 2;
  
  // 세 번째 줄
  let text3 = "최효우 : 우리가 이러한 AI를 잘 사용하려면, 전반적인 코드의 흐름을 파악하고,";
  let text3_2 = "그 코드를 활용할 수 있는 힘이 있을때 AI를 올바르게 사용할 수 있다는 점을";
  let text3_3 = "깨닫는 계기가 되었다.";
  
  text(text3, margin, currentY, width - margin * 2);
  currentY += lineHeight;
  text(text3_2, margin, currentY, width - margin * 2);
  currentY += lineHeight;
  text(text3_3, margin, currentY, width - margin * 2);
  currentY += lineHeight * 3;
  
  // 감사합니다! (크게)
  textAlign(CENTER, CENTER);
  textSize(48);
  fill(255, 200, 200);
  text("감사합니다!", width / 2, currentY + 50);
}

// 이하 모든 함수들은 이전 통합 코드와 동일
// 111.txt 관련 함수
function drawHeart(x, y, s) {
  push();
  translate(x, y);
  scale(s / 100);
  noStroke();
  fill(255);
  beginShape();
  vertex(0, 0);
  bezierVertex(-50, -50, -50, 30, 0, 50);
  bezierVertex(50, 30, 50, -50, 0, 0);
  endShape(CLOSE);
  pop();
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

function updateAndDrawHeartFragments() {
  for (let frag of heartFragments) {
    frag.pos.add(frag.velocity);
    frag.alpha -= 3;
    fill(255, frag.alpha);
    noStroke();
    ellipse(frag.pos.x, frag.pos.y, frag.size);
  }
}

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
    if (this.texture) {
      imageMode(CENTER);
      tint(this.color, this.lifespan);
      image(this.texture, this.loc.x, this.loc.y);
    } else {
      noStroke();
      fill(this.color, this.lifespan);
      ellipse(this.loc.x, this.loc.y, 5);
    }
  }

  isDead() {
    return this.lifespan <= 0.0;
  }
}

// 222.txt 관련 함수들 (이전과 동일)
function drawStar() {
  noStroke();
  for (let i = 20; i > 0; i--) {
    let alpha = map(i, 20, 0, 25, 0) * (0.6 + 0.4 * sin(t * 1.2 + i));
    fill(255, 120, 40, alpha);
    ellipse(0, 0, 450 + i * 8, 450 + i * 8);
  }

  let ringCount = 60;
  for (let i = 0; i < ringCount; i++) {
    let progress = i / ringCount;
    let angle = progress * TWO_PI + t * 0.4;
    let radius = 260 + sin(t * 1.8 + progress * TWO_PI) * 20;
    let x = cos(angle) * radius;
    let y = sin(angle) * radius * 0.95;
    let alpha = map(sin(t * 3 + progress * TWO_PI), -1, 1, 40, 120);
    let size = map(sin(t * 4 + progress * TWO_PI), -1, 1, 5, 12);
    fill(255, 160, 60, alpha);
    ellipse(x, y, size, size * 0.6);
  }

  let corePulse = 1 + 0.03 * sin(t * 9);
  for (let i = 80; i > 0; i -= 2) {
    let n = noise(i * 0.05, t * 0.7);
    let r = i * 4.8 * corePulse + n * 12;
    fill(255, 200, 70, map(i, 80, 0, 100, 10));
    ellipse(0, 0, r, r);
  }

  for (let layer = 0; layer < 8; layer++) {
    let baseR = 180 - layer * 12;
    let freq = 1.0 + layer * 0.15;
    let amp = 0.5 + layer * 0.06;
    let noiseAmp = 0.2 + layer * 0.02;
    let alpha = map(layer, 0, 7, 120, 0);
    fill(255, 100 + layer * 30, 30 + layer * 25, alpha);
    drawSmoothOrganicShape(baseR, freq + sin(t * 0.6) * 0.2, freq * 0.7, amp, noiseAmp, true);
  }

  for (let i = 0; i < 4; i++) {
    let offset = i * 20;
    fill(255, 240, 120, 50 - i * 10);
    ellipse(-60 + offset, -70 + offset * 0.8, 80 - i * 12, 40 - i * 6);
  }

  for (let p of particles) {
    let flick = 0.8 + 0.4 * sin(t * 12 + p.x * 0.1);
    fill(255, 150 + random(-30, 30), 50, 180 * flick);
    ellipse(p.x, p.y, p.size * flick, p.size * flick * random(0.6, 1.2));
    fill(255, 200, 100, 80 * flick);
    ellipse(p.x, p.y, p.size * 0.4 * flick);
  }

  for (let i = 0; i < 40; i++) {
    let angle = random(TWO_PI);
    let rad = random(200, 300);
    let w = random(5, 20);
    let alpha = map(i, 0, 39, 80, 0) * random(0.6, 1.0);
    push();
    translate(cos(angle) * rad, sin(angle) * rad);
    noStroke();
    fill(255, 220, 100, alpha);
    ellipse(0, 0, w, random(4, 12));
    pop();
  }
}

function drawStarExplosion() {
  let zoom = lerp(1, 2.7, starExplosionProgress);
  push();
  scale(zoom);

  for (let i = 0; i < 28; i++) {
    let alpha = map(i, 0, 28, 180, 0) * starExplosionProgress;
    fill(255, 210, 80, alpha);
    ellipse(0, 0, 300 + i * 80 * starExplosionProgress);
    fill(220, 180, 120, alpha * 0.5);
    ellipse(0, 0, 250 + i * 120 * starExplosionProgress * 1.2);
  }
  
  for (let i = 0; i < 120; i++) {
    let angle = (TWO_PI / 120) * i + random(-0.01, 0.01);
    let len = random(180, 440) * starExplosionProgress * random(1, 1.6);
    let w = random(2, 10) * (1 - starExplosionProgress * 0.7);
    let col = color(255, 200 + random(0, 55), 60, 90 - starExplosionProgress * 60);
    push();
    rotate(angle);
    noStroke();
    fill(col);
    ellipse(len * 0.5, 0, len, w);
    pop();
  }
  
  for (let i = 0; i < 12; i++) {
    fill(255, 255, 220, map(i, 0, 12, 250, 0));
    ellipse(0, 0, 120 + i * 110 * starExplosionProgress);
  }
  
  if (starExplosionParticles.length === 0) generateStarExplosionParticles();
  for (let p of starExplosionParticles) {
    let t = constrain(starExplosionProgress, 0, 1);
    let z = lerp(0, 1, t) * p.z;
    let size = 22 * p.size * (1 - t * 0.5) * (1 + z * 2.8);
    let px = (p.initX + p.vx * t * 900) * (1 + z * 2.1);
    let py = (p.initY + p.vy * t * 900) * (1 + z * 2.1);
    if (p.rock) {
      fill(120, 90, 60, 230 - t * 100);
      ellipse(px, py, size * 1.2, size * 0.9);
    } else {
      fill(255, 190 + 60 * p.size, 0, 230 - t * 100);
      ellipse(px, py, size);
      fill(255, 210, 80, 80 - t * 60);
      ellipse(px, py, size * 0.45);
    }
  }
  pop();
}

function generateStarExplosionParticles() {
  starExplosionParticles = [];
  for (let i = 0; i < 170; i++) {
    let angle = random(TWO_PI);
    let speed = random(0.7, 2.2);
    let size = random(0.7, 1.9);
    let z = random(0, 1);
    let x = cos(angle) * random(10, 60);
    let y = sin(angle) * random(10, 60);
    let rock = random() < 0.34;
    starExplosionParticles.push({
      initX: x, initY: y, x: x, y: y,
      vx: cos(angle) * speed * random(2.2, 3.2),
      vy: sin(angle) * speed * random(2.2, 3.2),
      size: size, z: z, rock: rock
    });
  }
}

function drawSmoothOrganicShape(baseR, freq1, freq2, amp, noiseAmp, highDetail = false) {
  beginShape();
  let step = highDetail ? 0.008 : 0.018;
  for (let a = 0; a < TWO_PI; a += step) {
    let n1 = noise(cos(a) * freq1 + 10, sin(a) * freq1 + 10, t * 0.5);
    let n2 = noise(cos(a) * freq2 + 100, sin(a) * freq2 + 100, t * 0.8);
    let n3 = noise(cos(a * 1.3) * 1.5 + 200, sin(a * 1.3) * 1.5 + 200, t * 0.9);
    let n4 = noise(cos(a * 2.1) * 2.2 + 300, sin(a * 2.1) * 2.2 + 300, t * 1.2);
    let r = baseR + (n1 - 0.5) * 22 * amp + (n2 - 0.5) * 18 * amp + 
            (n3 - 0.5) * 12 * (noiseAmp || 0.2) + (n4 - 0.5) * 8 * (noiseAmp || 0.1);
    let x = cos(a) * r;
    let y = sin(a) * r;
    vertex(x, y);
  }
  endShape(CLOSE);
}

function generateCracks() {
  cracks = [];
  for (let i = 0; i < 7; i++) {
    let crack = [];
    let angle = random(TWO_PI);
    let r = 40;
    for (let j = 0; j < 18; j++) {
      let noiseA = map(noise(j * 0.28, i), 0, 1, -0.23, 0.23);
      let noiseR = map(noise(j * 0.19, i + 10), 0, 1, -12, 12);
      r += 8 + noiseR;
      let x = r * cos(angle + noiseA);
      let y = r * sin(angle + noiseA);
      crack.push({ x, y });
      if (j > 4 && j < 14 && random() < 0.22) {
        let branchAngle = angle + random(-0.7, 0.7);
        let branchCrack = [];
        for (let k = 0; k < 8; k++) {
          let br = r + k * 8;
          let bx = br * cos(branchAngle);
          let by = br * sin(branchAngle);
          branchCrack.push({ x: bx, y: by });
        }
        cracks.push(branchCrack);
      }
    }
    cracks.push(crack);
  }
}

function generateParticles() {
  particles = [];
  for (let i = 0; i < 26; i++) {
    let angle = random(TWO_PI);
    let dist = random(180, 240);
    particles.push({
      x: cos(angle) * dist + random(-14, 14),
      y: sin(angle) * dist + random(-14, 14),
      size: random(10, 22)
    });
  }
}

function drawExplosion() {
  background(255, 230, 180);
  if (flashAlpha > 0) {
    fill(255, 240, 200, flashAlpha);
    ellipse(width / 2, height / 2, 600, 600);
    flashAlpha -= 0.8;
  }

  for (let p of explosionParticles) {
    fill(red(p.color), green(p.color), blue(p.color), p.alpha);
    ellipse(p.pos.x, p.pos.y, p.size, p.size);
    p.pos.add(p.vel);
    p.alpha *= 0.985;
    p.size *= 0.995;
  }

  for (let d of debris) {
    push();
    translate(d.pos.x, d.pos.y);
    rotate(d.rot);
    noStroke();
    fill(d.color);
    ellipse(0, 0, d.size, d.size);
    pop();

    d.pos.add(d.vel);
    d.vel.mult(0.985);
    d.rot += d.rotSpeed;
    d.pos.x = constrain(d.pos.x, 0, width);
    d.pos.y = constrain(d.pos.y, 0, height);
  }

  explosionFrame++;
  if (explosionFrame > explosionDuration) {
    phase = "neutron";
    neutronFrame = 0;
    shakeTime = 60;
    shakeMag = 20;
    neutronShaking = true;
  }
}

function drawNeutronPhase() {
  background(18, 16, 24, 255);
  for (let d of debris) {
    fill(80, 90, 110, 90);
    noStroke();
    ellipse(d.pos.x, d.pos.y, d.size, d.size * 0.6);
  }
  let shakeX = 0, shakeY = 0;
  if (neutronShaking && shakeTime > 0) {
    shakeX = random(-shakeMag, shakeMag);
    shakeY = random(-shakeMag, shakeMag);
    shakeTime--;
    shakeMag *= 0.97;
    if (shakeTime <= 0) neutronShaking = false;
  }
  drawNeutronStar(width / 2 + shakeX, height / 2 + shakeY, 70, neutronFrame);

  neutronFrame++;
  if (neutronFrame > neutronDuration && mouseDown) {
    phase = "collapse";
    shakeTime = 48;
    shakeMag = 16;
  }
}

function drawCollapse() {
  background(30, 28, 40, 255);

  for (let d of debris) {
    let dir = p5.Vector.sub(explosionCenter, d.pos).setMag(3);
    d.pos.add(dir);
    d.size *= 0.99;
    fill(120, 150, 255, 180);
    noStroke();
    ellipse(d.pos.x, d.pos.y, d.size, d.size * 0.6);
  }
  for (let i = 0; i < 16; i++) {
    fill(0, 0, 0, 30 - i * 1.5);
    ellipse(width / 2, height / 2, 220 - i * 12, 220 - i * 12);
  }

  let shakeX = 0, shakeY = 0;
  if (shakeTime > 0) {
    shakeX = random(-shakeMag, shakeMag);
    shakeY = random(-shakeMag, shakeMag);
    shakeTime--;
    shakeMag *= 0.97;
  }
  drawNeutronStar(width / 2 + shakeX, height / 2 + shakeY, 70, neutronFrame);

  let allCollapsed = debris.every(d => dist(d.pos.x, d.pos.y, width / 2, height / 2) < 30);
  if (allCollapsed && mouseDown === false) {
    phase = "blackhole_flash";
    blackholeFlashAlpha = 255;
    blackholeReveal = 0;
    shakeTime = 48;
    shakeMag = 16;
  }
}

function drawBlackholeFlash() {
  let reveal = easeInOutCubic(constrain(blackholeReveal, 0, 1));

  let bgColor = lerpColor(color(255, 240, 200), color(16, 18, 22), reveal);
  setGradientBackground(bgColor);

  push();
  translate(width / 2, height / 2);

  for (let i = 0; i < 38; i++) {
    let r = 140 + i * 7;
    let noiseSeedAngle = noise(i * 0.1, frameCount * 0.05) * TWO_PI;
    let arcStart = noiseSeedAngle;
    let arcEnd = arcStart + map(noise(i * 0.2, frameCount * 0.1), 0, 1, PI / 2, PI);

    let alphaVal = map(i, 0, 37, 60, 10) * reveal;
    stroke(60, 70, 100, alphaVal);
    strokeWeight(map(i, 0, 37, 16, 4) * reveal);
    noFill();
    arc(0, 0, r, r, arcStart, arcEnd);
  }
  pop();

  for (let i = 0; i < 8; i++) {
    let alphaCircle = map(i, 0, 7, 150, 20) * reveal;
    let sizeCircle = map(i, 0, 7, 180, 100) * reveal;
    fill(0, 0, 0, alphaCircle);
    ellipse(width / 2, height / 2, sizeCircle, sizeCircle);
  }

  for (let d of debris) {
    let centerX = width / 2;
    let centerY = height / 2;

    let angle = atan2(d.pos.y - centerY, d.pos.x - centerX);
    let distToCenter = dist(d.pos.x, d.pos.y, centerX, centerY);

    angle += 0.13 * reveal + random(-0.02, 0.02) * reveal;
    distToCenter *= 0.96 + 0.04 * (1 - reveal);

    d.pos.x = centerX + cos(angle) * distToCenter;
    d.pos.y = centerY + sin(angle) * distToCenter;

    d.size = d.size * (0.96 + 0.04 * (1 - reveal));

    let alphaDebris = 140 * reveal;
    fill(80, 90, 120, alphaDebris);

    push();
    translate(d.pos.x, d.pos.y);
    rotate(d.rot);
    boxy(d.size, d.size * 0.6, 0.18);
    pop();

    d.rot += d.rotSpeed * 1.6 * reveal;
  }

  if (blackholeFlashAlpha > 0) {
    fill(255, 255, 255, blackholeFlashAlpha);
    rect(0, 0, width, height);
    blackholeFlashAlpha = max(blackholeFlashAlpha - 1.2, 0);
  }

  if (blackholeReveal < 1) {
    blackholeReveal += 0.012;
  } else if (blackholeFlashAlpha <= 0) {
    debris = [];
    for (let i = 0; i < blackholeDebrisCount; i++) {
      let angle = random(TWO_PI);
      let r = random(120, 250);
      let pos = createVector(width / 2 + cos(angle) * r, height / 2 + sin(angle) * r);
      let rot = random(TWO_PI);
      debris.push({
        pos: pos,
        rot: rot,
        rotSpeed: random(-0.03, 0.03),
        size: random(18, 28)
      });
    }
    phase = "blackhole";
  }

  let shakeX = 0, shakeY = 0;
  if (shakeTime > 0) {
    let shakeProgress = shakeTime / 30;
    let shakeIntensity = shakeMag * easeOutQuad(shakeProgress);
    shakeX = random(-shakeIntensity, shakeIntensity);
    shakeY = random(-shakeIntensity, shakeIntensity);
    shakeTime--;
    shakeMag *= 0.95;
  }

  if (blackholeFlashAlpha > 60) {
    drawNeutronStar(width / 2 + shakeX, height / 2 + shakeY, 70, neutronFrame);
  }
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
  for (let d of debris) {
    let angle = atan2(d.pos.y - height / 2, d.pos.x - width / 2);
    let distToCenter = dist(d.pos.x, d.pos.y, width / 2, height / 2);
    angle += 0.13 + random(-0.02, 0.02);
    distToCenter *= 0.96;
    d.pos.x = width / 2 + cos(angle) * distToCenter;
    d.pos.y = height / 2 + sin(angle) * distToCenter;
    d.size *= 0.96;
    fill(80, 90, 120, 180);
    push();
    translate(d.pos.x, d.pos.y);
    rotate(d.rot);
    boxy(d.size, d.size * 0.6, 0.18);
    pop();
    d.rot += d.rotSpeed * 1.6;
  }
  for (let i = 0; i < 80; i++) {
    let angle = (TWO_PI / 80) * i + t * 0.3;
    let radius = 180 + 20 * sin(t * 5 + i);
    let x = width / 2 + cos(angle) * radius;
    let y = height / 2 + sin(angle) * radius * 0.94;
    fill(255, 240, 120, 45);
    ellipse(x, y, 4 + sin(t * 6 + i));
  }
}

function createDustParticles() {
  dustParticles = [];
  for (let i = 0; i < dustCount; i++) {
    let angle = random(TWO_PI);
    let radius = random(blackholeR * 2.2, width * 0.48);
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
  dustGathered = false;
  dustPhaseStarted = true;
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
    let grav = toCenter.copy().setMag(map(distToCenter, 0, width / 2, 0.07 / 4, 0.45 / 4));
    d.vel.add(grav);
    d.vel.mult(0.97);
    d.pos.add(d.vel);

    fill(d.baseColor);
    ellipse(d.pos.x, d.pos.y, d.size + random(-0.5, 0.5));

    if (distToCenter > blackholeR * 1.2) allIn = false;
  }
  if (allIn && dustPhaseStarted) {
    dustGathered = true;
    dustPhaseStarted = false;
  }
}

function drawNebula(alpha = 1) {
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

function drawPrettyHeart(cx, cy, size, alpha = 1, rotation = 0) {
  push();
  translate(cx, cy);
  rotate(-rotation);
  scale(size);

  push();
  translate(3, 6);
  fill(0, 0, 0, 30 * alpha);
  drawSimpleHeart(0, 0, 1.1);
  pop();

  for (let i = 8; i >= 0; i--) {
    let ratio = i / 8.0;
    let heartSize = 1 + i * 0.02;

    let r = lerp(255, 200, ratio);
    let g = lerp(100, 50, ratio);
    let b = lerp(120, 80, ratio);

    fill(r, g, b, 255 * alpha);
    drawSimpleHeart(0, 0, heartSize);
  }

  pop();
}

function drawSimpleHeart(x, y, s = 1) {
  push();
  translate(x, y);
  scale(s);

  beginShape();
  for (let t = 0; t <= TWO_PI; t += 0.01) {
    let xt = 16 * pow(sin(t), 3);
    let yt = -(13 * cos(t) - 5 * cos(2 * t) - 2 * cos(3 * t) - cos(4 * t));
    vertex(xt, yt);
  }
  endShape(CLOSE);

  pop();
}

function setGradientBackground(baseColor) {
  for (let y = 0; y < height; y++) {
    let inter = map(y, 0, height, 0, 1);
    let c = lerpColor(baseColor, color(8, 10, 15), inter);
    stroke(c);
    line(0, y, width, y);
  }
}

function easeOutQuad(t) {
  return t * (2 - t);
}

function drawNeutronStar(centerX, centerY, starR, t) {
  if (!this.flowParticles) {
    this.flowParticles = [];
    for (let i = 0; i < 300; i++) {
      this.flowParticles.push({
        pos: createVector(random(width), random(height)),
        vel: createVector(),
        size: random(1.2, 3.2),
        baseAlpha: random(50, 100),
        col: color(130 + random(120), 170 + random(70), 255, 90)
      });
    }
  }

  for (let p of this.flowParticles) {
    let baseAngle = noise(p.pos.x * 0.0025, p.pos.y * 0.0025, t * 0.35) * TWO_PI * 5;
    let shake = sin(t * 5 + p.pos.x * 0.01) * 0.5;
    let angle = baseAngle + shake;

    let dir = p5.Vector.fromAngle(angle);
    p.vel.lerp(dir, 0.25);
    p.pos.add(p.vel.copy().mult(0.9));

    if (p.pos.x < 0) p.pos.x = width;
    if (p.pos.x > width) p.pos.x = 0;
    if (p.pos.y < 0) p.pos.y = height;
    if (p.pos.y > height) p.pos.y = 0;

    let alpha = p.baseAlpha * (0.5 + 0.5 * sin(t * 3 + p.pos.x * 0.1));
    noStroke();
    fill(red(p.col), green(p.col), blue(p.col), alpha);
    ellipse(p.pos.x, p.pos.y, p.size, p.size);
  }

  for (let i = 0; i < 90; i++) {
    let rr = random(starR * 0.75, starR * 1.05);
    let angle = random(TWO_PI);
    let x = centerX + cos(angle) * rr * random(0.8, 1.1);
    let y = centerY + sin(angle) * rr * random(0.8, 1.1);

    let flicker = 150 + 100 * sin(t * 10 + i);
    let c = color(255, random(130, 190), 0, flicker);
    noStroke();
    fill(c);
    ellipse(x, y, random(starR * 0.15, starR * 0.3));
  }

  for (let side of [-1, 1]) {
    push();
    translate(centerX, centerY);
    rotate(side * PI / 2 + radians(-18 + 6 * sin(t * 0.1)));

    for (let i = 0; i < 20; i++) {
      let len = starR * random(2.3, 3.0);
      let alpha = map(i, 0, 19, 120, 0);
      stroke(140, 220, 255, alpha);
      strokeWeight(map(i, 0, 19, 10, 3));
      line(0, 0, 0, -len);
    }
    for (let i = 0; i < 20; i++) {
      let len = starR * random(1.7, 2.2);
      let alpha = map(i, 0, 19, 80, 0);
      stroke(200, 240, 255, alpha);
      strokeWeight(map(i, 0, 19, 4, 1));
      line(0, 0, 0, -len);
    }
    pop();
  }

  push();
  translate(centerX, centerY);

  noFill();
  stroke(180, 210, 255, 70);
  strokeWeight(10);
  beginShape();
  for (let a = 0; a < TWO_PI + 0.1; a += 0.04) {
    let n = noise(cos(a) * 1.3, sin(a) * 1.3, t * 0.6);
    let r = starR * 0.7 + n * starR * 0.35;
    vertex(cos(a) * r, sin(a) * r);
  }
  endShape(CLOSE);

  stroke(220, 240, 255, 150);
  strokeWeight(4);
  beginShape();
  for (let a = 0; a < TWO_PI + 0.1; a += 0.02) {
    let n = noise(cos(a) * 1.6 + 20, sin(a) * 1.6 + 20, t * 0.9);
    let r = starR * 0.35 + n * starR * 0.25;
    vertex(cos(a) * r, sin(a) * r);
  }
  endShape(CLOSE);

  noStroke();
  for (let i = 7; i > 0; i--) {
    let alpha = map(i, 7, 0, 40, 0) * (0.7 + 0.3 * sin(t * 5 + i));
    fill(180, 220, 255, alpha);
    ellipse(0, 0, starR * i * 0.25);
  }

  pop();

  for (let i = 22; i > 0; i--) {
    let alpha = map(i, 22, 0, 50, 0) * (0.5 + 0.5 * sin(t * 2 + i));
    fill(170, 210, 255, alpha);
    ellipse(centerX, centerY, i * 14, i * 14 * 0.85);
  }

  noFill();
  for (let i = 0; i < 8; i++) {
    let baseAngle = map(i, 0, 7, -PI / 2.5, PI / 2.5);
    let a1 = baseAngle + 0.1 * sin(t * 1.4 + i);
    let a2 = a1 + PI + 0.2 * cos(t * 1.8 + i * 2);
    stroke(130, 190, 255, 70);
    strokeWeight(2);
    arc(centerX, centerY, starR * 2.8, starR * 2.8, a1, a2);
  }

  noStroke();
}

function boxy(w, h, d) {
  fill(110, 120, 140, 180);
  rect(0, 0, w, h, 2);
  fill(150, 160, 180, 110);
  quad(-w / 2, -h / 2, w / 2, -h / 2, w / 2 - d * w, -h / 2 - d * h, -w / 2 - d * w, -h / 2 - d * h);
  fill(80, 90, 110, 130);
  quad(w / 2, -h / 2, w / 2, h / 2, w / 2 - d * w, h / 2 - d * h, w / 2 - d * w, -h / 2 - d * h);
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - pow(-2 * t + 2, 3) / 2;
}

function mousePressed() {
  if (programPhase === "main") {
    if (phase === "heartBreak") {
      currentPath = [];
      isDrawing = true;
      if (!heartBroken && paths.length >= 4) {
        heartBroken = true;
        breakHeartIntoFragments(width / 2, height / 2, 400);
      }
    } else if (phase === "star") {
      if (starPhase === "intact") {
        starPhase = "exploding";
        starExplosionProgress = 0;
        generateStarExplosionParticles();
      }
    } else if (phase === "neutron") {
      if (neutronFrame > neutronDuration) {
        phase = "collapse";
        shakeTime = 48;
        shakeMag = 16;
        mouseDown = true;
      }
    } else if (phase === "blackhole" && !dustPhaseStarted) {
      createDustParticles();
      phase = "dust";
    } else {
      mouseDown = true;
    }
  }
}

function mouseDragged() {
  if (programPhase === "main" && phase === "heartBreak" && isDrawing) {
    currentPath.push(createVector(mouseX, mouseY));
  }
}

function mouseReleased() {
  if (programPhase === "main") {
    if (phase === "heartBreak" && isDrawing) {
      isDrawing = false;
      if (currentPath.length > 0) {
        paths.push(currentPath);
      }
      if (!heartBroken && paths.length >= 5) {
        heartBroken = true;
        breakHeartIntoFragments(width / 2, height / 2, 400);
      }
    }
    mouseDown = false;
  }
}

function keyPressed() {
  if (programPhase === "main" && phase === "blackhole" && key === 'p') {
    createDustParticles();
    phase = "dust";
  }
}
