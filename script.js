// 定数
const LEVELS = [1,2,4,8,16,32,64,128,256,512,1024,1440];
const STORAGE_KEY = "time_collector_data";

// ローカルストレージ読み込み
let collected = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

// DOM参照
const timeEl     = document.getElementById("current-time");
const btn        = document.getElementById("collect-btn");
const select     = document.getElementById("hour-select");
const nextTimeEl = document.getElementById("next-time");
const chartEl    = document.getElementById("hour-chart");
const progressEl = document.getElementById("progress-fill");
const levelNumEl = document.getElementById("level-num");
const countEl    = document.getElementById("count-display");
let chart;

// 現在時刻＆ボタン状態更新
function updateTime() {
  const now = new Date();
  const hh  = String(now.getHours()).padStart(2,"0");
  const mm  = String(now.getMinutes()).padStart(2,"0");
  const key = `${hh}:${mm}`;
  timeEl.textContent = key;
  btn.disabled = collected.includes(key);
}

// 収集ボタン処理
btn.addEventListener("click", () => {
  const t = timeEl.textContent;
  if (!collected.includes(t)) {
    collected.push(t);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collected));
    updateProgress();
    drawChart();
    btn.disabled = true;
  }
});

// セレクト初期化
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

  const cfg = {
    type: "pie",
    data: {
      labels: ["集めた", "未収集"],
      datasets: [{
        data: [count, total - count],
        backgroundColor: ["#10b981","#f87171"]
      }]
    },
    options: { animation: false }
  };

  if (chart) chart.destroy();
  chart = new Chart(chartEl, cfg);
}

// 次の未収集時間を探す
function findNextUncollected(hour) {
  const now   = new Date();
  const start = now.getHours()*60 + now.getMinutes();
  for (let off = 0; off < 1440; off++) {
    const idx = (start + off) % 1440;
    const hh  = String(Math.floor(idx/60)).padStart(2,"0");
    const mm  = String(idx%60).padStart(2,"0");
    const key = `${hh}:${mm}`;
    if (!collected.includes(key)) return key;
  }
  return "--:--";
}

// レベル・プログレス・背景・総数表示更新
function updateProgress() {
  const n = collected.length;
  const nextTh = LEVELS.find(l => l > n) || 1440;
  const prevTh = LEVELS.filter(l => l <= n).pop() || 0;
  const pct = ((n - prevTh) / (nextTh - prevTh)) * 100;
  progressEl.style.width = `${pct}%`;

  const lvl = LEVELS.filter(l => l <= n).length;
  levelNumEl.textContent = lvl;
  countEl.textContent    = `${n}/1440`;
  // グラデ背景 or 単色背景
  if (lvl === 12) {
    document.body.style.backgroundImage =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--bg-level-12");
  } else {
    document.body.style.backgroundImage = "none";
    document.body.style.backgroundColor =
      getComputedStyle(document.documentElement)
        .getPropertyValue(`--bg-level-${lvl}`);
  }
}

// 初期化＋PWA SW 登録
function init() {
  initSelect();
  select.value = new Date().getHours();
  updateTime();
  updateProgress();
  drawChart();
  setInterval(updateTime, 1000);
  select.addEventListener("change", drawChart);

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("service-worker.js")
      .catch(console.error);
  }
}

window.onload = init;
