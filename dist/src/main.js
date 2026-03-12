const concepts = [
  {
    title: 'SLO alerts ask user-impact questions',
    body: 'SLO alerts answer: Are users meaningfully impacted right now? They page when reliability objectives are burning too fast.',
  },
  {
    title: 'Threshold alerts ask system-abnormal questions',
    body: 'Threshold alerts answer: Is something unhealthy in the system? They are strong early warnings and usually route to Slack/ticket.',
  },
  {
    title: 'Both are useful in mature systems',
    body: 'SLO alerts drive paging. Threshold alerts prevent incidents and speed diagnosis. Diagnostics explain why a condition happened.',
  },
];

const ladderRows = [
  {
    layer: 'SLO alerts',
    question: 'Are users impacted?',
    examples: 'Burn rate spike, sustained latency SLO miss',
    action: 'Page',
  },
  {
    layer: 'Threshold alerts',
    question: 'Is the system abnormal?',
    examples: 'CPU > 90%, queue depth rising, disk > 85%',
    action: 'Investigate',
  },
  {
    layer: 'Diagnostic signals',
    question: 'Why is it happening?',
    examples: 'GC pauses, cache hit rate, thread pool saturation',
    action: 'Debug',
  },
];

const presets = {
  quiet: {
    name: 'Quiet baseline',
    threshold: 45,
    burn: 0.8,
    impact: 10,
    sustained: 'no',
  },
  early: {
    name: 'Early warning',
    threshold: 93,
    burn: 1.2,
    impact: 20,
    sustained: 'no',
  },
  outage: {
    name: 'User-impacting outage',
    threshold: 96,
    burn: 16,
    impact: 88,
    sustained: 'yes',
  },
};

const state = {
  threshold: presets.early.threshold,
  burn: presets.early.burn,
  impact: presets.early.impact,
  sustained: presets.early.sustained,
};

const app = document.querySelector('#app');

app.innerHTML = `
  <main>
    <header class="hero">
      <p class="eyebrow">SRE Alerting Study</p>
      <h1>SLO-Based vs Threshold-Based Alerting</h1>
      <p>
        Learn when to page, when to warn, and when to debug. This lab follows the practical pattern: SLO alerts for paging,
        threshold alerts for early warning.
      </p>
    </header>

    <section class="panel">
      <h2>Core Differences</h2>
      <div class="grid" id="conceptGrid"></div>
    </section>

    <section class="panel">
      <h2>Interactive Comparison</h2>
      <p class="note">Adjust signals and see recommended routing.</p>
      <div class="grid">
        <article class="card stack">
          <label for="thresholdRange">Threshold metric value (example CPU %): <strong id="thresholdValue"></strong></label>
          <input id="thresholdRange" type="range" min="0" max="100" step="1" value="${state.threshold}" />

          <label for="burnRange">SLO burn rate: <strong id="burnValue"></strong>x</label>
          <input id="burnRange" type="range" min="0" max="20" step="0.1" value="${state.burn}" />

          <label for="impactRange">Observed user impact: <strong id="impactValue"></strong></label>
          <input id="impactRange" type="range" min="0" max="100" step="1" value="${state.impact}" />

          <label for="sustainedSelect">Condition sustained for multiple windows?</label>
          <select id="sustainedSelect">
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>

          <div class="actions">
            <button type="button" data-preset="quiet">Quiet baseline</button>
            <button type="button" data-preset="early">Early warning</button>
            <button type="button" data-preset="outage">User-impacting outage</button>
          </div>
        </article>

        <article class="result stack">
          <div>
            <strong>Routing decision:</strong>
            <span id="decisionPill" class="pill"></span>
          </div>
          <p id="decisionText" class="note"></p>
          <div>
            <strong>SLO alert status:</strong>
            <span id="sloPill" class="pill"></span>
          </div>
          <div>
            <strong>Threshold alert status:</strong>
            <span id="thresholdPill" class="pill"></span>
          </div>
          <p class="note" id="policyNote"></p>
        </article>
      </div>
    </section>

    <section class="panel">
      <h2>Three-Layer Operating Model</h2>
      <table class="matrix">
        <thead>
          <tr>
            <th>Layer</th>
            <th>Question</th>
            <th>Examples</th>
            <th>Typical Action</th>
          </tr>
        </thead>
        <tbody id="ladderBody"></tbody>
      </table>
    </section>

    <section class="panel">
      <h2>Practical Rule</h2>
      <p class="note">
        Only SLO alerts should page humans. Threshold alerts should inform humans so teams can prevent incidents earlier.
      </p>
    </section>
  </main>
`;

const conceptGrid = document.getElementById('conceptGrid');
const ladderBody = document.getElementById('ladderBody');
const thresholdRange = document.getElementById('thresholdRange');
const burnRange = document.getElementById('burnRange');
const impactRange = document.getElementById('impactRange');
const sustainedSelect = document.getElementById('sustainedSelect');
const thresholdValue = document.getElementById('thresholdValue');
const burnValue = document.getElementById('burnValue');
const impactValue = document.getElementById('impactValue');
const decisionPill = document.getElementById('decisionPill');
const decisionText = document.getElementById('decisionText');
const sloPill = document.getElementById('sloPill');
const thresholdPill = document.getElementById('thresholdPill');
const policyNote = document.getElementById('policyNote');

conceptGrid.innerHTML = concepts
  .map(
    (item) => `
      <article class="card">
        <h3>${item.title}</h3>
        <p>${item.body}</p>
      </article>
    `,
  )
  .join('');

ladderBody.innerHTML = ladderRows
  .map(
    (row) => `
      <tr>
        <td><strong>${row.layer}</strong></td>
        <td>${row.question}</td>
        <td>${row.examples}</td>
        <td>${row.action}</td>
      </tr>
    `,
  )
  .join('');

const setPill = (el, text, kind) => {
  el.textContent = text;
  el.className = `pill ${kind}`;
};

const computeView = () => {
  const threshold = Number(state.threshold);
  const burn = Number(state.burn);
  const impact = Number(state.impact);
  const sustained = state.sustained === 'yes';

  const thresholdTriggered = threshold >= 90;
  const sloTriggered = burn >= 6 && sustained;
  const highImpact = impact >= 50;

  thresholdValue.textContent = `${threshold}%`;
  burnValue.textContent = burn.toFixed(1);
  impactValue.textContent = `${impact}%`;

  setPill(sloPill, sloTriggered ? 'Triggered' : 'Calm', sloTriggered ? 'bad' : 'good');
  setPill(thresholdPill, thresholdTriggered ? 'Triggered' : 'Calm', thresholdTriggered ? 'warn' : 'good');

  if (sloTriggered && highImpact) {
    setPill(decisionPill, 'Page Now', 'bad');
    decisionText.textContent =
      'Users are likely feeling pain and SLO burn is sustained. This is a paging event.';
  } else if (thresholdTriggered && !sloTriggered) {
    setPill(decisionPill, 'Investigate', 'warn');
    decisionText.textContent =
      'System behavior is abnormal but SLO burn is not yet severe/sustained. Route as warning (Slack/ticket), not a page.';
  } else {
    setPill(decisionPill, 'Observe', 'good');
    decisionText.textContent =
      'No urgent page signal. Keep diagnostics visible and continue monitoring for trend changes.';
  }

  policyNote.textContent =
    'Policy check: SLO alerts for paging; threshold alerts for early warning and prevention.';
};

const bindState = () => {
  thresholdRange.addEventListener('input', () => {
    state.threshold = Number(thresholdRange.value);
    computeView();
  });

  burnRange.addEventListener('input', () => {
    state.burn = Number(burnRange.value);
    computeView();
  });

  impactRange.addEventListener('input', () => {
    state.impact = Number(impactRange.value);
    computeView();
  });

  sustainedSelect.value = state.sustained;
  sustainedSelect.addEventListener('change', () => {
    state.sustained = sustainedSelect.value;
    computeView();
  });

  document.querySelectorAll('[data-preset]').forEach((button) => {
    button.addEventListener('click', () => {
      const preset = presets[button.dataset.preset];
      state.threshold = preset.threshold;
      state.burn = preset.burn;
      state.impact = preset.impact;
      state.sustained = preset.sustained;
      thresholdRange.value = String(state.threshold);
      burnRange.value = String(state.burn);
      impactRange.value = String(state.impact);
      sustainedSelect.value = state.sustained;
      computeView();
    });
  });
};

bindState();
computeView();

window.addEventListener('load', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch((error) => {
      console.error('Service worker registration failed', error);
    });
  }
});
