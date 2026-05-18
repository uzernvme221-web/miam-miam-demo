// =====================================================
// MIAM MIAM — Landing page logic
// =====================================================

const data = window.MMData.loadData();
const { fmtFCFA } = window.MMFmt;

// Cart state
let cart = JSON.parse(localStorage.getItem('mm_cart_v1') || '[]');
let currentCategory = 'all';
let selectedPayment = 'wave';

const FEATURED_IDS = ['m11', 'm03', 'm20', 'm22']; // Miammiam, Chawarma Poulet, Tacos Chawarma, L'Américain
const CATEGORIES = ['Burgers', 'Classiques', 'Hors-Jeu', 'French Tacos', 'Sandwich Pita'];

// =========== RENDER ===========
function renderFeatured() {
  const grid = document.getElementById('featured-grid');
  grid.innerHTML = FEATURED_IDS.map(id => {
    const it = data.menu.find(m => m.id === id);
    if (!it) return '';
    return `
      <div class="card-premium p-4 hover:scale-105 transition-transform">
        <div class="text-6xl text-center mb-3">${it.image}</div>
        <h3 class="font-bold text-burgundy-deep">${it.name}</h3>
        <p class="text-xs text-muted mt-1 line-clamp-2 h-8 overflow-hidden">${it.desc}</p>
        <div class="flex items-center justify-between mt-3">
          <span class="font-display text-xl text-gold">${fmtFCFA(it.price)}</span>
          <button onclick="addToCart('${it.id}')" class="w-8 h-8 rounded-full bg-burgundy text-white hover:bg-burgundy-deep transition">+</button>
        </div>
      </div>
    `;
  }).join('');
}

function renderCategoryTabs() {
  const tabs = document.getElementById('cat-tabs');
  const all = [{ key: 'all', label: 'Tout' }].concat(CATEGORIES.map(c => ({ key: c, label: c })));
  tabs.innerHTML = all.map(c => `
    <button onclick="switchCategory('${c.key}')" class="cat-tab px-4 py-2 rounded-full font-bold text-sm transition ${currentCategory === c.key ? 'bg-burgundy text-cream' : 'bg-white text-burgundy border border-border hover:border-burgundy'}">${c.label}</button>
  `).join('');
}

function renderMenu() {
  const grid = document.getElementById('menu-grid');
  const items = currentCategory === 'all'
    ? data.menu.filter(m => m.available)
    : data.menu.filter(m => m.cat === currentCategory && m.available);

  grid.innerHTML = items.map(it => `
    <div class="card-premium p-5 flex gap-4">
      <div class="text-5xl flex-shrink-0 flex items-center">${it.image}</div>
      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between gap-2 mb-1">
          <h3 class="font-bold text-burgundy-deep leading-tight">${it.name}</h3>
          <span class="font-display text-lg text-gold whitespace-nowrap">${fmtFCFA(it.price)}</span>
        </div>
        <p class="text-xs text-muted mb-3 line-clamp-2">${it.desc}</p>
        <button onclick="addToCart('${it.id}')" class="btn-primary text-xs px-3 py-1.5">+ Ajouter</button>
      </div>
    </div>
  `).join('');
}

function switchCategory(key) {
  currentCategory = key;
  renderCategoryTabs();
  renderMenu();
}

// =========== CART ===========
function addToCart(id) {
  const item = data.menu.find(m => m.id === id);
  if (!item) return;
  const existing = cart.find(c => c.id === id);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ id, name: item.name, price: item.price, qty: 1, image: item.image });
  }
  saveCart();
  updateCartUI();
  showToast(`✓ ${item.name} ajouté au panier`);
}

function removeFromCart(id) {
  cart = cart.filter(c => c.id !== id);
  saveCart();
  updateCartUI();
}

function changeQty(id, delta) {
  const item = cart.find(c => c.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    removeFromCart(id);
    return;
  }
  saveCart();
  updateCartUI();
}

function saveCart() {
  localStorage.setItem('mm_cart_v1', JSON.stringify(cart));
}

function getCartSubtotal() {
  return cart.reduce((s, c) => s + c.price * c.qty, 0);
}

function getCartCount() {
  return cart.reduce((s, c) => s + c.qty, 0);
}

function updateCartUI() {
  const count = getCartCount();
  const badge = document.getElementById('cart-count');
  const badgeMobile = document.getElementById('cart-count-mobile');
  if (count > 0) {
    badge.style.display = 'flex';
    badge.textContent = count;
    badgeMobile.style.display = 'flex';
    badgeMobile.textContent = count;
  } else {
    badge.style.display = 'none';
    badgeMobile.style.display = 'none';
  }

  const itemsBox = document.getElementById('cart-items');
  const footer = document.getElementById('cart-footer');
  const summaryText = document.getElementById('cart-summary-text');

  if (cart.length === 0) {
    itemsBox.innerHTML = `
      <div class="text-center text-muted py-12">
        <div class="text-5xl mb-3">🛒</div>
        <p>Votre panier est vide</p>
      </div>
    `;
    footer.style.display = 'none';
    summaryText.textContent = '0 articles';
    return;
  }

  summaryText.textContent = `${count} article${count > 1 ? 's' : ''}`;
  itemsBox.innerHTML = cart.map(c => `
    <div class="bg-white rounded-xl p-3 flex items-center gap-3">
      <div class="text-3xl">${c.image}</div>
      <div class="flex-1 min-w-0">
        <div class="font-semibold text-burgundy-deep text-sm leading-tight">${c.name}</div>
        <div class="text-xs text-muted">${fmtFCFA(c.price)} l'unité</div>
      </div>
      <div class="flex items-center gap-1">
        <button onclick="changeQty('${c.id}', -1)" class="w-7 h-7 rounded-md bg-cream hover:bg-burgundy hover:text-cream font-bold">−</button>
        <span class="w-6 text-center font-bold text-sm">${c.qty}</span>
        <button onclick="changeQty('${c.id}', 1)" class="w-7 h-7 rounded-md bg-cream hover:bg-burgundy hover:text-cream font-bold">+</button>
      </div>
    </div>
  `).join('');

  footer.style.display = 'block';
  const sub = getCartSubtotal();
  document.getElementById('cart-subtotal').textContent = fmtFCFA(sub);
  document.getElementById('cart-total').textContent = fmtFCFA(sub);
}

function openCart() {
  document.getElementById('cart-drawer').classList.remove('hidden');
  updateCartUI();
}
function closeCart() {
  document.getElementById('cart-drawer').classList.add('hidden');
}

// =========== CHECKOUT ===========
function openCheckout() {
  if (cart.length === 0) {
    showToast('Votre panier est vide', 'error');
    return;
  }
  closeCart();
  document.getElementById('checkout-modal').classList.add('open');
  checkoutStep1();
  updateCheckoutTotal();
}

function closeCheckout() {
  document.getElementById('checkout-modal').classList.remove('open');
  // reset
  document.getElementById('checkout-step-1').style.display = 'block';
  document.getElementById('checkout-step-2').style.display = 'none';
  document.getElementById('checkout-success').style.display = 'none';
}

function checkoutStep1() {
  document.getElementById('checkout-step-1').style.display = 'block';
  document.getElementById('checkout-step-2').style.display = 'none';
  document.getElementById('checkout-success').style.display = 'none';
}

function checkoutStep2() {
  const name = document.getElementById('co-name').value.trim();
  const phone = document.getElementById('co-phone').value.trim();
  const address = document.getElementById('co-address').value.trim();
  if (!name || !phone || !address) {
    showToast('Veuillez remplir tous les champs obligatoires', 'error');
    return;
  }
  document.getElementById('checkout-step-1').style.display = 'none';
  document.getElementById('checkout-step-2').style.display = 'block';
  updateCheckoutTotal();
}

function selectPay(method) {
  selectedPayment = method;
  document.querySelectorAll('.pay-opt').forEach(el => {
    if (el.dataset.pay === method) {
      el.classList.remove('border-border', 'bg-white');
      el.classList.add('border-burgundy', 'bg-cream');
    } else {
      el.classList.add('border-border', 'bg-white');
      el.classList.remove('border-burgundy', 'bg-cream');
    }
  });
  const inst = document.getElementById('pay-instructions');
  if (method === 'wave') {
    inst.innerHTML = `<div class="font-bold text-burgundy-deep mb-1">💸 Paiement Wave</div><p class="text-burgundy-light text-xs">Envoyez le total au <strong>+221 77 554 21 60</strong> via Wave. Une fois envoyé, validez votre commande.</p>`;
  } else if (method === 'orange_money') {
    inst.innerHTML = `<div class="font-bold text-burgundy-deep mb-1">🧡 Orange Money</div><p class="text-burgundy-light text-xs">Envoyez le total au <strong>+221 77 554 21 60</strong> via Orange Money. Une fois envoyé, validez.</p>`;
  } else {
    inst.innerHTML = `<div class="font-bold text-burgundy-deep mb-1">💵 Cash on Delivery</div><p class="text-burgundy-light text-xs">Paiement en espèces à la livraison. Préparez l'appoint si possible.</p>`;
  }
}

function updateCheckoutTotal() {
  const sub = getCartSubtotal();
  const zone = parseInt(document.getElementById('co-zone').value || '1000');
  document.getElementById('co-subtotal').textContent = fmtFCFA(sub);
  document.getElementById('co-delivery').textContent = fmtFCFA(zone);
  document.getElementById('co-total').textContent = fmtFCFA(sub + zone);
}

document.addEventListener('change', e => {
  if (e.target.id === 'co-zone') updateCheckoutTotal();
});

function confirmOrder() {
  const sub = getCartSubtotal();
  const zone = parseInt(document.getElementById('co-zone').value || '1000');
  const total = sub + zone;
  const fresh = window.MMData.loadData();

  // Find next order number
  const maxNum = Math.max(...fresh.orders.map(o => o.number), 100);
  const newOrder = {
    id: 'ord_' + Date.now(),
    number: maxNum + 1,
    time: new Date().toISOString(),
    status: 'pending',
    customer: document.getElementById('co-name').value.trim(),
    phone: document.getElementById('co-phone').value.trim(),
    address: document.getElementById('co-address').value.trim(),
    source: 'web',
    payment: selectedPayment,
    paymentStatus: selectedPayment === 'cash' ? 'pending' : 'pending',
    items: cart.map(c => ({ id: c.id, name: c.name, qty: c.qty, price: c.price })),
    subtotal: sub,
    deliveryFee: zone,
    total,
    notes: document.getElementById('co-notes').value.trim()
  };

  fresh.orders.unshift(newOrder);
  window.MMData.saveData(fresh);

  document.getElementById('success-order-num').textContent = '#' + String(newOrder.number).padStart(4, '0');
  document.getElementById('checkout-step-1').style.display = 'none';
  document.getElementById('checkout-step-2').style.display = 'none';
  document.getElementById('checkout-success').style.display = 'block';

  // Clear cart
  cart = [];
  saveCart();
  updateCartUI();
}

// =========== TOAST ===========
let toastTimer = null;
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast ' + type;
  setTimeout(() => t.classList.add('show'), 10);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
}

// =========== INIT ===========
window.addEventListener('DOMContentLoaded', () => {
  renderFeatured();
  renderCategoryTabs();
  renderMenu();
  updateCartUI();
  selectPay('wave');
});
