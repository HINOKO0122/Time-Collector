// 定数
const LEVELS = [1,2,4,8,16,32,64,128,256,512,1024,1440];
const STORAGE_KEY = "time_collector_data";

// データ読み込み
let collected = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

// DOM要素
const timeEl      = document.getElementById("current-time");
const btn         = document.getElementById("collect-btn");
const select      = document.getElementById("hour-select");
const nextTimeEl  = document.getElementById("next-time");
const progressEl  = document.getElementById("progress-fill");
const levelNumEl  = document.getElementById("level-num");
let chart;

// 現在時刻表示＋収集ボタン更新
function updateTime() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const key = `${hh}:${mm}`;
  timeEl.textContent = key;
  btn.disabled = collected.includes(key);
}

// 収集ボタンクリック
btn.addEventListener("click", () => {
  const t = timeEl.textContent;
  if (!collected.includes(t)) {
    collected.push(t);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collected));
    btn.disabled = true;
    updateProgress();
    drawChart(); // ボタン押下後に円グラフも更新
  }
});

// 時間帯セレクト初期化
function initSelect() {
  for (let h = 0; h < 24; h++) {
    const opt = document.createElement("option");
    opt.value = h;
    opt.textContent = `${h} 時`;
    select.append(opt);
  }
}

// 円グラフ描画
function drawChart() {
  const hour  = Number(select.value);
  const total = 60;
  const count = collected.filter(t => Number(t.slice(0,2)) === hour).length;
  nextTimeEl.textContent = findNextUncollected(hour);

  const data = [count, total - count];
  const cfg  = {
    type: "pie",
    data: {
      labels: ["集めた", "未収集"],
      datasets: [{ data, backgroundColor: ["#10b981", "#f87171"] }]
    }
  };

  if (chart) chart.destroy();
  chart = new Chart(document.getElementById("hour-chart"), cfg);
}

// 次の未収集を探索
function findNextUncollected(hour) {
  const now   = new Date();
  const start = now.getHours() * 60 + now.getMinutes();
  for (let offset = 0; offset < 1440; offset++) {
    const idx = (start + offset) % 1440;
    const hh  = String(Math.floor(idx / 60)).padStart(2,"0");
    const mm  = String(idx % 60).padStart(2,"0");
    const key = `${hh}:${mm}`;
    if (!collected.includes(key)) return key;
  }
  return "--:--";
}

// レベル算出＋プログレスバー＆背景＆テキスト更新
function updateProgress() {
  const n             = collected.length;
  const nextThreshold = LEVELS.find(l => l > n) || 1440;
  const prevThreshold = LEVELS.filter(l => l <= n).pop() || 0;
  const percent       = ((n - prevThreshold) / (nextThreshold - prevThreshold)) * 100;
  progressEl.style.width = `${percent}%`;

  const lvl = LEVELS.filter(l => l <= n).length;
  levelNumEl.textContent = lvl;
  document.body.style.backgroundColor =
    getComputedStyle(document.documentElement)
      .getPropertyValue(`--bg-level-${lvl}`);
}

// 初期化＋PWA Service Worker登録
function init() {
  initSelect();
  // 読み込み時点でのグラフとプログレス更新
  select.value = new Date().getHours();
  drawChart();
  updateTime();
  updateProgress();

  setInterval(updateTime, 1000);

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("service-worker.js")
      .then(reg => console.log("SW registered:", reg.scope))
      .catch(err => console.error("SW registration failed:", err));
  }

  select.addEventListener("change", drawChart);
}

window.onload = init;
