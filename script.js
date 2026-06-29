let chart;

/* Navigation */
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

/* Navbar blur */
window.addEventListener('scroll', () => {
  document.getElementById('navbar')
    .classList.toggle('scrolled', window.scrollY > 20);
});

/* Calculate Energy */
function calculateEnergy() {
  const sleep = +document.getElementById('sleep').value;
  const screen = +document.getElementById('screen').value;
  const water = +document.getElementById('water').value;
  const stress = +document.getElementById('stress').value;

  let energy = 100;
  energy -= (8 - sleep) * 6;
  energy -= screen * 2;
  energy += water * 2;
  energy -= stress * 3;

  energy = Math.max(0, Math.min(100, Math.round(energy)));

  animateScore(energy);
  renderChart(sleep, screen, water, stress);
  generateInsight(energy, sleep, screen, water, stress);
  saveHistory(energy);

  showPage('dashboard');
}

/* Animated counter */
function animateScore(target) {
  const el = document.getElementById('energyScore');
  let current = 0;
  const timer = setInterval(() => {
    current++;
    el.textContent = current;
    if (current >= target) clearInterval(timer);
  }, 15);
}

/* Chart */
function renderChart(sleep, screen, water, stress) {
  const ctx = document.getElementById('energyChart');
  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Sleep', 'Screen', 'Water', 'Stress'],
      datasets: [{
        data: [sleep, screen, water, stress],
        backgroundColor: ['#22f7ff','#ff4d4d','#4dff88','#ffcc33']
      }]
    }
  });
}

/* AI Insight */
function generateInsight(e, s, sc, w, st) {
  let text =
    e > 75 ? "Your habits are supporting good energy today."
    : s < 6 ? "Low sleep is draining your energy. Try resting more."
    : w < 5 ? "You are dehydrated. Water will help your focus."
    : sc > 7 ? "High screen time is causing mental fatigue."
    : "Stress management can improve your daily energy.";

  document.getElementById('aiInsight').textContent = text;
}

/* History */
function saveHistory(score) {
  const h = JSON.parse(localStorage.getItem('energyHistory') || '[]');
  h.unshift({ score, date: new Date().toLocaleString() });
  localStorage.setItem('energyHistory', JSON.stringify(h.slice(0, 7)));
  renderHistory();
}

function renderHistory() {
  const ul = document.getElementById('historyList');
  ul.innerHTML = '';
  (JSON.parse(localStorage.getItem('energyHistory') || '[]'))
    .forEach(i => {
      const li = document.createElement('li');
      li.textContent = `${i.date} — Energy: ${i.score}`;
      ul.appendChild(li);
    });
}

renderHistory();

/* Export PDF */
function exportPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text("Energy History", 10, 10);

  let y = 20;
  JSON.parse(localStorage.getItem('energyHistory') || '[]')
    .forEach(i => {
      doc.text(`${i.date} : ${i.score}`, 10, y);
      y += 10;
    });

  doc.save("energy-history.pdf");
}
