const STORAGE_KEY = "huecraft.saved.v1";
const colorNames = ["Foundation", "Canvas", "Primary", "Support", "Accent"];
const harmonyLabels = { complementary: "COMPLEMENTARY HARMONY", analogous: "ANALOGOUS HARMONY", triadic: "TRIADIC HARMONY", monochrome: "MONOCHROME HARMONY" };
const harmonyOffsets = { complementary: [0, 178, 28, 205, 56], analogous: [0, 20, -20, 39, -39], triadic: [0, 120, 240, 28, 148], monochrome: [0, 0, 0, 0, 0] };
const state = { harmony: "complementary", colors: ["#1C1A22", "#F2EFF8", "#9B8CFF", "#BDFF72", "#FF937C"], locked: [false, false, false, false, false], saved: readSaved() };
const swatchGrid = document.querySelector("#swatchGrid");
const harmonySelect = document.querySelector("#harmonySelect");
const toast = document.querySelector("#toast");
let toastTimer;

function readSaved() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value.filter((item) => item && Array.isArray(item.colors)) : [];
  } catch (error) { return []; }
}
function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
function randomBetween(min, max) { return Math.random() * (max - min) + min; }
function hslToHex(hue, saturation, lightness) {
  const h = ((hue % 360) + 360) % 360;
  const s = clamp(saturation, 0, 100) / 100;
  const l = clamp(lightness, 0, 100) / 100;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const section = h / 60;
  const x = chroma * (1 - Math.abs((section % 2) - 1));
  let rgb;
  if (section < 1) rgb = [chroma, x, 0];
  else if (section < 2) rgb = [x, chroma, 0];
  else if (section < 3) rgb = [0, chroma, x];
  else if (section < 4) rgb = [0, x, chroma];
  else if (section < 5) rgb = [x, 0, chroma];
  else rgb = [chroma, 0, x];
  const match = l - chroma / 2;
  return "#" + rgb.map((channel) => Math.round((channel + match) * 255).toString(16).padStart(2, "0")).join("").toUpperCase();
}
function generateColor(index, baseHue) {
  const hue = baseHue + harmonyOffsets[state.harmony][index] + randomBetween(-7, 7);
  const saturation = index === 0 ? randomBetween(13, 27) : randomBetween(43, 77);
  const mono = [17, 94, 58, 74, 42];
  const lightness = state.harmony === "monochrome" ? mono[index] + randomBetween(-4, 4) : (index === 0 ? randomBetween(15, 23) : index === 1 ? randomBetween(92, 97) : randomBetween(43, 67));
  return hslToHex(hue, saturation, lightness);
}
function hexToRgb(hex) {
  const value = String(hex).trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(value)) return null;
  return { r: parseInt(value.slice(0, 2), 16), g: parseInt(value.slice(2, 4), 16), b: parseInt(value.slice(4, 6), 16) };
}
function hueFromHex(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const red = rgb.r / 255;
  const green = rgb.g / 255;
  const blue = rgb.b / 255;
  const maximum = Math.max(red, green, blue);
  const minimum = Math.min(red, green, blue);
  const delta = maximum - minimum;
  if (delta < 0.06) return null;
  let hue;
  if (maximum === red) hue = 60 * (((green - blue) / delta) % 6);
  else if (maximum === green) hue = 60 * ((blue - red) / delta + 2);
  else hue = 60 * ((red - green) / delta + 4);
  return ((hue % 360) + 360) % 360;
}
function luminance(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const linear = [rgb.r, rgb.g, rgb.b].map((value) => { const channel = value / 255; return channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4); });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}
function contrastRatio(first, second) {
  const a = luminance(first);
  const b = luminance(second);
  if (a === null || b === null) return null;
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
}
async function copyText(text, message) {
  try { await navigator.clipboard.writeText(text); showToast(message); }
  catch (error) { showToast("Clipboard access is unavailable in this browser."); }
}
function lockIcon(locked) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 20 20");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", locked ? "M5.5 8V6a4.5 4.5 0 0 1 9 0v2m-10 0h11v9h-11zm5.5 3v3" : "M5.5 8V6a4.5 4.5 0 0 1 8.7-1.7M5 8h11v9H5zm5.5 3v3");
  svg.append(path);
  return svg;
}
function renderPalette() {
  swatchGrid.replaceChildren();
  state.colors.forEach((color, index) => {
    const card = document.createElement("article");
    card.className = "swatch-card";
    const colorButton = document.createElement("button");
    colorButton.type = "button";
    colorButton.className = "swatch-color-button";
    colorButton.style.backgroundColor = color;
    colorButton.setAttribute("aria-label", "Copy " + colorNames[index] + " color " + color);
    const hint = document.createElement("span");
    hint.className = "swatch-copy-hint";
    hint.textContent = "COPY HEX";
    colorButton.append(hint);
    colorButton.addEventListener("click", () => copyText(color, color + " copied"));
    const meta = document.createElement("div");
    meta.className = "swatch-meta";
    const label = document.createElement("div");
    label.className = "swatch-label";
    const hex = document.createElement("strong");
    hex.textContent = color;
    const name = document.createElement("small");
    name.textContent = colorNames[index];
    label.append(hex, name);
    const lock = document.createElement("button");
    lock.type = "button";
    lock.className = "lock-button" + (state.locked[index] ? " is-locked" : "");
    lock.setAttribute("aria-pressed", String(state.locked[index]));
    lock.setAttribute("aria-label", (state.locked[index] ? "Unlock " : "Lock ") + colorNames[index] + " swatch");
    lock.title = state.locked[index] ? "Unlock color" : "Lock color";
    lock.append(lockIcon(state.locked[index]));
    lock.addEventListener("click", () => { state.locked[index] = !state.locked[index]; renderPalette(); });
    meta.append(label, lock);
    card.append(colorButton, meta);
    swatchGrid.append(card);
  });
  document.querySelector("#paletteModeLabel").textContent = harmonyLabels[state.harmony];
  updatePreview();
  updateContrast();
}
function updatePreview() {
  const preview = document.querySelector("#previewCard");
  ["--preview-ink", "--preview-surface", "--preview-primary", "--preview-secondary", "--preview-accent"].forEach((name, index) => preview.style.setProperty(name, state.colors[index]));
}
function generatePalette() {
  const lockedIndex = state.locked.findIndex((locked, index) => locked && hueFromHex(state.colors[index]) !== null);
  const lockedHue = lockedIndex < 0 ? null : hueFromHex(state.colors[lockedIndex]) - harmonyOffsets[state.harmony][lockedIndex];
  const baseHue = lockedHue === null ? randomBetween(0, 360) : lockedHue;
  state.colors = state.colors.map((color, index) => state.locked[index] ? color : generateColor(index, baseHue));
  renderPalette();
  showToast("A fresh palette is ready.");
}
function cssVariables() {
  const names = ["ink", "canvas", "primary", "support", "accent"];
  return ":root {\n" + state.colors.map((color, index) => "  --color-" + names[index] + ": " + color + ";").join("\n") + "\n}\n";
}
function savePalette() {
  const item = { id: String(Date.now()) + "-" + Math.random().toString(16).slice(2, 7), name: "Palette " + new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" }), colors: [...state.colors], harmony: state.harmony };
  state.saved = [item, ...state.saved].slice(0, 24);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.saved)); }
  catch (error) { showToast("This browser could not save the palette."); return; }
  renderSaved();
  showToast("Palette saved on this device.");
}
function renderSaved() {
  const grid = document.querySelector("#savedGrid");
  const empty = document.querySelector("#emptyState");
  grid.replaceChildren();
  empty.hidden = state.saved.length > 0;
  document.querySelector("#savedCount").textContent = state.saved.length + (state.saved.length === 1 ? " palette saved" : " palettes saved");
  state.saved.forEach((item, index) => {
    const card = document.createElement("article");
    card.className = "saved-card";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", "Load saved palette " + item.name);
    card.addEventListener("click", () => loadSaved(index));
    card.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); loadSaved(index); } });
    const colors = document.createElement("div");
    colors.className = "saved-colors";
    item.colors.forEach((color) => { const chip = document.createElement("span"); chip.style.backgroundColor = color; colors.append(chip); });
    const title = document.createElement("div");
    title.className = "saved-card-title";
    const name = document.createElement("strong");
    name.textContent = item.name || "Saved palette";
    const harmony = document.createElement("small");
    harmony.textContent = (item.harmony || "custom").toUpperCase();
    title.append(name, harmony);
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "delete-saved";
    remove.setAttribute("aria-label", "Delete " + (item.name || "saved palette"));
    remove.textContent = "×";
    remove.addEventListener("click", (event) => {
      event.stopPropagation();
      state.saved.splice(index, 1);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.saved));
      renderSaved();
      showToast("Palette removed.");
    });
    card.append(colors, title, remove);
    grid.append(card);
  });
}
function loadSaved(index) {
  const item = state.saved[index];
  if (!item) return;
  state.colors = [...item.colors];
  state.harmony = harmonyOffsets[item.harmony] ? item.harmony : "complementary";
  state.locked = [false, false, false, false, false];
  harmonySelect.value = state.harmony;
  renderPalette();
  document.querySelector("#studio").scrollIntoView({ behavior: "smooth", block: "start" });
  showToast("Saved palette loaded.");
}
function setBadge(element, passes) {
  element.textContent = passes ? "Pass" : "Fail";
  element.classList.toggle("pass", passes);
  element.classList.toggle("fail", !passes);
}
function updateContrast() {
  const textInput = document.querySelector("#textColorInput");
  const backgroundInput = document.querySelector("#backgroundColorInput");
  const textColor = textInput.value.trim().toUpperCase();
  const backgroundColor = backgroundInput.value.trim().toUpperCase();
  const textRgb = hexToRgb(textColor);
  const backgroundRgb = hexToRgb(backgroundColor);
  const ratio = contrastRatio(textColor, backgroundColor);
  document.querySelector("#textColorChip").style.backgroundColor = textRgb ? textColor : "transparent";
  document.querySelector("#backgroundColorChip").style.backgroundColor = backgroundRgb ? backgroundColor : "transparent";
  const ratioOutput = document.querySelector("#contrastRatio");
  if (!ratio) {
    ratioOutput.textContent = "—";
    setBadge(document.querySelector("#aaNormal"), false);
    setBadge(document.querySelector("#aaLarge"), false);
    setBadge(document.querySelector("#aaaNormal"), false);
    textInput.setAttribute("aria-invalid", String(!textRgb));
    backgroundInput.setAttribute("aria-invalid", String(!backgroundRgb));
    return;
  }
  textInput.removeAttribute("aria-invalid");
  backgroundInput.removeAttribute("aria-invalid");
  ratioOutput.textContent = ratio.toFixed(2) + ":1";
  setBadge(document.querySelector("#aaNormal"), ratio >= 4.5);
  setBadge(document.querySelector("#aaLarge"), ratio >= 3);
  setBadge(document.querySelector("#aaaNormal"), ratio >= 7);
}
function initializeContrast() {
  [document.querySelector("#textColorInput"), document.querySelector("#backgroundColorInput")].forEach((input) => {
    input.addEventListener("input", updateContrast);
    input.addEventListener("blur", () => {
      if (/^#?[0-9a-fA-F]{6}$/.test(input.value.trim())) input.value = "#" + input.value.trim().replace(/^#/, "").toUpperCase();
      updateContrast();
    });
  });
}
function exportJson() {
  const data = { name: "Huecraft color palette", harmony: state.harmony, colors: { ink: state.colors[0], canvas: state.colors[1], primary: state.colors[2], support: state.colors[3], accent: state.colors[4] } };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "huecraft-palette.json";
  link.click();
  URL.revokeObjectURL(url);
  showToast("Palette exported as JSON.");
}
document.querySelector("#generateButton").addEventListener("click", generatePalette);
document.querySelector("#saveButton").addEventListener("click", savePalette);
document.querySelector("#copyCssButton").addEventListener("click", () => copyText(cssVariables(), "CSS variables copied."));
document.querySelector("#exportButton").addEventListener("click", exportJson);
harmonySelect.addEventListener("change", () => { state.harmony = harmonySelect.value; generatePalette(); });
document.addEventListener("keydown", (event) => {
  const target = event.target;
  const isTyping = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || target.isContentEditable;
  if (event.code === "Space" && !isTyping) { event.preventDefault(); generatePalette(); }
});
renderPalette();
renderSaved();
initializeContrast();



