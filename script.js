// script.js — HIGH-RES 1000x1000 OUTPUT | SLIDER ZOOM ONLY
let uploadedImage = null;
let nickname = '';
let isDragging = false;
let dragStartX, dragStartY;

// Transform state (in 1000x1000 coordinates)
let offsetX = 0;
let offsetY = 0;
let scale = 1;
let rotation = 0;

const CANVAS_SIZE = 1000; // 🔑 High-res output

const canvas = document.getElementById('editorCanvas');
const ctx = canvas.getContext('2d');
const frameImage = new Image();
frameImage.src = 'frame.png'; // Must be 1000x1000

const nicknameModal = document.getElementById('nickname-modal');
const nicknameForm = document.getElementById('nickname-form');
const nicknameInput = document.getElementById('nickname-input');
const zoomSlider = document.getElementById('zoomSlider');

frameImage.onload = () => {
  if (uploadedImage) drawEditor();
};

// === NAVIGATION ===
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// === UPLOAD HANDLER ===
document.getElementById('btn-upload-1').onclick = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      uploadedImage = new Image();
      uploadedImage.onload = async () => {
        // Resize for performance (but keep high quality)
        const maxSize = 1200;
        let { width, height } = uploadedImage;
        if (Math.max(width, height) > maxSize) {
          if (width > height) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(uploadedImage, 0, 0, width, height);
        uploadedImage.src = tempCanvas.toDataURL('image/jpeg', 0.92);
        uploadedImage.onload = () => {
          // Center in 1000x1000
          offsetX = CANVAS_SIZE / 2 - uploadedImage.width / 2;
          offsetY = CANVAS_SIZE / 2 - uploadedImage.height / 2;
          scale = 1;
          rotation = 0;
          nicknameModal.classList.add('active');
        };
      };
      uploadedImage.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };
  input.click();
};

// === NICKNAME FORM ===
nicknameForm.onsubmit = (e) => {
  e.preventDefault();
  nickname = nicknameInput.value.trim();
  if (!nickname) return;

  const formData = new FormData();
  formData.append('nickname', nickname);
  fetch('https://formspree.io/f/myznjrpk', {
    method: 'POST',
    body: formData,
    mode: 'no-cors'
  }).catch(() => {});

  nicknameModal.classList.remove('active');
  showScreen('screen3-editor');
  drawEditor();
};

// === DRAG HANDLERS ===
canvas.addEventListener('mousedown', startDrag);
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  startDrag(e.touches[0]);
});

function startDrag(e) {
  if (!uploadedImage) return;
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX || e.touches[0].clientX) - rect.left;
  const y = (e.clientY || e.touches[0].clientY) - rect.top;
  isDragging = true;
  dragStartX = x - offsetX;
  dragStartY = y - offsetY;
  canvas.style.cursor = 'grabbing';
}

window.addEventListener('mousemove', drag);
window.addEventListener('touchmove', (e) => {
  e.preventDefault();
  drag(e.touches[0]);
});

function drag(e) {
  if (!isDragging || !uploadedImage) return;
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX || e.touches[0].clientX) - rect.left;
  const y = (e.clientY || e.touches[0].clientY) - rect.top;
  offsetX = x - dragStartX;
  offsetY = y - dragStartY;
  drawEditor();
}

// 🔥 Critical: Release on any pointer loss
window.addEventListener('mouseup', endDrag);
window.addEventListener('touchend', endDrag);
window.addEventListener('touchcancel', endDrag);
canvas.addEventListener('mouseleave', endDrag);

function endDrag() {
  if (isDragging) {
    isDragging = false;
    canvas.style.cursor = 'grab';
  }
}

// === ZOOM SLIDER ===
zoomSlider.addEventListener('input', (e) => {
  if (uploadedImage) {
    scale = parseFloat(e.target.value);
    drawEditor();
  }
});

// === ROTATE ===
document.getElementById('btn-rotate').addEventListener('click', () => {
  if (uploadedImage) {
    rotation += 90;
    drawEditor();
  }
});

// === DRAW EDITOR (1000x1000) ===
function drawEditor() {
  if (!uploadedImage) return;
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  ctx.save();
  ctx.translate(offsetX + uploadedImage.width / 2, offsetY + uploadedImage.height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.scale(scale, scale);
  ctx.drawImage(uploadedImage, -uploadedImage.width / 2, -uploadedImage.height / 2);
  ctx.restore();

  if (frameImage.complete) {
    ctx.drawImage(frameImage, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
  }
}

// === EXPORT (1000x1000 PNG) ===
document.getElementById('btn-proceed').onclick = () => {
  showScreen('screen4-processing');
  setTimeout(() => {
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = CANVAS_SIZE;
    finalCanvas.height = CANVAS_SIZE;
    const fctx = finalCanvas.getContext('2d');

    fctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    fctx.save();
    fctx.translate(offsetX + uploadedImage.width / 2, offsetY + uploadedImage.height / 2);
    fctx.rotate((rotation * Math.PI) / 180);
    fctx.scale(scale, scale);
    fctx.drawImage(uploadedImage, -uploadedImage.width / 2, -uploadedImage.height / 2);
    fctx.restore();
    fctx.drawImage(frameImage, 0, 0, CANVAS_SIZE, CANVAS_SIZE);

    document.getElementById('finalImage').src = finalCanvas.toDataURL('image/png');
    showScreen('screen5-preview');
  }, 800);
};

// === DOWNLOAD ===
document.getElementById('btn-download').onclick = () => {
  const link = document.createElement('a');
  link.download = `SmileCam_${nickname || 'User'}.png`;
  link.href = document.getElementById('finalImage').src;
  link.click();
  setTimeout(showThankYou, 500);
};

// === THANK YOU ===
function showThankYou() {
  showScreen('screen6-thankyou');
  createConfetti();
}

function createConfetti() {
  const container = document.getElementById('confetti');
  const colors = ['#ffcc00', '#ff6b6b', '#4ecdc4', '#5563de', '#ff9a3c'];
  for (let i = 0; i < 150; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + 'vw';
    piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    piece.style.width = (Math.random() * 10 + 5) + 'px';
    piece.style.height = piece.style.width;
    container.appendChild(piece);

    piece.animate([
      { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
      { transform: `translateY(${100 + Math.random() * 50}vh) rotate(${Math.random() * 360}deg)`, opacity: 0 }
    ], {
      duration: 2000 + Math.random() * 3000,
      easing: 'cubic-bezier(0.1, 0.8, 0.2, 1)'
    });
  }
}

// === UTILS ===
function goBackToUpload() {
  uploadedImage = null;
  showScreen('screen1');
}

function startOver() {
  uploadedImage = null;
  nickname = '';
  showScreen('screen1');
}