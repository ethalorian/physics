"use strict";
const P = UnitLab, $ = (id) => document.getElementById(id);
let index = 0, chain = [], solved = false, hinted = false;
const completed = /* @__PURE__ */ new Set();
const fmt = (n) => Number(n.toPrecision(8)).toLocaleString("en-US", { maximumFractionDigits: 8 });
function fraction(top, bottom) {
  return `<span class="fraction"><span>${top}</span><span>${bottom}</span></span>`;
}
function feedback(message, error = false) {
  $("feedback").textContent = message;
  $("feedback").className = error ? "error" : "";
}
function finish() {
  solved = true;
  completed.add(index);
  $("next").hidden = false;
  $("next").textContent = index === P.missions.length - 1 ? "See lab results \u2192" : "Next challenge \u2192";
  drawNav();
}
function drawNav() {
  $("progress").textContent = `${completed.size} / ${P.missions.length} complete`;
  $("missions").replaceChildren();
  P.missions.forEach((m, i) => {
    const b = document.createElement("button");
    b.textContent = completed.has(i) ? `${i + 1} \u2713` : i + 1;
    b.setAttribute("aria-label", `${m.title}${completed.has(i) ? ", completed" : ""}`);
    if (i === index) b.setAttribute("aria-current", "step");
    if (completed.has(i)) b.className = "done";
    b.onclick = () => load(i);
    $("missions").append(b);
  });
}
function pieces(quantity) {
  const top = [], bottom = [];
  for (const [u, p] of Object.entries(quantity.u)) for (let n = 0; n < Math.abs(p); n++) (p > 0 ? top : bottom).push(u);
  return { a: quantity.value, b: 1, top, bottom };
}
function expressionParts() {
  const parts = [pieces(P.missions[index].start)];
  for (const item of chain) {
    const f = P.factors.find((f2) => f2.id === item.id), a = pieces(item.flip ? f.bottom : f.top), b = pieces(item.flip ? f.top : f.bottom);
    const top = [], bottom = [];
    for (let j = 0; j < item.power; j++) {
      top.push(...a.top, ...b.bottom);
      bottom.push(...a.bottom, ...b.top);
    }
    parts.push({ a: Math.pow(a.a, item.power), b: Math.pow(b.a, item.power), top, bottom });
  }
  return parts;
}
function drawChain() {
  const mission = P.missions[index], parts = expressionParts(), above = {}, below = {};
  parts.forEach((p) => {
    p.top.forEach((u) => above[u] = (above[u] || 0) + 1);
    p.bottom.forEach((u) => below[u] = (below[u] || 0) + 1);
  });
  const leftTop = {}, leftBottom = {};
  Object.keys(above).forEach((u) => leftTop[u] = leftBottom[u] = Math.min(above[u], below[u] || 0));
  const tokens = (arr, left) => arr.map((u) => {
    const cancel = left[u] > 0;
    if (cancel) left[u]--;
    return `<span class="${cancel ? "cancel" : ""}"${cancel ? ' title="Canceled with the same unit across the fraction bar"' : ""}>${u}</span>`;
  }).join("\xB7");
  $("chain").innerHTML = parts.map((p, i) => {
    const t = `${fmt(p.a)} ${tokens(p.top, leftTop)}`, b = `${fmt(p.b)} ${tokens(p.bottom, leftBottom)}`;
    return `${i ? '<span aria-hidden="true">\xD7</span>' : ""}<div class="tile"><span class="expression">${fraction(t, b)}</span>${i ? `<div class="tileActions"><button type="button" data-flip="${i - 1}" aria-label="Flip factor ${i}">Flip</button><button type="button" data-power="${i - 1}" aria-label="Square factor ${i}" aria-pressed="${chain[i - 1].power === 2}">${chain[i - 1].power === 2 ? "\xB2 On" : "Square"}</button><button type="button" data-remove="${i - 1}" aria-label="Remove factor ${i}">\xD7</button></div>` : ""}</div>`;
  }).join("");
  $("remaining").textContent = P.label(P.evaluate(mission.start, chain).u);
  $("chain").querySelectorAll("button").forEach((b) => b.onclick = () => {
    if (b.dataset.flip !== void 0) {
      const c = chain[+b.dataset.flip];
      c.flip = !c.flip;
    }
    if (b.dataset.power !== void 0) {
      const c = chain[+b.dataset.power];
      c.power = c.power === 2 ? 1 : 2;
    }
    if (b.dataset.remove !== void 0) chain.splice(+b.dataset.remove, 1);
    changed();
  });
}
function changed() {
  solved = false;
  $("next").hidden = true;
  feedback("");
  drawChain();
  resetScene();
}
function resetScene() {
  const m = P.missions[index];
  $("sceneTitle").textContent = m.scene || "Units tell a story.";
  $("scene").innerHTML = m.target ? `<div class="unitHero">${P.label(m.target.u)}</div><div class="meter"><div class="fill" id="fill"></div></div><div class="axis"><span>0</span><span>${fmt(m.max)} ${m.scene === "Distance traveled in 1 s" ? "m" : P.label(m.target.u)}</span></div>` : '<div class="unitHero">m / s</div>';
  $("sceneText").textContent = m.target ? "Test a valid calculation to place your result on the scale." : "A unit is part of the meaning of a measurement.";
}
function load(i) {
  index = i;
  chain = [];
  solved = false;
  hinted = false;
  const m = P.missions[i];
  drawNav();
  $("tag").textContent = m.tag;
  $("title").textContent = m.title;
  $("prompt").textContent = m.prompt;
  feedback("");
  $("next").hidden = true;
  $("hint").hidden = !!m.choices;
  $("hint").textContent = "Show a hint";
  $("hintText").hidden = true;
  $("answer").value = "";
  $("builder").hidden = !!m.choices;
  $("choicePanel").replaceChildren();
  resetScene();
  if (m.choices) {
    m.choices.forEach((text, i2) => {
      const b = document.createElement("button");
      b.className = "choice";
      b.textContent = text;
      b.onclick = () => {
        if (i2 === m.correct) {
          feedback(m.explain);
          finish();
        } else {
          feedback("Try again. " + (index === 0 ? "m/s means meters divided by seconds." : "Multiplying by the unitless number \xBD does not change any units."), true);
        }
      };
      $("choicePanel").append(b);
    });
  } else {
    $("start").textContent = `${fmt(m.start.value)} ${P.label(m.start.u)}`;
    $("target").textContent = P.label(m.target.u);
    $("answerUnit").textContent = P.label(m.target.u);
    $("factorHelp").textContent = m.allowed.some((id) => !P.factors.find((f) => f.id === id).conversion) ? "Use the stated physics relationship. These quantity tiles can change the physical quantity, unlike conversion factors." : "Conversion factors compare equal quantities. Each equals 1, so the physical quantity stays the same.";
    $("bank").replaceChildren();
    m.allowed.forEach((id) => {
      const f = P.factors.find((f2) => f2.id === id), b = document.createElement("button");
      b.className = "factor";
      b.innerHTML = `+ ${fraction(`${f.top.value} ${P.label(f.top.u) === "1" ? "" : P.label(f.top.u)}`, `${f.bottom.value} ${P.label(f.bottom.u) === "1" ? "" : P.label(f.bottom.u)}`)}`;
      b.setAttribute("aria-label", `Add ${f.top.value} ${P.label(f.top.u)} over ${f.bottom.value} ${P.label(f.bottom.u)}`);
      b.onclick = () => {
        if (chain.length >= 6) {
          feedback("Use at most six factors. Remove an extra factor before adding another.", true);
          return;
        }
        chain.push({ id, flip: false, power: 1 });
        changed();
      };
      $("bank").append(b);
    });
    drawChain();
  }
  $("title").focus();
}
$("clear").onclick = () => {
  chain = [];
  changed();
};
$("hint").onclick = () => {
  hinted = !hinted;
  $("hintText").textContent = P.missions[index].hint;
  $("hintText").hidden = !hinted;
  $("hint").textContent = hinted ? "Hide hint" : "Show a hint";
};
$("answerForm").onsubmit = (e) => {
  e.preventDefault();
  const m = P.missions[index], result = P.evaluate(m.start, chain), answer = Number($("answer").value);
  if (!P.same(result.u, m.target.u)) {
    const compatible = P.dimension(result.u).every((x, i) => x === P.dimension(m.target.u)[i]);
    feedback(`Your chain leaves ${P.label(result.u)}. ${compatible ? "The dimensions match, but the requested unit does not yet match. Add or flip a conversion factor." : "The dimensions do not match the target. Check which units should cancel and whether to multiply or divide."}`, true);
    return;
  }
  if (!Number.isFinite(answer) || $("answer").value.trim() === "") {
    feedback("Enter a finite numerical value.", true);
    return;
  }
  if (Math.abs(result.value - m.target.value) > Math.abs(m.target.value) * 1e-9) {
    feedback("The units match, but this chain changes the amount incorrectly. Check extra quantity factors and exponents.", true);
    return;
  }
  if (Math.abs(answer - result.value) > Math.max(1e-8, Math.abs(result.value) * 1e-6)) {
    feedback(`The units work. Now multiply the numbers above the bars and divide by the numbers below them. Your numerical value needs revision.`, true);
    return;
  }
  feedback(m.explain);
  finish();
  $("sceneText").textContent = `${m.scene}: ${fmt(result.value)} ${m.scene === "Distance traveled in 1 s" ? "m" : P.label(m.target.u)}. ${m.scene === "Distance traveled in 1 s" ? "This is the distance covered in one second at this speed." : "The scale shows the calculated quantity."}`;
  $("fill").style.width = `${Math.min(100, result.value / m.max * 100)}%`;
};
$("next").onclick = () => {
  if (!solved) return;
  if (index < P.missions.length - 1) load(index + 1);
  else {
    feedback(`Lab checkpoint: ${completed.size} of ${P.missions.length} challenges completed. ${completed.size === P.missions.length ? "You practiced conversion, unit cancellation, derived units, and checking equations." : "Use the numbered challenges to finish the remaining tasks."} Transfer question: How would you convert 90 km/h to m/s? Explain why each factor equals 1.`);
    $("next").hidden = true;
  }
};
load(0);
