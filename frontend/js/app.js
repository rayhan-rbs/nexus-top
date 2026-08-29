/**
 * Main Application — Updated with Auth
 */

// ===== CHECK AUTH =====
// function checkAuth() {
//   if (!authService.isLoggedIn()) {
//     // Redirect to login if not authenticated
//     // window.location.href = 'login.html';
//     // For now, allow access without login (demo mode)
//   }
// }

// ===== CHECK AUTH =====
function checkAuth() {
  // typeof চেক করে নিশ্চিত হওয়া যাচ্ছে authService লোড হয়েছে কিনা
  if (typeof authService !== 'undefined') {
    if (!authService.isLoggedIn()) {
      // ডেমো মোডে সবাইকে এক্সেস দিতে চাইলে নিচের লাইনটি কমেন্ট আউট (//) রাখুন
      // window.location.href = 'login.html'; 
    }
  }
}

// ===== UPDATE NAV FOR LOGGED IN USER =====
function updateNavForUser() {
  const user = authService.getCurrentUser();
  if (user) {
    const loginBtn = document.querySelector('.nav-btn');
    if (loginBtn) {
      loginBtn.textContent = user.name;
      loginBtn.onclick = () => {
        if (confirm('Logout?')) {
          authService.logout();
        }
      };
    }
  }
}

// ===== LOAD GAMES =====
async function loadGames(category = 'all') {
  const loading = document.getElementById('gamesLoading');
  const error = document.getElementById('gamesError');
  const grid = document.getElementById('gameGrid');

  if (!loading || !error || !grid) {
    console.log('ℹ️ Not on homepage, skipping game load.');
    return; 
  }

  loading.style.display = 'grid';
  error.style.display = 'none';
  grid.style.display = 'none';

  try {
    let games;
    if (category === 'all') {
      const data = await dataService.getGames();
      games = data.games.filter(g => g.status === 'active');
    } else {
      games = await dataService.getGamesByCategory(category);
    }

    renderGames(games);

    loading.style.display = 'none';
    grid.style.display = 'grid';

  } catch (err) {
    console.error('Load failed:', err);
    loading.style.display = 'none';
    error.style.display = 'block';
  }
}

// ===== FILTER BUTTONS =====
function initFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadGames(btn.dataset.cat);
    });
  });
}

// ===== INITIALIZE APP =====
async function initApp() {
  console.log('🚀 Initializing NexusTop...');
  
  // Check authentication
  checkAuth();
  
  // Load preferences
  loadPreferences();
  
  // Initialize UI components
  initCursor();
  initParticles();
  initTyping();
  initFilters();

  if (typeof updateNavigation === 'function') {
    updateNavigation();
  }

  // Update nav for logged in user
  updateNavForUser();
  
  // Load games
  try {
    await loadGames();
    initScrollReveal();
  } catch (err) {
    console.error('App init failed:', err);
  }
  
  console.log('✅ NexusTop ready!');
}

// ===== HANDLE AUTH BUTTON =====
function handleAuthBtn() {
  if (authService.isLoggedIn()) {
    if (confirm('Logout?')) {
      authService.logout();
    }
  } else {
    window.location.href = 'login.html';
  }
}



// ===== START =====
document.addEventListener('DOMContentLoaded', initApp);