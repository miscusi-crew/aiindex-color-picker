"use strict";
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch { /* fall back below */ }
  const t = document.createElement("textarea");
  t.value = text;
  t.style.position = "fixed";
  t.style.opacity = "0";
  document.body.append(t);
  t.select();
  const ok = document.execCommand("copy");
  t.remove();
  return ok;
}

const $ = (id) => document.getElementById(id);
const ctx = $("canvas").getContext("2d", { willReadFrequently: true });
const hex = (r, g, b) => "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase();

async function open(file) {
  if (!file || !file.type.startsWith("image/")) { $("msg").textContent = "That isn't an image."; return; }
  let bmp;
  try { bmp = await createImageBitmap(file); } catch { $("msg").textContent = "Couldn't open that image."; return; }
  const max = 900, s = Math.min(1, max / Math.max(bmp.width, bmp.height));
  $("canvas").width = Math.round(bmp.width * s);
  $("canvas").height = Math.round(bmp.height * s);
  ctx.drawImage(bmp, 0, 0, $("canvas").width, $("canvas").height);
  $("msg").textContent = "";
  palette();
}

function show(r, g, b) {
  const h = hex(r, g, b);
  $("sw").style.background = h;
  $("vals").innerHTML = `<button data-c="${h}">${h}</button><button data-c="rgb(${r}, ${g}, ${b})">rgb(${r}, ${g}, ${b})</button><span style="color:var(--muted);font-size:.8rem">Click a value to copy it.</span>`;
}

/** Main colours: bucket pixels into a coarse colour cube and take the biggest buckets. */
function palette() {
  const { data } = ctx.getImageData(0, 0, $("canvas").width, $("canvas").height);
  const buckets = new Map();
  for (let i = 0; i < data.length; i += 16) {
    if (data[i + 3] < 128) continue;
    const k = ((data[i] >> 4) << 8) | ((data[i + 1] >> 4) << 4) | (data[i + 2] >> 4);
    const b = buckets.get(k) || { n: 0, r: 0, g: 0, b: 0 };
    b.n++; b.r += data[i]; b.g += data[i + 1]; b.b += data[i + 2];
    buckets.set(k, b);
  }
  const top = [...buckets.values()].sort((a, b) => b.n - a.n).slice(0, 8).map((b) => hex(Math.round(b.r / b.n), Math.round(b.g / b.n), Math.round(b.b / b.n)));
  $("main").innerHTML = top.map((h) => `<button data-c="${h}" style="background:${h};color:${parseInt(h.slice(1), 16) > 0x888888 ? "#111" : "#fff"}">${h}</button>`).join("");
}

$("canvas").addEventListener("click", (e) => {
  const r = $("canvas").getBoundingClientRect();
  const x = Math.floor(((e.clientX - r.left) / r.width) * $("canvas").width), y = Math.floor(((e.clientY - r.top) / r.height) * $("canvas").height);
  const [R, G, B] = ctx.getImageData(x, y, 1, 1).data;
  show(R, G, B);
});
document.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-c]");
  if (b) $("msg").textContent = (await copyText(b.dataset.c)) ? `Copied ${b.dataset.c}` : b.dataset.c;
});
$("file").addEventListener("change", () => open($("file").files[0]));
$("drop").addEventListener("dragover", (e) => { e.preventDefault(); $("drop").classList.add("over"); });
$("drop").addEventListener("dragleave", () => $("drop").classList.remove("over"));
$("drop").addEventListener("drop", (e) => { e.preventDefault(); $("drop").classList.remove("over"); open(e.dataTransfer.files[0]); });

// A generated sample so there's something to try before opening a photo.
(function sample() {
  const c = $("canvas");
  c.width = 640; c.height = 360;
  const g = ctx.createLinearGradient(0, 0, 0, 360);
  g.addColorStop(0, "#f28f5f"); g.addColorStop(0.55, "#f2c94c"); g.addColorStop(0.56, "#2463b3"); g.addColorStop(1, "#1f2a44");
  ctx.fillStyle = g; ctx.fillRect(0, 0, 640, 360);
  ctx.fillStyle = "#fff4d6"; ctx.beginPath(); ctx.arc(420, 190, 46, Math.PI, 0); ctx.fill();
  ctx.fillStyle = "#1f1d1a"; ctx.beginPath(); ctx.moveTo(0, 360); ctx.lineTo(140, 230); ctx.lineTo(260, 360); ctx.fill();
  palette();
})();
