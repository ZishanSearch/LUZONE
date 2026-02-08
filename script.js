const targetInput = document.getElementById("targetInput");
const faceInput = document.getElementById("faceInput");
const targetPreview = document.getElementById("targetPreview");
const facePreview = document.getElementById("facePreview");
const generateBtn = document.getElementById("generateBtn");
const resetBtn = document.getElementById("resetBtn");
const blendRange = document.getElementById("blendRange");
const statusMessage = document.getElementById("statusMessage");
const outputCanvas = document.getElementById("outputCanvas");
const downloadLink = document.getElementById("downloadLink");
const historyGrid = document.getElementById("historyGrid");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");

const MAX_HISTORY = 6;
let targetImage = null;
let faceImage = null;

const historyItems = loadHistory();
renderHistory();

function loadHistory() {
  const stored = localStorage.getItem("luzone-history");
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) return parsed;
  } catch (error) {
    return [];
  }
  return [];
}

function saveHistory() {
  localStorage.setItem("luzone-history", JSON.stringify(historyItems.slice(0, MAX_HISTORY)));
}

function renderHistory() {
  historyGrid.innerHTML = "";
  if (historyItems.length === 0) {
    const empty = document.createElement("div");
    empty.className = "history__empty";
    empty.textContent = "No generations yet. Your outputs will appear here.";
    historyGrid.appendChild(empty);
    return;
  }
  historyItems.slice(0, MAX_HISTORY).forEach((item, index) => {
    const card = document.createElement("div");
    card.className = "history__item";

    const img = document.createElement("img");
    img.src = item.dataUrl;
    img.alt = `Generated ${index + 1}`;

    const label = document.createElement("span");
    label.textContent = item.timestamp;

    card.appendChild(img);
    card.appendChild(label);
    historyGrid.appendChild(card);
  });
}

function updatePreview(file, previewEl, label) {
  const reader = new FileReader();
  reader.onload = () => {
    const img = document.createElement("img");
    img.src = reader.result;
    img.alt = label;
    previewEl.innerHTML = "";
    previewEl.appendChild(img);
  };
  reader.readAsDataURL(file);
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function setStatus(message) {
  statusMessage.textContent = message;
}

function drawImageCover(ctx, image, width, height) {
  const scale = Math.max(width / image.width, height / image.height);
  const x = (width - image.width * scale) / 2;
  const y = (height - image.height * scale) / 2;
  ctx.drawImage(image, x, y, image.width * scale, image.height * scale);
}

function drawCircularImage(ctx, image, x, y, size) {
  const scale = Math.max(size / image.width, size / image.height);
  const offsetX = x + (size - image.width * scale) / 2;
  const offsetY = y + (size - image.height * scale) / 2;

  ctx.save();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(image, offsetX, offsetY, image.width * scale, image.height * scale);
  ctx.restore();
}

function getDominantColor(image) {
  const sampleCanvas = document.createElement("canvas");
  const sampleSize = 20;
  sampleCanvas.width = sampleSize;
  sampleCanvas.height = sampleSize;
  const ctx = sampleCanvas.getContext("2d");
  ctx.drawImage(image, 0, 0, sampleSize, sampleSize);
  const { data } = ctx.getImageData(0, 0, sampleSize, sampleSize);
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;
  for (let i = 0; i < data.length; i += 4) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    count += 1;
  }
  return {
    r: Math.round(r / count),
    g: Math.round(g / count),
    b: Math.round(b / count),
  };
}

function drawOutput() {
  const ctx = outputCanvas.getContext("2d");
  const { width, height } = outputCanvas;

  ctx.clearRect(0, 0, width, height);

  if (!targetImage || !faceImage) return;

  const blendStrength = Number(blendRange.value) / 100;

  drawImageCover(ctx, targetImage, width, height);

  ctx.save();
  ctx.globalAlpha = blendStrength;
  ctx.globalCompositeOperation = "soft-light";
  drawImageCover(ctx, targetImage, width, height);
  ctx.restore();

  const faceSize = Math.min(width, height) * 0.42;
  const faceX = width * 0.55 - faceSize / 2;
  const faceY = height * 0.58 - faceSize / 2;

  ctx.save();
  ctx.globalAlpha = 0.96;
  drawCircularImage(ctx, faceImage, faceX, faceY, faceSize);
  ctx.restore();

  const dominant = getDominantColor(targetImage);
  ctx.save();
  ctx.globalAlpha = blendStrength * 0.25;
  ctx.fillStyle = `rgb(${dominant.r}, ${dominant.g}, ${dominant.b})`;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  const dataUrl = outputCanvas.toDataURL("image/png");
  downloadLink.href = dataUrl;
  historyItems.unshift({
    dataUrl,
    timestamp: new Date().toLocaleString(),
  });

  if (historyItems.length > MAX_HISTORY) {
    historyItems.length = MAX_HISTORY;
  }

  saveHistory();
  renderHistory();
  setStatus("Done! Output saved to history.");
}

function resetAll() {
  targetImage = null;
  faceImage = null;
  targetInput.value = "";
  faceInput.value = "";
  targetPreview.innerHTML = "<span>Upload target style image</span>";
  facePreview.innerHTML = "<span>Upload your face image</span>";
  const ctx = outputCanvas.getContext("2d");
  ctx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
  downloadLink.href = "#";
  setStatus("Ready to generate.");
}

targetInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  updatePreview(file, targetPreview, "Target preview");
  targetImage = await loadImage(file);
});

faceInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  updatePreview(file, facePreview, "Face preview");
  faceImage = await loadImage(file);
});

generateBtn.addEventListener("click", () => {
  if (!targetImage || !faceImage) {
    alert("Please upload both target and your image to generate output.");
    setStatus("Waiting for both images.");
    return;
  }
  setStatus("Generating your styled image...");
  drawOutput();
});

resetBtn.addEventListener("click", () => {
  resetAll();
});

clearHistoryBtn.addEventListener("click", () => {
  historyItems.length = 0;
  saveHistory();
  renderHistory();
  setStatus("History cleared.");
});
