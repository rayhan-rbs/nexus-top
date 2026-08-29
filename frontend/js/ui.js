/**
 * UI Controller — Handles all UI rendering
 */

// ===== RENDER GAMES =====
// ===== RENDER GAMES =====
function renderGames(games) {
  const grid = document.getElementById('gameGrid');
  grid.innerHTML = '';

  if (games.length === 0) {
    grid.innerHTML = '<p style="text-align:center;color:var(--text-dim);grid-column:1/-1;padding:40px">কোনো গেম পাওয়া যায়নি</p>';
    return;
  }

  games.forEach(g => {
    const gameId = g.id || g.gameId;
    
    // 👈 ইমেইজ থাকলে ইমেইজ দেখাবে, না থাকলে গ্র্যাডিয়েন্ট দেখাবে
    let bgStyle = g.color;
    if (g.image) {
      const imageUrl = g.image.startsWith('http') ? g.image : `http://localhost:3000${g.image}`;
      bgStyle = `linear-gradient(to top, rgba(10,10,15,0.95) 0%, rgba(10,10,15,0.4) 100%), url('${imageUrl}')`;
    }
    
    const card = document.createElement('div');
    card.className = 'game-card';
    card.innerHTML = `
      <div class="game-card-bg" style="background: ${bgStyle}; background-size: cover; background-position: center;"></div>
      <div class="game-card-content">
        <span class="game-tag">${g.tag}</span>
        <div class="game-title">${g.title}</div>
        <div class="game-meta">
          <span>Top-up Now →</span>
          <span class="game-rating">★ ${g.rating}</span>
        </div>
      </div>
    `;
    
    card.addEventListener('click', () => {
      console.log('🎮 Game clicked:', gameId, g.title);
      openGameDetail(gameId);
    });
    
    // 3D Tilt Effect
    card.addEventListener('mousemove', e => {
      if(document.documentElement.dataset.layout !== 'grid') return;
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      const rx = ((y/r.height)-0.5)*-15, ry = ((x/r.width)-0.5)*15;
      card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-10px)`;
    });
    card.addEventListener('mouseleave', () => card.style.transform = '');
    
    grid.appendChild(card);
  });
}

// ===== OPEN GAME DETAIL =====
async function openGameDetail(id) {
  console.log('🎮 Opening game detail for:', id);

  try {
    const g = await dataService.getGameById(id);
    
    if (!g) {
      alert(' Game not found!');
      return;
    }

    console.log('✅ Game loaded:', g);

    // Get settings with safe fallback
    let symbol = '৳'; // Default fallback
    try {
      const settings = await dataService.getSettings();
      if (settings && settings.currencySymbol) {
        symbol = settings.currencySymbol;
      }
    } catch (err) {
      console.warn('⚠️ Using default currency symbol');
    }

    // Update UI
    document.getElementById('detailBg').style.background = g.color || 'linear-gradient(135deg,#7C3AED,#06B6D4)';
    document.getElementById('detailTitle').textContent = g.title;
    document.getElementById('detailDesc').textContent = g.description || '';
    document.getElementById('dsRating').textContent = g.rating || '4.5';
    document.getElementById('dsPlayers').textContent = g.players || '1M+';
    
    document.getElementById('detailTags').innerHTML = `
      <span class="detail-tag">${g.tag || 'Game'}</span>
      <span class="detail-tag">★ ${g.rating || '4.5'}</span>
      <span class="detail-tag">👥 ${g.players || '1M+'}</span>
    `;
    
    document.getElementById('pkgTag').textContent = `// ${g.title} ${g.currency || 'Credits'}`;

    // Render packages
    const pkgGrid = document.getElementById('pkgGrid');
    pkgGrid.innerHTML = '';

    const packages = g.packages || [];

    if (packages.length === 0) {
      pkgGrid.innerHTML = `
        <div style="text-align:center;padding:60px;color:var(--text-dim);grid-column:1/-1">
          <div style="font-size:60px;margin-bottom:15px">📦</div>
          <h3 style="margin-bottom:10px">No Packages Available</h3>
          <p>Packages will be added soon. Please check back later!</p>
        </div>
      `;
    } else {
      packages.forEach(p => {
        const card = document.createElement('div');
        card.className = 'pkg-card' + (p.popular ? ' popular' : '');
        card.innerHTML = `
          ${p.popular ? '<div class="popular-badge">⭐ POPULAR</div>' : ''}
          <div class="pkg-icon">${g.icon || '💎'}</div>
          <div class="pkg-amount">${p.amount} ${g.currency || ''}</div>
          <div class="pkg-bonus">${p.bonus || ''}</div>
          <div class="pkg-price">${symbol}${p.price} ${p.oldPrice ? `<small>${symbol}${p.oldPrice}</small>` : ''}</div>
          <button class="pkg-btn" onclick="showOrderModal('${g.gameId || g.id}', '${g.title}', '${g.icon || '💎'}', '${g.currency || 'Credits'}', '${p.id}', '${p.amount}', '${p.bonus || ''}', ${p.price}, ${p.oldPrice || 0})">Buy Now</button>
        `;
        pkgGrid.appendChild(card);
      });
    }

    // Show detail view
    document.getElementById('homeView').style.display = 'none';
    document.getElementById('gameDetail').classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });

  } catch (err) {
    console.error('❌ Error in openGameDetail:', err);
    alert('Error loading game: ' + err.message);
  }
}

// ===== SHOW HOME =====
function showHome() {
  document.getElementById('homeView').style.display = 'block';
  document.getElementById('gameDetail').classList.remove('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== BUY PACKAGE =====
function buyPackage(gameId, packageId) {
  console.log(`🛒 Buying: Game=${gameId}, Package=${packageId}`);
  alert('পেমেন্ট সিস্টেম শীঘ্রই আসছে!');
}

// ===== CUSTOM CURSOR =====
function initCursor() {
  const dot = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');
  let mx=0,my=0,rx=0,ry=0;
  
  document.addEventListener('mousemove', e => {
    mx=e.clientX; my=e.clientY;
    dot.style.left=mx+'px'; dot.style.top=my+'px';
  });
  
  function animateRing(){
    rx += (mx-rx)*0.15; ry += (my-ry)*0.15;
    ring.style.left=rx+'px'; ring.style.top=ry+'px';
    requestAnimationFrame(animateRing);
  }
  animateRing();
  
  document.addEventListener('mouseover', e => {
    if(e.target.closest('a, button, .game-card, .pkg-card, .filter-btn, .color-swatch, .layout-opt, .theme-opt, .icon-btn')) {
      ring.classList.add('hover');
    }
  });
  document.addEventListener('mouseout', e => {
    if(e.target.closest('a, button, .game-card, .pkg-card, .filter-btn, .color-swatch, .layout-opt, .theme-opt, .icon-btn')) {
      ring.classList.remove('hover');
    }
  });
}

// ===== PARTICLES =====
function initParticles() {
  const particlesContainer = document.getElementById('particles');
  for(let i=0;i<40;i++){
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random()*100+'%';
    p.style.animationDuration = (Math.random()*10+10)+'s';
    p.style.animationDelay = Math.random()*10+'s';
    p.style.opacity = Math.random()*0.5+0.2;
    particlesContainer.appendChild(p);
  }
}

// ===== TYPING EFFECT =====
function initTyping() {
  const typed = document.getElementById('typed');
  if (!typed) return;
  const words = ['Experience','Adventure','Victory','Legacy'];
  let wi=0, ci=0, deleting=false;

  
  function type(){
    const word = words[wi];
    if(!deleting){
      typed.textContent = word.substring(0, ci++);
      if(ci>word.length){ deleting=true; setTimeout(type, 1500); return; }
    } else {
      typed.textContent = word.substring(0, ci--);
      if(ci<0){ deleting=false; wi=(wi+1)%words.length; }
    }
    setTimeout(type, deleting?50:100);
  }
  type();
}

// ===== SCROLL REVEAL =====
function initScrollReveal() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if(e.isIntersecting){
        e.target.style.opacity = 1;
        e.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });
  
  document.querySelectorAll('.game-card, .feature-card, .stat').forEach(el => {
    el.style.opacity = 0;
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s, transform 0.6s';
    observer.observe(el);
  });
}

// ===== SHOW ORDER MODAL =====
function showOrderModal(gameId, gameTitle, gameIcon, currency, packageId, amount, bonus, price, oldPrice) {
  // Check if logged in
  if (!authService.isLoggedIn()) {
    alert('Please login first to place an order!');
    window.location.href = 'login.html';
    return;
  }

  // Create modal HTML
  const modal = document.createElement('div');
  modal.className = 'order-modal';
  modal.innerHTML = `
    <div class="order-modal-overlay" onclick="closeOrderModal()"></div>
    <div class="order-modal-content">
      <button class="order-modal-close" onclick="closeOrderModal()">✕</button>
      
      <div class="order-modal-header">
        <div class="order-game-icon">${gameIcon}</div>
        <h2>${gameTitle}</h2>
        <p>Complete your order</p>
      </div>

      <div class="order-summary">
        <div class="order-item">
          <span>Package:</span>
          <strong>${amount} ${currency}</strong>
        </div>
        <div class="order-item">
          <span>Bonus:</span>
          <strong style="color:#10B981">${bonus}</strong>
        </div>
        <div class="order-item">
          <span>Price:</span>
          <strong>৳${price} <small style="text-decoration:line-through;color:var(--text-dim)">৳${oldPrice}</small></strong>
        </div>
      </div>

      <form id="orderForm" onsubmit="submitOrder(event, '${gameId}', '${gameTitle}', '${gameIcon}', '${currency}', '${packageId}', '${amount}', '${bonus}', ${price}, ${oldPrice})">
        <div class="form-group">
          <label class="form-label">Your ${gameTitle} ID *</label>
          <input type="text" class="form-input" id="gameIdInput" placeholder="Enter your game ID" required>
          <small style="color:var(--text-dim);font-size:12px;margin-top:5px;display:block">
            ⚠️ Please enter your correct game ID. We are not responsible for wrong ID.
          </small>
        </div>

        <div class="form-group">
          <label class="form-label">Payment Method</label>
          <select class="form-input" id="paymentMethod" required>
            <option value="manual">Manual Payment (bKash/Nagad)</option>
            <option value="bkash">bKash</option>
            <option value="nagad">Nagad</option>
            <option value="rocket">Rocket</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Note (Optional)</label>
          <textarea class="form-input" id="orderNote" rows="3" placeholder="Any special instructions..."></textarea>
        </div>

        <button type="submit" class="btn-submit" id="orderSubmitBtn">Place Order — ৳${price}</button>
      </form>
    </div>
  `;

  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add('active'), 10);
}

// ===== CLOSE ORDER MODAL =====
function closeOrderModal() {
  const modal = document.querySelector('.order-modal');
  if (modal) {
    modal.classList.remove('active');
    setTimeout(() => modal.remove(), 300);
  }
}

// ===== SUBMIT ORDER =====
async function submitOrder(event, gameId, gameTitle, gameIcon, currency, packageId, amount, bonus, price, oldPrice) {
  event.preventDefault();

  // Check login first
  if (!authService.isLoggedIn()) {
    alert('⚠️ Please login first to place an order!');
    window.location.href = 'login.html';
    return;
  }

  const gameIdInput = document.getElementById('gameIdInput').value.trim();
  const paymentMethod = document.getElementById('paymentMethod').value;
  const note = document.getElementById('orderNote').value.trim();
  const submitBtn = document.getElementById('orderSubmitBtn');

  // Validation
  if (!gameIdInput) {
    alert('⚠️ Please enter your game ID!');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Processing...';

  const orderData = {
    game: {
      id: gameId,
      title: gameTitle,
      icon: gameIcon,
      currency: currency
    },
    package: {
      id: packageId,
      amount: amount,
      bonus: bonus,
      price: price,
      oldPrice: oldPrice
    },
    gameId: gameIdInput,
    paymentMethod: paymentMethod,
    note: note
  };

  console.log('📦 Sending order:', orderData);

  try {
    const result = await orderService.createOrder(orderData);
    console.log('📥 Order response:', result);

    if (result.success) {
      closeOrderModal();
      showOrderSuccess(result.order);
    } else {
      alert('❌ Error: ' + result.error);
      submitBtn.disabled = false;
      submitBtn.textContent = `Place Order — ৳${price}`;
    }
  } catch (err) {
    console.error('❌ Order error:', err);
    alert('❌ Something went wrong: ' + err.message);
    submitBtn.disabled = false;
    submitBtn.textContent = `Place Order — ৳${price}`;
  }
}

// ===== SHOW ORDER SUCCESS =====
function showOrderSuccess(order) {
  const modal = document.createElement('div');
  modal.className = 'order-modal';
  modal.innerHTML = `
    <div class="order-modal-overlay" onclick="closeOrderModal()"></div>
    <div class="order-modal-content" style="text-align:center">
      <div style="font-size:80px;margin-bottom:20px">🎉</div>
      <h2 style="color:#10B981;margin-bottom:10px">Order Placed Successfully!</h2>
      <p style="color:var(--text-dim);margin-bottom:30px">Your order has been received and is being processed.</p>
      
      <div style="background:var(--glass);padding:20px;border-radius:16px;text-align:left;margin-bottom:30px">
        <div style="display:flex;justify-content:space-between;margin-bottom:10px">
          <span style="color:var(--text-dim)">Order ID:</span>
          <strong style="color:var(--secondary)">${order.orderId}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:10px">
          <span style="color:var(--text-dim)">Amount:</span>
          <strong>৳${order.totalAmount}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:10px">
          <span style="color:var(--text-dim)">Status:</span>
          <strong style="color:#F59E0B">${order.status.toUpperCase()}</strong>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span style="color:var(--text-dim)">Date:</span>
          <strong>${new Date(order.createdAt).toLocaleString('bn-BD')}</strong>
        </div>
      </div>

      <div style="display:flex;gap:10px">
        <button class="btn-ghost" onclick="window.location.href='orders.html'" style="flex:1">View Orders</button>
        <button class="btn-primary" onclick="window.location.href='payment.html?orderId=${order._id}'" style="flex:1">💳 Pay Now</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add('active'), 10);
}