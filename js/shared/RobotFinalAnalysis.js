export function finalRatesFromWinner(winner, firstId, secondId) {
  if (!winner || winner === 'draw') return { first: 0.5, second: 0.5 };
  const normalized = String(winner).toLowerCase();
  if (normalized === String(firstId).toLowerCase()) return { first: 0.999, second: 0.001 };
  if (normalized === String(secondId).toLowerCase()) return { first: 0.001, second: 0.999 };
  return { first: 0.5, second: 0.5 };
}

export function renderFinalWinSummary({
  title = 'Final winning estimate',
  result = 'Game over',
  first = { id: 'first', label: 'First', rate: 0.5 },
  second = { id: 'second', label: 'Second', rate: 0.5 },
  note = 'Final result is exact; percentages are a compact postgame display.'
} = {}) {
  const firstRate = clampRate(first.rate);
  const secondRate = clampRate(second.rate);
  return `
    <section class="robot-final-flow">
      <h4>${escapeRobotHtml(title)}</h4>
      <p><strong>${escapeRobotHtml(result)}</strong></p>
      <div class="robot-final-bars" role="img" aria-label="${escapeRobotHtml(title)}">
        ${renderRateRow(first.label, firstRate, 'robot-flow-black')}
        ${renderRateRow(second.label, secondRate, 'robot-flow-white')}
      </div>
      <p class="robot-muted">${escapeRobotHtml(note)}</p>
    </section>`;
}

function renderRateRow(label, rate, className) {
  const percent = (100 * rate).toFixed(1);
  return `
    <div class="robot-final-rate-row">
      <span>${escapeRobotHtml(label)}</span>
      <div class="robot-final-rate-track"><i class="${className}" style="width:${percent}%"></i></div>
      <strong>${percent}%</strong>
    </div>`;
}

function clampRate(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0.5;
  return Math.max(0.001, Math.min(0.999, n));
}

export function escapeRobotHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
