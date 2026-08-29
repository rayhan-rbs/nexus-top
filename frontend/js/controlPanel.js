/**
 * Control Panel — Theme, Color, Layout management
 */

// ===== OPEN/CLOSE PANEL =====
function openPanel() {
  document.getElementById('controlPanel').classList.add('open');
  document.getElementById('panelOverlay').classList.add('active');
}

function closePanel() {
  document.getElementById('controlPanel').classList.remove('open');
  document.getElementById('panelOverlay').classList.remove('active');
}

// ===== THEME =====
function setTheme(mode) {
  document.documentElement.dataset.theme = mode;
  document.querySelectorAll('.theme-opt').forEach(o => {
    o.classList.toggle('active', o.dataset.theme === mode);
  });
  
  // Null check added - themeToggleBtn might not exist in new navigation
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  if (themeToggleBtn) {
    themeToggleBtn.textContent = mode === 'dark' ? '🌙' : '☀️';
  }
  
  // Update theme icon in dropdown if exists
  const themeIconEl = document.getElementById('themeIcon');
  const themeLabelEl = document.getElementById('themeLabel');
  if (themeIconEl && themeLabelEl) {
    themeIconEl.textContent = mode === 'dark' ? '🌙' : '☀️';
    themeLabelEl.textContent = mode === 'dark' ? 'Dark Mode' : 'Light Mode';
  }
  
  localStorage.setItem('nxt-theme', mode);
}

function toggleTheme() {
  const cur = document.documentElement.dataset.theme;
  setTheme(cur === 'dark' ? 'light' : 'dark');
}

// ===== ACCENT COLOR =====
function setAccent(accent) {
  document.documentElement.dataset.accent = accent;
  document.querySelectorAll('.color-swatch').forEach(s => {
    s.classList.toggle('active', s.dataset.accent === accent);
  });
  localStorage.setItem('nxt-accent', accent);
}

// ===== LAYOUT =====
function setLayout(layout) {
  document.documentElement.dataset.layout = layout;
  document.querySelectorAll('.layout-opt').forEach(o => {
    o.classList.toggle('active', o.dataset.layout === layout);
  });
  localStorage.setItem('nxt-layout', layout);
}

// ===== RESET =====
function resetAll() {
  setTheme('dark');
  setAccent('purple');
  setLayout('grid');
  localStorage.removeItem('nxt-theme');
  localStorage.removeItem('nxt-accent');
  localStorage.removeItem('nxt-layout');
}

// ===== LOAD SAVED PREFERENCES =====
function loadPreferences() {
  const savedTheme = localStorage.getItem('nxt-theme');
  const savedAccent = localStorage.getItem('nxt-accent');
  const savedLayout = localStorage.getItem('nxt-layout');
  
  if(savedTheme) setTheme(savedTheme);
  if(savedAccent) setAccent(savedAccent);
  if(savedLayout) setLayout(savedLayout);
}