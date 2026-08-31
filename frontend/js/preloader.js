// ===== PRELOADER CONTROLLER =====

function initPreloader() {
  const preloader = document.querySelector('.preloader-wrapper');
  
  if (!preloader) return;

  // Create particles
  createParticles();

  // Minimum loading time (for smooth UX)
  const minLoadTime = 800; // 800ms
  const startTime = Date.now();

  // Check if page is fully loaded
  function checkPageLoad() {
    const elapsedTime = Date.now() - startTime;
    
    // Page is loaded AND minimum time has passed
    if (document.readyState === 'complete' && elapsedTime >= minLoadTime) {
      hidePreloader();
    } else {
      requestAnimationFrame(checkPageLoad);
    }
  }

  function hidePreloader() {
    preloader.classList.add('hidden');
    
    // Remove from DOM after animation
    setTimeout(() => {
      preloader.style.display = 'none';
    }, 500);
  }

  function createParticles() {
    const container = document.querySelector('.preloader-particles');
    if (!container) return;

    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = Math.random() * 100 + '%';
      particle.style.animationDelay = Math.random() * 3 + 's';
      particle.style.animationDuration = (Math.random() * 2 + 2) + 's';
      container.appendChild(particle);
    }
  }

  // Start checking
  checkPageLoad();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPreloader);
} else {
  initPreloader();
}