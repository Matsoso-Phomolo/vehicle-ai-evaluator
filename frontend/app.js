const API_BASE = window.location.origin;
const historyKey = "vehicle-ai-prediction-history";
const themeKey = "vehicle-ai-theme";

const state = {
  latestPrediction: null,
  latestMetrics: null,
  particles: [],
  canvasContext: null
};

const elements = {
  form: document.querySelector("#prediction-form"),
  apiStatus: document.querySelector("#api-status"),
  predictionLabel: document.querySelector("#prediction-label"),
  predictionConfidence: document.querySelector("#prediction-confidence"),
  probabilityList: document.querySelector("#probability-list"),
  mainFactors: document.querySelector("#main-factors"),
  reasonText: document.querySelector("#reason-text"),
  comparisonText: document.querySelector("#comparison-text"),
  bayesText: document.querySelector("#bayes-text"),
  historyTable: document.querySelector("#history-table"),
  historyEmpty: document.querySelector("#history-empty"),
  historyWrap: document.querySelector("#history-wrap"),
  exportButton: document.querySelector("#export-report"),
  themeToggle: document.querySelector("#theme-toggle"),
  themeLabel: document.querySelector("#theme-label"),
  predictButton: document.querySelector("#predict-button"),
  loadingSteps: document.querySelector("#loading-steps"),
  resultDisplay: document.querySelector("#prediction-display"),
  explanationPanel: document.querySelector("#explanation"),
  mobileNavToggle: document.querySelector("#mobile-nav-toggle"),
  sidebar: document.querySelector("#sidebar"),
  navLinks: [...document.querySelectorAll(".nav-link")],
  canvas: document.querySelector("#particle-canvas")
};

function getFormValues() {
  const data = new FormData(elements.form);
  return Object.fromEntries([...data.entries()]);
}

async function apiGet(path) {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  return response.json();
}

async function apiPost(path, body) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.detail?.message || `${path} returned ${response.status}`);
  }
  return payload;
}

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  elements.themeLabel.textContent = theme === "dark" ? "Light mode" : "Dark mode";
  localStorage.setItem(themeKey, theme);
}

function initializeTheme() {
  const savedTheme = localStorage.getItem(themeKey) || "dark";
  applyTheme(savedTheme);
}

function initializeParticles() {
  const canvas = elements.canvas;
  const context = canvas.getContext("2d");
  state.canvasContext = context;

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * ratio;
    canvas.height = window.innerHeight * ratio;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    createParticles();
  }

  function createParticles() {
    const count = Math.min(90, Math.floor(window.innerWidth / 18));
    state.particles = Array.from({ length: count }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.34,
      vy: (Math.random() - 0.5) * 0.34,
      radius: Math.random() * 1.8 + 0.6
    }));
  }

  function draw() {
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    const isLight = document.documentElement.dataset.theme === "light";
    context.fillStyle = isLight ? "rgba(0, 119, 255, 0.42)" : "rgba(51, 214, 255, 0.58)";
    context.strokeStyle = isLight ? "rgba(124, 58, 237, 0.13)" : "rgba(168, 85, 247, 0.16)";

    state.particles.forEach((particle, index) => {
      particle.x += particle.vx;
      particle.y += particle.vy;

      if (particle.x < 0 || particle.x > window.innerWidth) particle.vx *= -1;
      if (particle.y < 0 || particle.y > window.innerHeight) particle.vy *= -1;

      context.beginPath();
      context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      context.fill();

      for (let nextIndex = index + 1; nextIndex < state.particles.length; nextIndex += 1) {
        const next = state.particles[nextIndex];
        const distance = Math.hypot(particle.x - next.x, particle.y - next.y);
        if (distance < 120) {
          context.globalAlpha = 1 - distance / 120;
          context.beginPath();
          context.moveTo(particle.x, particle.y);
          context.lineTo(next.x, next.y);
          context.stroke();
          context.globalAlpha = 1;
        }
      }
    });

    window.requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener("resize", resize);
  draw();
}

function initializeRevealAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    },
    { threshold: 0.14 }
  );

  document.querySelectorAll(".reveal").forEach((section) => observer.observe(section));
}

function initializeActiveNavigation() {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        elements.navLinks.forEach((link) => {
          link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`);
        });
      });
    },
    { rootMargin: "-40% 0px -52% 0px" }
  );

  ["dashboard", "prediction", "dataset", "explanation", "history", "about"].forEach((id) => {
    const section = document.getElementById(id);
    if (section) sectionObserver.observe(section);
  });
}

function animateCounter(target, value, formatter = (number) => String(Math.round(number))) {
  const start = performance.now();
  const duration = 900;

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - (1 - progress) ** 3;
    target.textContent = formatter(value * eased);
    if (progress < 1) window.requestAnimationFrame(tick);
  }

  window.requestAnimationFrame(tick);
}

function renderProbabilityBars(probabilities) {
  elements.probabilityList.innerHTML = "";
  Object.entries(probabilities)
    .sort((a, b) => b[1] - a[1])
    .forEach(([label, value]) => {
      const row = document.createElement("div");
      row.className = "probability-row";
      row.innerHTML = `
        <strong>${label.toUpperCase()}</strong>
        <span class="track"><span class="fill"></span></span>
        <span class="probability-value">0.00%</span>
      `;
      elements.probabilityList.append(row);

      const fill = row.querySelector(".fill");
      const valueLabel = row.querySelector(".probability-value");
      window.requestAnimationFrame(() => {
        fill.style.width = `${value}%`;
        animateCounter(valueLabel, value, (number) => `${number.toFixed(2)}%`);
      });
    });
}

function renderExplanation(explanation) {
  elements.mainFactors.innerHTML = "";
  explanation.main_factors.forEach((factor, index) => {
    const item = document.createElement("li");
    item.textContent = factor;
    item.style.animationDelay = `${index * 90}ms`;
    elements.mainFactors.append(item);
  });
  elements.reasonText.textContent = explanation.reason;
  elements.comparisonText.textContent = explanation.comparison;
  elements.bayesText.textContent = explanation.naive_bayes_summary;
  elements.explanationPanel.classList.remove("active");
  void elements.explanationPanel.offsetWidth;
  elements.explanationPanel.classList.add("active");
}

function loadHistory() {
  return JSON.parse(localStorage.getItem(historyKey) || "[]");
}

function saveHistory(entry) {
  const history = [entry, ...loadHistory()].slice(0, 25);
  localStorage.setItem(historyKey, JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  const history = loadHistory();
  elements.historyTable.innerHTML = "";
  elements.historyEmpty.style.display = history.length ? "none" : "grid";
  elements.historyWrap.style.display = history.length ? "block" : "none";

  history.forEach((entry) => {
    const row = document.createElement("tr");
    const inputs = Object.entries(entry.inputs)
      .map(([key, value]) => `${key}=${value}`)
      .join(", ");
    row.innerHTML = `
      <td>${entry.timestamp}</td>
      <td>${inputs}</td>
      <td>${entry.prediction}</td>
      <td>${entry.confidence.toFixed(2)}%</td>
    `;
    elements.historyTable.append(row);
  });
}

function renderMetrics(metrics, summary) {
  state.latestMetrics = metrics;
  animateCounter(document.querySelector("#hero-accuracy"), metrics.accuracy, (number) => `${number.toFixed(2)}%`);
  animateCounter(document.querySelector("#hero-rows"), summary.total_rows);
  animateCounter(document.querySelector("#metric-accuracy"), metrics.accuracy, (number) => `${number.toFixed(2)}%`);
  animateCounter(document.querySelector("#metric-train"), metrics.train_size);
  animateCounter(document.querySelector("#metric-test"), metrics.test_size);
  animateCounter(document.querySelector("#metric-total"), summary.total_rows);

  const total = summary.total_rows;
  const classDistribution = document.querySelector("#class-distribution");
  classDistribution.innerHTML = "";
  Object.entries(summary.class_counts).forEach(([label, count]) => {
    const percentage = (count / total) * 100;
    const row = document.createElement("div");
    row.className = "analytics-row";
    row.innerHTML = `
      <strong>${label.toUpperCase()}</strong>
      <span class="track"><span class="fill"></span></span>
      <span class="probability-value">0</span>
    `;
    classDistribution.append(row);
    window.requestAnimationFrame(() => {
      row.querySelector(".fill").style.width = `${percentage}%`;
      animateCounter(row.querySelector(".probability-value"), count);
    });
  });

  const allowedValues = document.querySelector("#allowed-values");
  allowedValues.innerHTML = "";
  Object.entries(summary.allowed_values).forEach(([feature, values]) => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = `${feature}: ${values.join(", ")}`;
    allowedValues.append(chip);
  });
}

async function runLoadingSequence() {
  const steps = [...elements.loadingSteps.querySelectorAll("span")];
  elements.loadingSteps.classList.add("active");
  for (const step of steps) {
    steps.forEach((item) => item.classList.remove("active"));
    step.classList.add("active");
    elements.apiStatus.textContent = step.textContent;
    await sleep(360);
  }
}

function exportReport() {
  if (!state.latestPrediction) {
    elements.apiStatus.textContent = "Run a prediction before exporting a report.";
    elements.apiStatus.classList.add("error");
    return;
  }

  const inputs = Object.entries(state.latestPrediction.inputs)
    .map(([key, value]) => `<tr><th>${key}</th><td>${value}</td></tr>`)
    .join("");
  const probabilities = Object.entries(state.latestPrediction.result.probabilities)
    .map(([label, value]) => `<tr><th>${label}</th><td>${value.toFixed(2)}%</td></tr>`)
    .join("");
  const report = window.open("", "_blank", "width=900,height=700");
  report.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>Vehicle AI Prediction Report</title>
        <style>
          body { font-family: Inter, Arial, sans-serif; margin: 32px; color: #101828; }
          h1 { margin-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; margin: 18px 0; }
          th, td { padding: 10px; border: 1px solid #d0d5dd; text-align: left; }
          .summary { padding: 16px; background: #eef6ff; border-left: 5px solid #0077ff; }
        </style>
      </head>
      <body>
        <h1>Vehicle AI Prediction Report</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <div class="summary">
          <strong>Predicted class:</strong> ${state.latestPrediction.result.prediction}<br>
          <strong>Confidence:</strong> ${state.latestPrediction.result.confidence.toFixed(2)}%<br>
          <strong>Model accuracy:</strong> ${(state.latestMetrics?.accuracy || 0).toFixed(2)}%
        </div>
        <h2>Input Values</h2>
        <table>${inputs}</table>
        <h2>Probability Distribution</h2>
        <table>${probabilities}</table>
        <h2>Explanation</h2>
        <p>${state.latestPrediction.result.explanation.reason}</p>
        <p>${state.latestPrediction.result.explanation.comparison}</p>
        <p>${state.latestPrediction.result.explanation.naive_bayes_summary}</p>
        <script>window.print();<\/script>
      </body>
    </html>
  `);
  report.document.close();
}

async function handlePrediction(event) {
  event.preventDefault();
  elements.apiStatus.classList.remove("error");
  elements.predictButton.disabled = true;
  elements.predictButton.style.opacity = "0.72";

  try {
    const inputs = getFormValues();
    const loading = runLoadingSequence();
    const result = await apiPost("/predict", inputs);
    await loading;
    state.latestPrediction = { inputs, result };

    elements.predictionLabel.textContent = result.prediction.toUpperCase();
    elements.predictionConfidence.textContent = `Confidence: ${result.confidence.toFixed(2)}%`;
    elements.resultDisplay.classList.remove("generated");
    void elements.resultDisplay.offsetWidth;
    elements.resultDisplay.classList.add("generated");
    renderProbabilityBars(result.probabilities);
    renderExplanation(result.explanation);
    saveHistory({
      timestamp: new Date().toLocaleString(),
      inputs,
      prediction: result.prediction,
      confidence: result.confidence
    });
    elements.apiStatus.textContent = "Prediction complete.";
  } catch (error) {
    elements.apiStatus.textContent = error.message;
    elements.apiStatus.classList.add("error");
  } finally {
    elements.loadingSteps.classList.remove("active");
    elements.loadingSteps.querySelectorAll("span").forEach((step) => step.classList.remove("active"));
    elements.predictButton.disabled = false;
    elements.predictButton.style.opacity = "1";
  }
}

function bindEvents() {
  elements.form.addEventListener("submit", handlePrediction);
  elements.predictButton.addEventListener("click", handlePrediction);
  elements.exportButton.addEventListener("click", exportReport);
  elements.themeToggle.addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
  });
  elements.mobileNavToggle.addEventListener("click", () => {
    elements.sidebar.classList.toggle("open");
  });
  elements.navLinks.forEach((link) => {
    link.addEventListener("click", () => elements.sidebar.classList.remove("open"));
  });
}

async function initialize() {
  initializeTheme();
  initializeParticles();
  initializeRevealAnimations();
  initializeActiveNavigation();
  bindEvents();

  try {
    const [health, metrics, summary] = await Promise.all([
      apiGet("/health"),
      apiGet("/metrics"),
      apiGet("/dataset/summary")
    ]);
    document.querySelector("#system-status").textContent = health.status;
    elements.apiStatus.textContent = "Backend connected.";
    renderMetrics(metrics, summary);
    renderHistory();
    renderProbabilityBars({ unacc: 0, acc: 0, good: 0, vgood: 0 });
  } catch (error) {
    document.querySelector("#system-status").textContent = "offline";
    elements.apiStatus.textContent = "Backend is not reachable. Start FastAPI with uvicorn app.main:app --reload.";
    elements.apiStatus.classList.add("error");
  }
}

initialize();
