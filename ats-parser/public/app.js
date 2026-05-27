'use strict';

// ─── Elements ─────────────────────────────────────────────────────────────────
const dropzone      = document.getElementById('dropzone');
const fileInput     = document.getElementById('file-input');
const fileInfo      = document.getElementById('file-info');
const fileName      = document.getElementById('file-name');
const fileSize      = document.getElementById('file-size');
const fileRemove    = document.getElementById('file-remove');
const errorBanner   = document.getElementById('error-banner');
const errorMessage  = document.getElementById('error-message');
const btnAnalyze    = document.getElementById('btn-analyze');
const btnText       = btnAnalyze.querySelector('.btn-text');
const btnSpinner    = btnAnalyze.querySelector('.btn-spinner');
const progressSteps = document.getElementById('progress-steps');
const resultsPanel  = document.getElementById('results-panel');
const resultsMeta   = document.getElementById('results-meta');
const btnCopy       = document.getElementById('btn-copy');
const healthBadge   = document.getElementById('health-badge');

// Tab / panel elements
const tabs          = document.querySelectorAll('.tab');
const tabPanels     = document.querySelectorAll('.tab-panel');

// ─── State ────────────────────────────────────────────────────────────────────
let selectedFile = null;
let lastResult   = null;

// ─── Health Check ─────────────────────────────────────────────────────────────
async function checkHealth() {
  try {
    const res = await fetch('/api/health');
    const json = await res.json();
    if (json.success) {
      healthBadge.textContent = `● Online · ${json.model}`;
      healthBadge.className = 'badge ok';
    } else {
      healthBadge.textContent = '● Offline';
      healthBadge.className = 'badge err';
    }
  } catch {
    healthBadge.textContent = '● Unreachable';
    healthBadge.className = 'badge err';
  }
}
checkHealth();

// ─── File Validation ──────────────────────────────────────────────────────────
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function validateFile(file) {
  if (!file) return 'No file selected.';
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    return 'Invalid file type. Only PDF files are accepted.';
  }
  if (file.size === 0) return 'File is empty.';
  if (file.size > 5 * 1024 * 1024) return 'File exceeds the 5MB size limit.';
  return null;
}

function setFile(file) {
  const error = validateFile(file);
  if (error) {
    showError(error);
    return;
  }
  hideError();
  selectedFile = file;
  fileName.textContent = file.name;
  fileSize.textContent = formatBytes(file.size);
  fileInfo.hidden = false;
  btnAnalyze.disabled = false;
  resultsPanel.hidden = true;
}

function clearFile() {
  selectedFile = null;
  fileInput.value = '';
  fileInfo.hidden = true;
  btnAnalyze.disabled = true;
  hideError();
}

// ─── Error Display ────────────────────────────────────────────────────────────
function showError(msg) {
  errorMessage.textContent = msg;
  errorBanner.hidden = false;
}
function hideError() {
  errorBanner.hidden = true;
  errorMessage.textContent = '';
}

// ─── Drop Zone Events ─────────────────────────────────────────────────────────
dropzone.addEventListener('click', () => fileInput.click());
dropzone.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
});

dropzone.addEventListener('dragover', e => {
  e.preventDefault();
  dropzone.classList.add('dragging');
});
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragging'));
dropzone.addEventListener('drop', e => {
  e.preventDefault();
  dropzone.classList.remove('dragging');
  const file = e.dataTransfer.files[0];
  if (file) setFile(file);
});

fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) setFile(fileInput.files[0]);
});

fileRemove.addEventListener('click', clearFile);

// ─── Progress Steps ───────────────────────────────────────────────────────────
const STEPS = ['step-extract', 'step-clean', 'step-ai', 'step-validate'];

function setStepActive(stepId) {
  STEPS.forEach(id => {
    const el = document.getElementById(id);
    el.classList.remove('active', 'done');
  });
  const idx = STEPS.indexOf(stepId);
  STEPS.forEach((id, i) => {
    const el = document.getElementById(id);
    if (i < idx) el.classList.add('done');
    else if (i === idx) el.classList.add('active');
  });
}

function allStepsDone() {
  STEPS.forEach(id => {
    const el = document.getElementById(id);
    el.classList.remove('active');
    el.classList.add('done');
  });
}

function resetSteps() {
  STEPS.forEach(id => {
    const el = document.getElementById(id);
    el.classList.remove('active', 'done');
  });
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
    tabPanels.forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    const panelId = `panel-${tab.dataset.tab}`;
    document.getElementById(panelId).classList.add('active');
  });
});

// ─── Render Helpers ───────────────────────────────────────────────────────────
function renderNull() {
  return '<span class="null-value">null</span>';
}

function val(v) {
  if (v === null || v === undefined) return renderNull();
  return String(v);
}

function renderTable(tbodyEl, rows) {
  tbodyEl.innerHTML = rows
    .map(([label, value]) => `
      <tr>
        <td>${label}</td>
        <td>${value}</td>
      </tr>`)
    .join('');
}

function renderPersonal(data) {
  const pi = data.personalInformation;
  const tbody = document.querySelector('#personal-table tbody');
  renderTable(tbody, [
    ['Full Name',     val(pi.fullName)],
    ['Email',         val(pi.email)],
    ['Phone Number',  val(pi.phoneNumber)],
  ]);
}

function renderExperience(data) {
  const exp = data.totalExperienceAnalysis;
  const tbody = document.querySelector('#experience-table tbody');
  renderTable(tbody, [
    ['Total Experience',       val(exp.totalExperience)],
    ['Domain Experience',      exp.domainExperience !== null ? `${exp.domainExperience} years` : renderNull()],
    ['Leadership Experience',  val(exp.leadershipExperience)],
  ]);
}

function renderSkills(data) {
  const skills = data.skillExtraction.extractedSkills;
  const grid = document.getElementById('skills-grid');
  if (!skills || skills.length === 0) {
    grid.innerHTML = '<span class="empty-state">No technical skills detected.</span>';
    return;
  }
  grid.innerHTML = skills
    .map(s => `<span class="skill-badge">${escHtml(s)}</span>`)
    .join('');
}

function renderEducation(data) {
  const list = document.getElementById('education-list');
  const edu = data.educationDetails;
  if (!edu || edu.length === 0) {
    list.innerHTML = '<span class="empty-state">No education details found.</span>';
    return;
  }
  list.innerHTML = edu.map(e => `
    <div class="card">
      <div class="card-title">${val(e.degree)}</div>
      <div class="card-body">
        ${e.college ? escHtml(e.college) : '<em>Institution not specified</em>'}
      </div>
      <div class="card-meta">
        ${e.passingYear       ? `<span class="card-detail">Year: ${escHtml(e.passingYear)}</span>` : ''}
        ${e.cgpaOrPercentage  ? `<span class="card-detail">Score: ${escHtml(e.cgpaOrPercentage)}</span>` : ''}
      </div>
    </div>`).join('');
}

function renderProjects(data) {
  const list = document.getElementById('projects-list');
  const projects = data.projectAnalysis;
  if (!projects || projects.length === 0) {
    list.innerHTML = '<span class="empty-state">No projects detected.</span>';
    return;
  }
  list.innerHTML = projects.map(p => `
    <div class="card">
      <div class="card-title">${val(p.projectName)}</div>
      ${p.projectDescription
        ? `<div class="card-body">${escHtml(p.projectDescription)}</div>`
        : ''}
      ${p.technologiesUsed && p.technologiesUsed.length > 0
        ? `<div class="card-meta">${p.technologiesUsed.map(t => `<span class="card-tag">${escHtml(t)}</span>`).join('')}</div>`
        : ''}
    </div>`).join('');
}

function renderJSON(data) {
  document.getElementById('json-output').textContent = JSON.stringify(data, null, 2);
}

function renderResults(responseJson) {
  const { data, meta } = responseJson;
  lastResult = data;

  if (meta) {
    resultsMeta.textContent = `Model: ${meta.model} · Source: ${meta.extractionSource} · ID: ${meta.requestId.slice(0, 8)}`;
  }

  renderPersonal(data);
  renderExperience(data);
  renderSkills(data);
  renderEducation(data);
  renderProjects(data);
  renderJSON(data);

  resultsPanel.hidden = false;

  // Activate first tab
  tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
  tabPanels.forEach(p => p.classList.remove('active'));
  document.getElementById('tab-personal').classList.add('active');
  document.getElementById('tab-personal').setAttribute('aria-selected', 'true');
  document.getElementById('panel-personal').classList.add('active');
}

// ─── Escape HTML ──────────────────────────────────────────────────────────────
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Analyze ──────────────────────────────────────────────────────────────────
btnAnalyze.addEventListener('click', async () => {
  if (!selectedFile) return;

  // UI: loading state
  btnText.style.display = 'none';
  btnSpinner.style.display = 'flex';
  btnAnalyze.disabled = true;
  hideError();
  progressSteps.hidden = false;
  resetSteps();
  resultsPanel.hidden = true;

  // Elapsed timer — shows user the process is alive
  let elapsedSeconds = 0;
  const elapsedTimer = setInterval(() => {
    elapsedSeconds++;
    const activeStep = progressSteps.querySelector('.step.active .step-label');
    if (activeStep) {
      const base = activeStep.dataset.base || activeStep.textContent;
      activeStep.dataset.base = base;
      activeStep.textContent = `${base} (${elapsedSeconds}s...)`;
    }
  }, 1000);

  // Realistic step progress — matches actual server pipeline timing
  setStepActive('step-extract');
  const stepTimer1 = setTimeout(() => setStepActive('step-clean'),   1500);
  const stepTimer2 = setTimeout(() => setStepActive('step-ai'),      3500);
  const stepTimer3 = setTimeout(() => setStepActive('step-validate'), 28000);

  try {
    const formData = new FormData();
    formData.append('resume', selectedFile);

    const res = await fetch('/api/analyze', {
      method: 'POST',
      body: formData,
    });

    clearTimeout(stepTimer1);
    clearTimeout(stepTimer2);
    clearTimeout(stepTimer3);
    clearInterval(elapsedTimer);

    const json = await res.json();

    if (!res.ok || !json.success) {
      const errMsg = json.error || json.details?.join(', ') || `Server error (${res.status})`;
      showError(errMsg);
      resetSteps();
      return;
    }

    allStepsDone();
    renderResults(json);

    // Scroll to results
    setTimeout(() => resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);

  } catch (err) {
    clearTimeout(stepTimer1);
    clearTimeout(stepTimer2);
    clearTimeout(stepTimer3);
    clearInterval(elapsedTimer);
    showError('Network error — server may have timed out. Please try again.');
    resetSteps();
  } finally {
    btnText.style.display = '';
    btnSpinner.style.display = 'none';
    btnAnalyze.disabled = false;
  }
});

// ─── Copy JSON ────────────────────────────────────────────────────────────────
btnCopy.addEventListener('click', async () => {
  if (!lastResult) return;
  try {
    await navigator.clipboard.writeText(JSON.stringify(lastResult, null, 2));
    btnCopy.textContent = 'Copied!';
    btnCopy.classList.add('copied');
    setTimeout(() => {
      btnCopy.textContent = 'Copy JSON';
      btnCopy.classList.remove('copied');
    }, 2000);
  } catch {
    btnCopy.textContent = 'Copy failed';
    setTimeout(() => { btnCopy.textContent = 'Copy JSON'; }, 2000);
  }
});
