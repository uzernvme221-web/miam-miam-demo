// =====================================================
// MIAM MIAM — Dashboard Logic (Owner + Employee)
// =====================================================

var session = window.MMAuth.requireAuth();
if (!session) throw new Error('No session');

var fmtFCFA = window.MMFmt.fmtFCFA;
var fmtTime = window.MMFmt.fmtTime;
var fmtDate = window.MMFmt.fmtDate;
var STATUS_LABELS = window.MMFmt.STATUS_LABELS;
var STATUS_COLORS = window.MMFmt.STATUS_COLORS;
var SOURCE_LABELS = window.MMFmt.SOURCE_LABELS;
var SOURCE_COLORS = window.MMFmt.SOURCE_COLORS;
var PAYMENT_LABELS = window.MMFmt.PAYMENT_LABELS;
var isOwner = session.role === 'owner';

// State
var activePage = 'dashboard';
var filters = { period: 'today', status: 'all', source: 'all', search: '' };
var chartRevenue = null;
var chartChannels = null;
var chartPayments = null;

// =============== INIT ===============
function init() {
  // Set user info
  document.getElementById('user-name').textContent = session.name;
  document.getElementById('user-role').textContent = isOwner ? 'Propriétaire' : 'Employé';
  document.getElementById('user-avatar').textContent = session.avatar;
  document.getElementById('role-label').textContent = isOwner ? 'Owner Panel' : 'Staff Panel';

  // Hide owner-only nav items for employees
  if (!isOwner) {
    document.querySelectorAll('.owner-only').forEach(el => el.style.display = 'none');
  }

  // Update badge
  updateNavBadge();

  // Wire nav
  document.querySelectorAll('.nav-item').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      navigate(a.dataset.page);
    });
  });

  // Initial render
  navigate('dashboard');

  // Simulate live updates every 30s
  setInterval(() => {
    if (activePage === 'dashboard' || activePage === 'orders') {
      updateNavBadge();
    }
  }, 30000);
}

function navigate(page) {
  activePage = page;
  document.querySelectorAll('.nav-item').forEach(a => {
    a.classList.toggle('active', a.dataset.page === page);
  });
  // Close mobile sidebar
  if (window.innerWidth < 1024) {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.add('hidden');
  }
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('hidden');
}

function updateNavBadge() {
  const data = window.MMData.loadData();
  const newCount = data.orders.filter(o => o.status === 'pending').length;
  const badge = document.getElementById('nav-orders-badge');
  badge.textContent = newCount;
  badge.style.display = newCount > 0 ? 'inline-flex' : 'none';
}

// =============== ROUTER ===============
function render() {
  const c = document.getElementById('page-container');
  switch (activePage) {
    case 'dashboard': c.innerHTML = renderDashboard(); afterRenderDashboard(); break;
    case 'orders': c.innerHTML = renderOrders(); afterRenderOrders(); break;
    case 'newOrder': c.innerHTML = renderNewOrder(); afterRenderNewOrder(); break;
    case 'menu': c.innerHTML = renderMenuPage(); afterRenderMenuPage(); break;
    case 'analytics':
      if (!isOwner) { c.innerHTML = renderForbidden(); return; }
      c.innerHTML = renderAnalytics(); afterRenderAnalytics(); break;
    case 'employees':
      if (!isOwner) { c.innerHTML = renderForbidden(); return; }
      c.innerHTML = renderEmployees(); afterRenderEmployees(); break;
    case 'settings':
      if (!isOwner) { c.innerHTML = renderForbidden(); return; }
      c.innerHTML = renderSettings(); afterRenderSettings(); break;
  }
}

function renderForbidden() {
  return `
    <div class="text-center py-20">
      <div class="text-6xl mb-4">🔒</div>
      <h2 class="font-display text-3xl text-burgundy-deep mb-2">Accès restreint</h2>
      <p class="text-muted">Cette section est réservée au propriétaire.</p>
    </div>
  `;
}

// =============== DASHBOARD ===============
function renderDashboard() {
  const data = window.MMData.loadData();
  const today = new Date().toDateString();
  const todayOrders = data.orders.filter(o => new Date(o.time).toDateString() === today && o.status !== 'cancelled');
  const todayRevenue = todayOrders.reduce((s, o) => s + o.total, 0);
  const inProgress = data.orders.filter(o => ['preparing', 'ready'].includes(o.status)).length;
  const weekRevenue = todayRevenue * 7 * 0.85; // fake

  const recentOrders = data.orders.slice(0, 6);

  return `
    <div class="mb-6 flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 class="font-display text-3xl text-burgundy-deep">Bonjour ${session.name.split(' ')[0]} 👋</h1>
        <p class="text-muted text-sm mt-1">Voici un aperçu de votre activité — ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>
      <div class="flex gap-2">
        ${isOwner ? '<button onclick="exportCSV()" class="btn-ghost text-sm">📥 Export</button>' : ''}
        <button onclick="navigate('newOrder')" class="btn-primary text-sm">+ Nouvelle commande</button>
      </div>
    </div>

    <!-- KPIs -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      <div class="kpi-card-modern">
        <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted mb-2">
          <span class="w-7 h-7 rounded-md bg-green-100 text-green-700 flex items-center justify-center">💰</span>
          Revenus aujourd'hui
        </div>
        <div class="font-display text-3xl text-burgundy-deep">${fmtFCFA(todayRevenue).replace(' Fr', '')} <span class="text-sm text-muted font-sans">FCFA</span></div>
        <div class="text-xs text-green-600 font-semibold mt-1">↗ +23% vs hier</div>
      </div>
      <div class="kpi-card-modern">
        <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted mb-2">
          <span class="w-7 h-7 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center">📦</span>
          Commandes aujourd'hui
        </div>
        <div class="font-display text-3xl text-burgundy-deep">${todayOrders.length}</div>
        <div class="text-xs text-green-600 font-semibold mt-1">↗ +5 vs hier</div>
      </div>
      <div class="kpi-card-modern">
        <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted mb-2">
          <span class="w-7 h-7 rounded-md bg-orange-100 text-orange-700 flex items-center justify-center">⏳</span>
          En cours
        </div>
        <div class="font-display text-3xl text-burgundy-deep">${inProgress}</div>
        <div class="text-xs text-muted mt-1">Préparation + livraison</div>
      </div>
      <div class="kpi-card-modern">
        <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted mb-2">
          <span class="w-7 h-7 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center">📈</span>
          Revenus 7 jours
        </div>
        <div class="font-display text-3xl text-burgundy-deep">${Math.round(weekRevenue/1000)}k <span class="text-sm text-muted font-sans">FCFA</span></div>
        <div class="text-xs text-green-600 font-semibold mt-1">↗ +18% vs sem. dernière</div>
      </div>
    </div>

    <!-- Recent Orders + Top -->
    <div class="grid lg:grid-cols-3 gap-4 mb-6">
      <div class="lg:col-span-2 card-premium overflow-hidden">
        <div class="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <div class="font-bold text-burgundy-deep">Commandes récentes</div>
            <div class="text-xs text-muted mt-0.5"><span class="live-dot mr-1"></span> Mise à jour en direct</div>
          </div>
          <button onclick="navigate('orders')" class="text-xs font-bold text-burgundy hover:text-gold">Voir tout →</button>
        </div>
        <div class="table-scroll">
          <table class="data-table w-full">
            <thead><tr><th>N°</th><th>Client</th><th>Articles</th><th>Total</th><th>Statut</th><th>Source</th></tr></thead>
            <tbody>
              ${recentOrders.map(o => `
                <tr class="data-row" onclick="openOrderModal('${o.id}')">
                  <td><span class="font-display text-burgundy-deep text-base">#${String(o.number).padStart(4,'0')}</span></td>
                  <td>
                    <div class="font-semibold text-burgundy-deep">${o.customer}</div>
                    <div class="text-xs text-muted">${o.phone || '—'}</div>
                  </td>
                  <td class="text-xs text-muted max-w-[200px] truncate">${o.items.map(i => `${i.qty}× ${i.name}`).join(', ')}</td>
                  <td class="font-bold text-burgundy-deep">${fmtFCFA(o.total)}</td>
                  <td><span class="badge ${STATUS_COLORS[o.status]}">${STATUS_LABELS[o.status]}</span></td>
                  <td><span class="text-xs font-bold px-2 py-0.5 rounded ${SOURCE_COLORS[o.source]}">${SOURCE_LABELS[o.source]}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card-premium overflow-hidden">
        <div class="px-5 py-4 border-b border-border">
          <div class="font-bold text-burgundy-deep">🏆 Top ventes (7j)</div>
        </div>
        <div class="p-4 space-y-2">
          ${getTopSellers(data).slice(0, 5).map((it, idx) => `
            <div class="flex items-center gap-3 p-2 rounded-lg hover:bg-cream">
              <div class="font-display text-2xl text-gold w-7">${idx + 1}</div>
              <div class="flex-1 min-w-0">
                <div class="font-semibold text-sm text-burgundy-deep truncate">${it.name}</div>
                <div class="text-xs text-muted">${it.count} ventes · ${fmtFCFA(it.revenue)}</div>
              </div>
              <div class="w-16 h-1.5 bg-border rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-burgundy to-gold" style="width: ${it.percent}%"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- Revenue Chart -->
    ${isOwner ? `
    <div class="card-premium overflow-hidden">
      <div class="px-5 py-4 border-b border-border">
        <div class="font-bold text-burgundy-deep">📊 Revenus des 7 derniers jours</div>
      </div>
      <div class="p-5"><div style="height:260px;"><canvas id="chart-week-revenue"></canvas></div></div>
    </div>
    ` : ''}
  `;
}

function afterRenderDashboard() {
  if (isOwner) {
    drawWeekRevenueChart();
  }
}

function getTopSellers(data) {
  const map = {};
  data.orders.filter(o => o.status !== 'cancelled').forEach(o => {
    o.items.forEach(i => {
      if (!map[i.id]) map[i.id] = { name: i.name, count: 0, revenue: 0 };
      map[i.id].count += i.qty;
      map[i.id].revenue += i.qty * i.price;
    });
  });
  const arr = Object.values(map).sort((a, b) => b.count - a.count);
  const max = arr[0]?.count || 1;
  return arr.map(x => ({ ...x, percent: Math.round((x.count / max) * 100) }));
}

function drawWeekRevenueChart() {
  const ctx = document.getElementById('chart-week-revenue');
  if (!ctx) return;
  if (chartRevenue) chartRevenue.destroy();
  chartRevenue = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Jeu', 'Ven', 'Sam', 'Dim', 'Lun', 'Mar', 'Auj.'],
      datasets: [{
        label: 'Revenus (FCFA)',
        data: [142000, 178000, 235000, 218000, 98000, 147000, 187500],
        backgroundColor: (ctx) => ctx.dataIndex === 6 ? '#D4A24C' : '#6B1F2A',
        borderRadius: 8,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => fmtFCFA(ctx.parsed.y)
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { callback: v => (v/1000) + 'k' }
        }
      }
    }
  });
}

// =============== ORDERS PAGE ===============
function renderOrders() {
  const data = window.MMData.loadData();
  let list = [...data.orders];

  if (filters.status !== 'all') list = list.filter(o => o.status === filters.status);
  if (filters.source !== 'all') list = list.filter(o => o.source === filters.source);
  if (filters.search) {
    const s = filters.search.toLowerCase();
    list = list.filter(o => o.customer.toLowerCase().includes(s) || o.phone.includes(s) || String(o.number).includes(s));
  }

  return `
    <div class="mb-5 flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 class="font-display text-3xl text-burgundy-deep">Toutes les commandes</h1>
        <p class="text-muted text-sm mt-1">${list.length} résultat${list.length>1?'s':''}</p>
      </div>
      ${isOwner ? '<button onclick="exportCSV()" class="btn-ghost text-sm">📥 Export CSV</button>' : ''}
    </div>

    <div class="card-premium p-4 mb-4">
      <div class="flex flex-wrap gap-2">
        <input id="filter-search" class="input-field flex-1 min-w-[200px]" placeholder="🔍 Rechercher (nom, téléphone, n°)..." value="${filters.search}">
        <select id="filter-status" class="input-field" style="width:auto;">
          <option value="all">📊 Tous statuts</option>
          <option value="pending" ${filters.status==='pending'?'selected':''}>Nouvelles</option>
          <option value="preparing" ${filters.status==='preparing'?'selected':''}>En préparation</option>
          <option value="ready" ${filters.status==='ready'?'selected':''}>Prêtes</option>
          <option value="delivered" ${filters.status==='delivered'?'selected':''}>Livrées</option>
          <option value="cancelled" ${filters.status==='cancelled'?'selected':''}>Annulées</option>
        </select>
        <select id="filter-source" class="input-field" style="width:auto;">
          <option value="all">🌐 Tous canaux</option>
          <option value="web" ${filters.source==='web'?'selected':''}>Web</option>
          <option value="phone" ${filters.source==='phone'?'selected':''}>Téléphone</option>
          <option value="walkin" ${filters.source==='walkin'?'selected':''}>Sur place</option>
        </select>
      </div>
    </div>

    <div class="card-premium overflow-hidden">
      <div class="table-scroll">
        <table class="data-table w-full">
          <thead><tr><th>N°</th><th>Heure</th><th>Client</th><th>Articles</th><th>Total</th><th>Paiement</th><th>Statut</th><th>Source</th></tr></thead>
          <tbody>
            ${list.length === 0 ? '<tr><td colspan="8" class="text-center text-muted py-12">Aucune commande</td></tr>' :
              list.map(o => `
                <tr class="data-row" onclick="openOrderModal('${o.id}')">
                  <td><span class="font-display text-burgundy-deep text-base">#${String(o.number).padStart(4,'0')}</span></td>
                  <td class="text-muted text-xs">${fmtDate(o.time)}<br>${fmtTime(o.time)}</td>
                  <td>
                    <div class="font-semibold text-burgundy-deep">${o.customer}</div>
                    <div class="text-xs text-muted">${o.phone || '—'}</div>
                  </td>
                  <td class="text-xs text-muted max-w-[220px] truncate">${o.items.map(i => `${i.qty}× ${i.name}`).join(', ')}</td>
                  <td class="font-bold text-burgundy-deep whitespace-nowrap">${fmtFCFA(o.total)}</td>
                  <td><div class="text-xs font-semibold">${PAYMENT_LABELS[o.payment]}</div>${o.paymentStatus==='received'?'<span class="badge bg-green-50 text-green-700 border-green-100 mt-0.5">Reçu</span>':o.paymentStatus==='pending'?'<span class="badge bg-gray-50 text-gray-700 border-gray-100 mt-0.5">En attente</span>':'<span class="badge bg-red-50 text-red-700 border-red-100 mt-0.5">Échoué</span>'}</td>
                  <td><span class="badge ${STATUS_COLORS[o.status]}">${STATUS_LABELS[o.status]}</span></td>
                  <td><span class="text-xs font-bold px-2 py-0.5 rounded ${SOURCE_COLORS[o.source]}">${SOURCE_LABELS[o.source]}</span></td>
                </tr>
              `).join('')
            }
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function afterRenderOrders() {
  document.getElementById('filter-search').addEventListener('input', e => {
    filters.search = e.target.value;
    render();
    setTimeout(() => document.getElementById('filter-search').focus(), 0);
  });
  document.getElementById('filter-status').addEventListener('change', e => {
    filters.status = e.target.value;
    render();
  });
  document.getElementById('filter-source').addEventListener('change', e => {
    filters.source = e.target.value;
    render();
  });
}

// =============== ORDER MODAL ===============
function openOrderModal(orderId) {
  const data = window.MMData.loadData();
  const o = data.orders.find(x => x.id === orderId);
  if (!o) return;

  const canDelete = isOwner;

  const html = `
    <div class="flex items-center justify-between mb-4">
      <div>
        <div class="font-display text-2xl text-burgundy-deep">Commande #${String(o.number).padStart(4,'0')}</div>
        <div class="text-xs text-muted">${new Date(o.time).toLocaleString('fr-FR')}</div>
      </div>
      <button onclick="closeModal()" class="w-8 h-8 rounded-full bg-cream hover:bg-cream-warm flex items-center justify-center">✕</button>
    </div>

    <div class="flex flex-wrap gap-2 mb-4">
      <span class="badge ${STATUS_COLORS[o.status]}">${STATUS_LABELS[o.status]}</span>
      <span class="text-xs font-bold px-2 py-0.5 rounded ${SOURCE_COLORS[o.source]}">${SOURCE_LABELS[o.source]}</span>
      <span class="badge bg-cream text-burgundy border-burgundy/30">${PAYMENT_LABELS[o.payment]} · ${o.paymentStatus === 'received' ? '✓ Reçu' : o.paymentStatus === 'pending' ? '⏳ En attente' : '✕ Échoué'}</span>
    </div>

    <div class="space-y-2 mb-4">
      <div class="flex justify-between text-sm py-1.5 border-b border-border"><span class="text-muted">Client</span><span class="font-semibold">${o.customer}</span></div>
      <div class="flex justify-between text-sm py-1.5 border-b border-border"><span class="text-muted">Téléphone</span><span class="font-semibold">${o.phone || '—'}</span></div>
      <div class="flex justify-between text-sm py-1.5 border-b border-border"><span class="text-muted">Adresse</span><span class="font-semibold text-right max-w-[60%]">${o.address}</span></div>
      ${o.notes ? `<div class="flex justify-between text-sm py-1.5 border-b border-border"><span class="text-muted">Notes</span><span class="font-semibold text-right max-w-[60%]">${o.notes}</span></div>` : ''}
    </div>

    <div class="bg-cream rounded-xl p-4 mb-4">
      ${o.items.map(i => `
        <div class="flex justify-between py-1 text-sm"><span>${i.qty}× ${i.name}</span><span class="font-semibold">${fmtFCFA(i.qty * i.price)}</span></div>
      `).join('')}
      <div class="flex justify-between py-1 text-sm mt-2 pt-2 border-t border-burgundy/15"><span class="text-muted">Sous-total</span><span>${fmtFCFA(o.subtotal)}</span></div>
      ${o.deliveryFee > 0 ? `<div class="flex justify-between py-1 text-sm"><span class="text-muted">Livraison</span><span>${fmtFCFA(o.deliveryFee)}</span></div>` : ''}
      <div class="flex justify-between font-display text-xl text-burgundy-deep mt-2 pt-2 border-t border-burgundy/15"><span>TOTAL</span><span>${fmtFCFA(o.total)}</span></div>
    </div>

    <div class="flex flex-wrap gap-2">
      ${getStatusActions(o)}
      ${o.phone ? `<a href="tel:${o.phone}" class="btn-ghost text-sm">📞 Appeler</a>` : ''}
      ${o.phone ? `<a href="https://wa.me/${o.phone.replace(/\\D/g,'')}" target="_blank" class="btn-ghost text-sm">💬 WhatsApp</a>` : ''}
      ${o.status !== 'cancelled' && o.status !== 'delivered' ? `<button onclick="cancelOrder('${o.id}')" class="btn-danger text-sm">✕ Annuler</button>` : ''}
      ${canDelete ? `<button onclick="deleteOrder('${o.id}')" class="btn-danger text-sm">🗑 Supprimer</button>` : ''}
    </div>
  `;
  showModal(html);
}

function getStatusActions(o) {
  const transitions = {
    pending: { next: 'preparing', label: '→ Marquer en préparation' },
    preparing: { next: 'ready', label: '→ Marquer comme prête' },
    ready: { next: 'delivered', label: '→ Marquer comme livrée' }
  };
  const t = transitions[o.status];
  if (!t) return '';
  return `<button onclick="updateOrderStatus('${o.id}', '${t.next}')" class="btn-primary text-sm">${t.label}</button>`;
}

function updateOrderStatus(orderId, newStatus) {
  const data = window.MMData.loadData();
  const o = data.orders.find(x => x.id === orderId);
  if (!o) return;
  o.status = newStatus;
  if (newStatus === 'delivered' && o.payment === 'cash') o.paymentStatus = 'received';
  window.MMData.saveData(data);
  closeModal();
  updateNavBadge();
  render();
  showToast('✓ Statut mis à jour', 'success');
}

function cancelOrder(orderId) {
  const data = window.MMData.loadData();
  const o = data.orders.find(x => x.id === orderId);
  if (!o) return;

  if (!isOwner) {
    requirePIN(() => doCancelOrder(orderId));
    return;
  }
  doCancelOrder(orderId);
}

function doCancelOrder(orderId) {
  const data = window.MMData.loadData();
  const o = data.orders.find(x => x.id === orderId);
  if (!o) return;
  o.status = 'cancelled';
  window.MMData.saveData(data);
  closeModal();
  render();
  showToast('Commande annulée', 'success');
}

function deleteOrder(orderId) {
  if (!isOwner) {
    requirePIN(() => doDeleteOrder(orderId));
    return;
  }
  if (!confirm('Supprimer cette commande définitivement ?')) return;
  doDeleteOrder(orderId);
}

function doDeleteOrder(orderId) {
  const data = window.MMData.loadData();
  data.orders = data.orders.filter(o => o.id !== orderId);
  window.MMData.saveData(data);
  closeModal();
  render();
  showToast('Commande supprimée', 'success');
}

// =============== NEW ORDER (PHONE / WALK-IN) ===============
var newOrderState = {
  channel: 'phone',
  customer: '',
  phone: '',
  address: '',
  zone: 1000,
  table: '',
  notes: '',
  items: [],
  payment: 'cash',
  paymentStatus: 'received',
  category: 'Burgers'
};

function renderNewOrder() {
  const data = window.MMData.loadData();
  const cats = ['Burgers', 'Classiques', 'Hors-Jeu', 'French Tacos', 'Sandwich Pita'];
  const itemsForCat = data.menu.filter(m => m.cat === newOrderState.category && m.available);

  const subtotal = newOrderState.items.reduce((s, i) => s + i.price * i.qty, 0);
  const delivery = newOrderState.channel === 'walkin' ? 0 : newOrderState.zone;

  return `
    <div class="mb-5">
      <h1 class="font-display text-3xl text-burgundy-deep">Nouvelle commande manuelle</h1>
      <p class="text-muted text-sm mt-1">Téléphone, sur place ou autres canaux</p>
    </div>

    <!-- Channel selector -->
    <div class="card-premium p-5 mb-4">
      <div class="font-bold text-burgundy-deep mb-3 flex items-center gap-2"><span class="w-7 h-7 bg-gold text-burgundy-deep rounded-full flex items-center justify-center font-bold text-sm">0</span> Type de commande</div>
      <div class="grid grid-cols-3 gap-2">
        ${[
          {key:'phone', icon:'📞', label:'Téléphone', desc:'Livraison à domicile'},
          {key:'walkin', icon:'🏪', label:'Sur place', desc:'Client au comptoir'},
          {key:'web', icon:'🌐', label:'Web (saisie)', desc:'Reçu en DM/etc.'}
        ].map(c => `
          <button onclick="setNewOrderChannel('${c.key}')" class="p-3 rounded-xl border-2 text-center transition ${newOrderState.channel === c.key ? 'border-burgundy bg-cream' : 'border-border bg-white hover:border-gold'}">
            <div class="text-2xl mb-1">${c.icon}</div>
            <div class="font-bold text-sm">${c.label}</div>
            <div class="text-xs text-muted mt-0.5">${c.desc}</div>
          </button>
        `).join('')}
      </div>
    </div>

    <div class="grid lg:grid-cols-3 gap-4">
      <div class="lg:col-span-2 space-y-4">
        <!-- Customer -->
        <div class="card-premium p-5">
          <div class="font-bold text-burgundy-deep mb-3 flex items-center gap-2"><span class="w-7 h-7 bg-gold text-burgundy-deep rounded-full flex items-center justify-center font-bold text-sm">1</span> ${newOrderState.channel === 'walkin' ? 'Client (sur place)' : 'Informations client'}</div>
          <div class="grid sm:grid-cols-2 gap-3">
            <div>
              <label class="text-xs font-bold uppercase tracking-wider text-burgundy">Téléphone ${newOrderState.channel === 'walkin' ? '<span class="text-muted font-normal">(optionnel)</span>' : ''}</label>
              <input id="no-phone" class="input-field mt-1" value="${newOrderState.phone}" placeholder="+221 77 XXX XX XX">
            </div>
            <div>
              <label class="text-xs font-bold uppercase tracking-wider text-burgundy">Nom ${newOrderState.channel === 'walkin' ? '<span class="text-muted font-normal">(optionnel)</span>' : ''}</label>
              <input id="no-name" class="input-field mt-1" value="${newOrderState.customer}" placeholder="Nom du client">
            </div>
            ${newOrderState.channel !== 'walkin' ? `
              <div class="sm:col-span-2">
                <label class="text-xs font-bold uppercase tracking-wider text-burgundy">Adresse de livraison</label>
                <input id="no-address" class="input-field mt-1" value="${newOrderState.address}" placeholder="Quartier, repère...">
              </div>
              <div>
                <label class="text-xs font-bold uppercase tracking-wider text-burgundy">Zone</label>
                <select id="no-zone" class="input-field mt-1">
                  <option value="1000">Plateau — 1 000 Fr</option>
                  <option value="1000">Sacré-Cœur — 1 000 Fr</option>
                  <option value="1000">Mermoz — 1 000 Fr</option>
                  <option value="1500">Almadies — 1 500 Fr</option>
                  <option value="1500">Ngor — 1 500 Fr</option>
                </select>
              </div>
            ` : `
              <div>
                <label class="text-xs font-bold uppercase tracking-wider text-burgundy">Table / Comptoir</label>
                <input id="no-table" class="input-field mt-1" value="${newOrderState.table}" placeholder="Table 4">
              </div>
            `}
            <div class="${newOrderState.channel === 'walkin' ? '' : ''}">
              <label class="text-xs font-bold uppercase tracking-wider text-burgundy">Notes</label>
              <input id="no-notes" class="input-field mt-1" value="${newOrderState.notes}" placeholder="Sans oignons...">
            </div>
          </div>
        </div>

        <!-- Items -->
        <div class="card-premium p-5">
          <div class="font-bold text-burgundy-deep mb-3 flex items-center gap-2"><span class="w-7 h-7 bg-gold text-burgundy-deep rounded-full flex items-center justify-center font-bold text-sm">2</span> Articles</div>
          <div class="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-3">
            ${cats.map(c => `
              <button onclick="setNewOrderCategory('${c}')" class="px-3 py-1.5 rounded-full font-bold text-xs whitespace-nowrap transition ${newOrderState.category === c ? 'bg-burgundy text-white' : 'bg-cream text-burgundy border border-border'}">${c}</button>
            `).join('')}
          </div>
          <div class="grid sm:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
            ${itemsForCat.map(it => {
              const inCart = newOrderState.items.find(x => x.id === it.id);
              const qty = inCart ? inCart.qty : 0;
              return `
                <div class="border border-border rounded-xl p-3 flex items-center gap-2">
                  <div class="text-2xl">${it.image}</div>
                  <div class="flex-1 min-w-0">
                    <div class="font-semibold text-sm leading-tight truncate">${it.name}</div>
                    <div class="text-xs text-muted">${fmtFCFA(it.price)}</div>
                  </div>
                  <div class="flex items-center gap-1">
                    <button onclick="changeNewOrderQty('${it.id}', -1)" class="w-7 h-7 rounded-md bg-cream hover:bg-burgundy hover:text-white font-bold">−</button>
                    <span class="w-6 text-center font-bold text-sm">${qty}</span>
                    <button onclick="changeNewOrderQty('${it.id}', 1)" class="w-7 h-7 rounded-md bg-cream hover:bg-burgundy hover:text-white font-bold">+</button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Payment -->
        <div class="card-premium p-5">
          <div class="font-bold text-burgundy-deep mb-3 flex items-center gap-2"><span class="w-7 h-7 bg-gold text-burgundy-deep rounded-full flex items-center justify-center font-bold text-sm">3</span> Paiement</div>
          <div class="grid grid-cols-3 gap-2 mb-3">
            ${[
              {key:'wave', label:'Wave', color:'bg-[#1DC8F9]', initial:'W'},
              {key:'orange_money', label:'Orange Money', color:'bg-[#FF6B00]', initial:'OM'},
              {key:'cash', label:'Cash', color:'bg-green-500', initial:'$'}
            ].map(p => `
              <button onclick="setNewOrderPayment('${p.key}')" class="p-3 rounded-xl border-2 text-center transition ${newOrderState.payment === p.key ? 'border-burgundy bg-cream' : 'border-border bg-white hover:border-gold'}">
                <div class="w-8 h-8 ${p.color} text-white mx-auto flex items-center justify-center font-bold text-xs rounded-lg">${p.initial}</div>
                <div class="font-bold text-xs mt-1">${p.label}</div>
              </button>
            `).join('')}
          </div>
          <div class="grid sm:grid-cols-2 gap-3">
            <div>
              <label class="text-xs font-bold uppercase tracking-wider text-burgundy">Statut paiement</label>
              <select id="no-paystatus" class="input-field mt-1">
                <option value="pending" ${newOrderState.paymentStatus === 'pending' ? 'selected' : ''}>⏳ En attente</option>
                <option value="received" ${newOrderState.paymentStatus === 'received' ? 'selected' : ''}>✓ Reçu</option>
              </select>
            </div>
            <div>
              <label class="text-xs font-bold uppercase tracking-wider text-burgundy">Réf. transaction (optionnel)</label>
              <input id="no-payref" class="input-field mt-1" placeholder="TX-...">
            </div>
          </div>
        </div>
      </div>

      <!-- Summary -->
      <div class="lg:sticky lg:top-20 self-start">
        <div class="bg-burgundy-deep text-cream rounded-2xl p-5 shadow-xl">
          <div class="font-display text-xl mb-3">Récapitulatif</div>
          ${newOrderState.items.length === 0 ? '<p class="text-cream/60 text-sm py-4 text-center">Aucun article sélectionné</p>' : newOrderState.items.map(i => `
            <div class="flex justify-between text-sm py-1">
              <span>${i.qty}× ${i.name}</span>
              <span>${fmtFCFA(i.qty * i.price)}</span>
            </div>
          `).join('')}
          <div class="border-t border-cream/20 mt-3 pt-3 space-y-1 text-sm opacity-80">
            <div class="flex justify-between"><span>Sous-total</span><span>${fmtFCFA(subtotal)}</span></div>
            ${newOrderState.channel !== 'walkin' ? `<div class="flex justify-between"><span>Livraison</span><span>${fmtFCFA(delivery)}</span></div>` : ''}
          </div>
          <div class="border-t border-cream/20 mt-3 pt-3 flex justify-between items-baseline font-display text-2xl">
            <span>Total</span><span class="text-gold">${fmtFCFA(subtotal + delivery)}</span>
          </div>
          <button onclick="submitNewOrder()" class="btn-gold w-full justify-center mt-4 py-3">✓ Valider la commande</button>
        </div>
      </div>
    </div>
  `;
}

function afterRenderNewOrder() {
  const sync = () => {
    const phone = document.getElementById('no-phone');
    const name = document.getElementById('no-name');
    const notes = document.getElementById('no-notes');
    if (phone) phone.addEventListener('input', e => newOrderState.phone = e.target.value);
    if (name) name.addEventListener('input', e => newOrderState.customer = e.target.value);
    if (notes) notes.addEventListener('input', e => newOrderState.notes = e.target.value);
    const addr = document.getElementById('no-address');
    if (addr) addr.addEventListener('input', e => newOrderState.address = e.target.value);
    const zone = document.getElementById('no-zone');
    if (zone) zone.addEventListener('change', e => { newOrderState.zone = parseInt(e.target.value); render(); });
    const table = document.getElementById('no-table');
    if (table) table.addEventListener('input', e => newOrderState.table = e.target.value);
    const ps = document.getElementById('no-paystatus');
    if (ps) ps.addEventListener('change', e => newOrderState.paymentStatus = e.target.value);
  };
  sync();
}

function setNewOrderChannel(ch) {
  newOrderState.channel = ch;
  if (ch === 'walkin' && !newOrderState.customer) newOrderState.customer = 'Client comptoir';
  render();
}

function setNewOrderCategory(c) {
  newOrderState.category = c;
  render();
}

function setNewOrderPayment(p) {
  newOrderState.payment = p;
  if (newOrderState.channel === 'walkin') newOrderState.paymentStatus = 'received';
  render();
}

function changeNewOrderQty(id, delta) {
  const data = window.MMData.loadData();
  const item = data.menu.find(m => m.id === id);
  if (!item) return;
  const existing = newOrderState.items.find(x => x.id === id);
  if (existing) {
    existing.qty += delta;
    if (existing.qty <= 0) {
      newOrderState.items = newOrderState.items.filter(x => x.id !== id);
    }
  } else if (delta > 0) {
    newOrderState.items.push({ id, name: item.name, price: item.price, qty: 1 });
  }
  render();
}

function submitNewOrder() {
  if (newOrderState.items.length === 0) {
    showToast('Ajoutez au moins un article', 'error');
    return;
  }
  if (newOrderState.channel !== 'walkin' && (!newOrderState.customer || !newOrderState.phone || !newOrderState.address)) {
    showToast('Remplissez les infos client', 'error');
    return;
  }

  const data = window.MMData.loadData();
  const subtotal = newOrderState.items.reduce((s, i) => s + i.price * i.qty, 0);
  const delivery = newOrderState.channel === 'walkin' ? 0 : newOrderState.zone;
  const maxNum = Math.max(...data.orders.map(o => o.number), 100);

  const newOrder = {
    id: 'ord_' + Date.now(),
    number: maxNum + 1,
    time: new Date().toISOString(),
    status: newOrderState.channel === 'walkin' ? 'delivered' : 'preparing',
    customer: newOrderState.customer || 'Client comptoir',
    phone: newOrderState.phone,
    address: newOrderState.channel === 'walkin' ? `Sur place — ${newOrderState.table || 'Comptoir'}` : newOrderState.address,
    source: newOrderState.channel,
    payment: newOrderState.payment,
    paymentStatus: newOrderState.paymentStatus,
    items: newOrderState.items,
    subtotal,
    deliveryFee: delivery,
    total: subtotal + delivery,
    notes: newOrderState.notes
  };
  data.orders.unshift(newOrder);
  window.MMData.saveData(data);

  newOrderState = { channel: 'phone', customer: '', phone: '', address: '', zone: 1000, table: '', notes: '', items: [], payment: 'cash', paymentStatus: 'received', category: 'Burgers' };

  showToast('✓ Commande #' + String(newOrder.number).padStart(4,'0') + ' enregistrée !', 'success');
  navigate('orders');
}

// =============== MENU PAGE ===============
function renderMenuPage() {
  const data = window.MMData.loadData();

  return `
    <div class="mb-5 flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 class="font-display text-3xl text-burgundy-deep">Gestion du menu</h1>
        <p class="text-muted text-sm mt-1">${isOwner ? 'Modifiez, ajoutez ou retirez des articles' : 'Consultation uniquement'}</p>
      </div>
      ${isOwner ? '<button onclick="openMenuItemModal()" class="btn-primary text-sm">+ Nouvel article</button>' : ''}
    </div>

    <div class="card-premium overflow-hidden">
      <div class="table-scroll">
        <table class="data-table w-full">
          <thead><tr><th>Article</th><th>Catégorie</th><th>Prix</th><th>Statut</th><th>Ventes (7j)</th>${isOwner ? '<th>Actions</th>' : ''}</tr></thead>
          <tbody>
            ${data.menu.map(it => {
              const sales = getItemSales(it.id, data);
              return `
                <tr class="data-row">
                  <td>
                    <div class="flex items-center gap-2">
                      <span class="text-2xl">${it.image}</span>
                      <div>
                        <div class="font-bold text-burgundy-deep">${it.name}</div>
                        <div class="text-xs text-muted truncate max-w-[300px]">${it.desc}</div>
                      </div>
                    </div>
                  </td>
                  <td><span class="text-xs font-bold px-2 py-0.5 rounded bg-cream text-burgundy">${it.cat}</span></td>
                  <td class="font-bold text-burgundy-deep">${fmtFCFA(it.price)}</td>
                  <td>${it.available ? '<span class="badge bg-green-50 text-green-700 border-green-100">✓ Dispo</span>' : '<span class="badge bg-gray-50 text-gray-700 border-gray-200">⏸ Rupture</span>'}</td>
                  <td class="text-xs text-muted">${sales} ventes</td>
                  ${isOwner ? `<td>
                    <button onclick="event.stopPropagation(); toggleItemAvailable('${it.id}')" class="btn-ghost text-xs px-2 py-1">${it.available ? '⏸ Désactiver' : '▶ Activer'}</button>
                    <button onclick="event.stopPropagation(); openMenuItemModal('${it.id}')" class="btn-ghost text-xs px-2 py-1">✏ Modifier</button>
                    <button onclick="event.stopPropagation(); deleteMenuItem('${it.id}')" class="btn-danger text-xs px-2 py-1">🗑</button>
                  </td>` : ''}
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function afterRenderMenuPage() {}

function getItemSales(id, data) {
  let count = 0;
  data.orders.filter(o => o.status !== 'cancelled').forEach(o => {
    o.items.forEach(i => { if (i.id === id) count += i.qty; });
  });
  return count;
}

function toggleItemAvailable(id) {
  const data = window.MMData.loadData();
  const it = data.menu.find(m => m.id === id);
  if (!it) return;
  it.available = !it.available;
  window.MMData.saveData(data);
  render();
  showToast(it.available ? '✓ Article disponible' : '⏸ Article désactivé');
}

function deleteMenuItem(id) {
  if (!isOwner) { requirePIN(() => doDeleteMenuItem(id)); return; }
  if (!confirm('Supprimer cet article du menu ?')) return;
  doDeleteMenuItem(id);
}

function doDeleteMenuItem(id) {
  const data = window.MMData.loadData();
  data.menu = data.menu.filter(m => m.id !== id);
  window.MMData.saveData(data);
  render();
  showToast('Article supprimé');
}

function openMenuItemModal(id) {
  const data = window.MMData.loadData();
  const it = id ? data.menu.find(m => m.id === id) : { id: '', name: '', cat: 'Burgers', price: 1500, desc: '', image: '🍔', available: true };
  const isNew = !id;

  const html = `
    <div class="flex items-center justify-between mb-4">
      <div class="font-display text-2xl text-burgundy-deep">${isNew ? 'Nouvel article' : 'Modifier'}</div>
      <button onclick="closeModal()" class="w-8 h-8 rounded-full bg-cream flex items-center justify-center">✕</button>
    </div>
    <div class="space-y-3">
      <div>
        <label class="text-xs font-bold uppercase tracking-wider text-burgundy">Nom</label>
        <input id="mi-name" class="input-field mt-1" value="${it.name}">
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="text-xs font-bold uppercase tracking-wider text-burgundy">Catégorie</label>
          <select id="mi-cat" class="input-field mt-1">
            ${['Burgers','Classiques','Hors-Jeu','French Tacos','Sandwich Pita'].map(c => `<option value="${c}" ${it.cat===c?'selected':''}>${c}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="text-xs font-bold uppercase tracking-wider text-burgundy">Prix (FCFA)</label>
          <input id="mi-price" type="number" class="input-field mt-1" value="${it.price}">
        </div>
      </div>
      <div>
        <label class="text-xs font-bold uppercase tracking-wider text-burgundy">Description</label>
        <textarea id="mi-desc" class="input-field mt-1" rows="2">${it.desc}</textarea>
      </div>
      <div>
        <label class="text-xs font-bold uppercase tracking-wider text-burgundy">Icône emoji</label>
        <input id="mi-image" class="input-field mt-1" value="${it.image}" placeholder="🍔">
      </div>
    </div>
    <div class="flex gap-2 mt-5">
      <button onclick="closeModal()" class="btn-ghost flex-1 justify-center">Annuler</button>
      <button onclick="saveMenuItem('${id || ''}')" class="btn-primary flex-1 justify-center">${isNew ? 'Créer' : 'Enregistrer'}</button>
    </div>
  `;
  showModal(html);
}

function saveMenuItem(id) {
  const data = window.MMData.loadData();
  const fields = {
    name: document.getElementById('mi-name').value.trim(),
    cat: document.getElementById('mi-cat').value,
    price: parseInt(document.getElementById('mi-price').value) || 0,
    desc: document.getElementById('mi-desc').value.trim(),
    image: document.getElementById('mi-image').value.trim() || '🍔'
  };
  if (!fields.name) { showToast('Le nom est requis', 'error'); return; }

  if (id) {
    const it = data.menu.find(m => m.id === id);
    if (it) Object.assign(it, fields);
  } else {
    data.menu.push({ id: 'm_' + Date.now(), ...fields, available: true });
  }
  window.MMData.saveData(data);
  closeModal();
  render();
  showToast('✓ Article enregistré');
}

// =============== ANALYTICS (Owner only) ===============
function renderAnalytics() {
  return `
    <div class="mb-5">
      <h1 class="font-display text-3xl text-burgundy-deep">Statistiques</h1>
      <p class="text-muted text-sm mt-1">Analysez vos performances et tendances</p>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      <div class="kpi-card-modern">
        <div class="text-xs font-bold uppercase tracking-wider text-muted mb-2">📊 Revenu ce mois</div>
        <div class="font-display text-3xl text-burgundy-deep">4 875k <span class="text-sm text-muted font-sans">FCFA</span></div>
        <div class="text-xs text-green-600 font-semibold mt-1">↗ +28% vs mois -1</div>
      </div>
      <div class="kpi-card-modern">
        <div class="text-xs font-bold uppercase tracking-wider text-muted mb-2">📦 Commandes ce mois</div>
        <div class="font-display text-3xl text-burgundy-deep">847</div>
        <div class="text-xs text-green-600 font-semibold mt-1">↗ +156 vs mois -1</div>
      </div>
      <div class="kpi-card-modern">
        <div class="text-xs font-bold uppercase tracking-wider text-muted mb-2">💵 Panier moyen</div>
        <div class="font-display text-3xl text-burgundy-deep">5 760 <span class="text-sm text-muted font-sans">Fr</span></div>
        <div class="text-xs text-green-600 font-semibold mt-1">↗ +8%</div>
      </div>
      <div class="kpi-card-modern">
        <div class="text-xs font-bold uppercase tracking-wider text-muted mb-2">⏰ Heure de pointe</div>
        <div class="font-display text-3xl text-burgundy-deep">20h</div>
        <div class="text-xs text-muted mt-1">Ven-Sam-Dim</div>
      </div>
    </div>

    <div class="grid lg:grid-cols-2 gap-4 mb-4">
      <div class="card-premium p-5">
        <div class="font-bold text-burgundy-deep mb-3">💳 Répartition paiements</div>
        <div style="height:240px;"><canvas id="chart-pay"></canvas></div>
      </div>
      <div class="card-premium p-5">
        <div class="font-bold text-burgundy-deep mb-3">📱 Canaux de commande</div>
        <div style="height:240px;"><canvas id="chart-channels"></canvas></div>
      </div>
    </div>

    <div class="card-premium p-5">
      <div class="font-bold text-burgundy-deep mb-3">📈 Revenus du mois</div>
      <div style="height:280px;"><canvas id="chart-monthly"></canvas></div>
    </div>
  `;
}

function afterRenderAnalytics() {
  if (chartPayments) chartPayments.destroy();
  chartPayments = new Chart(document.getElementById('chart-pay'), {
    type: 'doughnut',
    data: {
      labels: ['Wave', 'Orange Money', 'Cash'],
      datasets: [{ data: [44, 30, 26], backgroundColor: ['#1DC8F9', '#FF6B00', '#16A34A'], borderWidth: 0 }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
  });

  if (chartChannels) chartChannels.destroy();
  chartChannels = new Chart(document.getElementById('chart-channels'), {
    type: 'doughnut',
    data: {
      labels: ['Web', 'Téléphone', 'Sur place'],
      datasets: [{ data: [52, 30, 18], backgroundColor: ['#2563EB', '#D4A24C', '#16A34A'], borderWidth: 0 }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
  });

  new Chart(document.getElementById('chart-monthly'), {
    type: 'line',
    data: {
      labels: Array.from({length: 18}, (_, i) => `${i+1} mai`),
      datasets: [{
        label: 'Revenus journaliers',
        data: [98, 142, 178, 235, 218, 124, 156, 187, 198, 167, 142, 178, 235, 218, 98, 142, 187, 187].map(x => x*1000),
        borderColor: '#6B1F2A',
        backgroundColor: 'rgba(107,31,42,0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#D4A24C',
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => fmtFCFA(ctx.parsed.y) } } },
      scales: { y: { beginAtZero: true, ticks: { callback: v => (v/1000)+'k' } } }
    }
  });
}

// =============== EMPLOYEES (Owner only) ===============
function renderEmployees() {
  const data = window.MMData.loadData();
  return `
    <div class="mb-5 flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 class="font-display text-3xl text-burgundy-deep">Employés</h1>
        <p class="text-muted text-sm mt-1">${data.employees.length} membres dans l'équipe</p>
      </div>
      <button onclick="showToast('Fonctionnalité bientôt disponible')" class="btn-primary text-sm">+ Ajouter un employé</button>
    </div>

    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      ${data.employees.map(e => `
        <div class="card-premium p-5">
          <div class="flex items-start gap-3">
            <div class="w-14 h-14 rounded-full ${e.active ? 'bg-burgundy' : 'bg-gray-300'} text-cream flex items-center justify-center font-bold text-xl">${e.name[0]}</div>
            <div class="flex-1 min-w-0">
              <div class="font-bold text-burgundy-deep">${e.name}</div>
              <div class="text-xs text-muted">${e.role}</div>
              <div class="mt-1">
                ${e.active ? '<span class="badge bg-green-50 text-green-700 border-green-100">✓ Actif</span>' : '<span class="badge bg-gray-100 text-gray-600 border-gray-200">Inactif</span>'}
              </div>
            </div>
          </div>
          <div class="mt-4 space-y-1 text-xs text-muted">
            <div>👤 ${e.username}</div>
            <div>📞 ${e.phone}</div>
            <div>📅 Depuis ${new Date(e.joined).toLocaleDateString('fr-FR')}</div>
          </div>
          <div class="flex gap-2 mt-4">
            <button onclick="toggleEmployee('${e.id}')" class="btn-ghost text-xs flex-1 justify-center">${e.active ? 'Désactiver' : 'Activer'}</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}
function afterRenderEmployees() {}

function toggleEmployee(id) {
  const data = window.MMData.loadData();
  const e = data.employees.find(x => x.id === id);
  if (!e) return;
  e.active = !e.active;
  window.MMData.saveData(data);
  render();
  showToast('✓ Statut mis à jour');
}

// =============== SETTINGS (Owner only) ===============
function renderSettings() {
  const data = window.MMData.loadData();
  const s = data.settings;
  return `
    <div class="mb-5">
      <h1 class="font-display text-3xl text-burgundy-deep">Paramètres</h1>
      <p class="text-muted text-sm mt-1">Configurez votre restaurant</p>
    </div>

    <div class="space-y-4">
      <div class="card-premium p-5">
        <div class="font-bold text-burgundy-deep mb-3">🏪 Informations</div>
        <div class="grid sm:grid-cols-2 gap-3">
          <div><label class="text-xs font-bold uppercase tracking-wider text-burgundy">Nom du restaurant</label><input id="set-name" class="input-field mt-1" value="${s.restaurantName}"></div>
          <div><label class="text-xs font-bold uppercase tracking-wider text-burgundy">Téléphone</label><input id="set-phone" class="input-field mt-1" value="${s.phone}"></div>
        </div>
      </div>

      <div class="card-premium p-5">
        <div class="font-bold text-burgundy-deep mb-3">💸 Numéros de paiement</div>
        <div class="grid sm:grid-cols-2 gap-3">
          <div><label class="text-xs font-bold uppercase tracking-wider text-burgundy">Wave</label><input id="set-wave" class="input-field mt-1" value="${s.waveNumber}"></div>
          <div><label class="text-xs font-bold uppercase tracking-wider text-burgundy">Orange Money</label><input id="set-om" class="input-field mt-1" value="${s.omNumber}"></div>
        </div>
      </div>

      <div class="card-premium p-5">
        <div class="font-bold text-burgundy-deep mb-3">🕐 Heures d'ouverture</div>
        <div class="grid sm:grid-cols-2 gap-3">
          <div><label class="text-xs font-bold uppercase tracking-wider text-burgundy">Ouverture</label><input type="time" class="input-field mt-1" value="${s.hoursOpen}"></div>
          <div><label class="text-xs font-bold uppercase tracking-wider text-burgundy">Fermeture</label><input type="time" class="input-field mt-1" value="${s.hoursClose}"></div>
        </div>
      </div>

      <div class="card-premium p-5">
        <div class="font-bold text-burgundy-deep mb-3">🛵 Zones de livraison</div>
        <div class="space-y-2">
          ${s.deliveryZones.map((z, i) => `
            <div class="flex gap-2 items-center">
              <input class="input-field flex-1" value="${z.name}" data-zone-name="${i}">
              <input type="number" class="input-field w-32" value="${z.fee}" data-zone-fee="${i}"> Fr
            </div>
          `).join('')}
        </div>
      </div>

      <div class="card-premium p-5 bg-red-50 border-red-200">
        <div class="font-bold text-red-700 mb-2">⚠️ Zone dangereuse</div>
        <p class="text-sm text-red-600 mb-3">Réinitialiser toutes les données de démonstration (commandes, menu, employés).</p>
        <button onclick="if(confirm('Réinitialiser toutes les données ?')) { window.MMData.resetData(); location.reload(); }" class="btn-danger text-sm">🔄 Réinitialiser la démo</button>
      </div>

      <button onclick="saveSettings()" class="btn-primary w-full justify-center">💾 Enregistrer les modifications</button>
    </div>
  `;
}
function afterRenderSettings() {}

function saveSettings() {
  const data = window.MMData.loadData();
  data.settings.restaurantName = document.getElementById('set-name').value;
  data.settings.phone = document.getElementById('set-phone').value;
  data.settings.waveNumber = document.getElementById('set-wave').value;
  data.settings.omNumber = document.getElementById('set-om').value;
  window.MMData.saveData(data);
  showToast('✓ Paramètres enregistrés');
}

// =============== PIN MODAL ===============
function requirePIN(callback) {
  const html = `
    <div class="text-center">
      <div class="text-5xl mb-3">🔒</div>
      <div class="font-display text-2xl text-burgundy-deep mb-2">PIN Manager Requis</div>
      <p class="text-muted text-sm mb-5">Cette action est protégée. Entrez le PIN manager pour continuer.</p>
      <input id="pin-input" type="password" inputmode="numeric" maxlength="4" class="input-field text-center text-3xl tracking-[1rem] font-display" placeholder="••••" autofocus>
      <div id="pin-error" class="text-red-600 text-sm mt-2 hidden">PIN incorrect</div>
      <div class="flex gap-2 mt-5">
        <button onclick="closeModal()" class="btn-ghost flex-1 justify-center">Annuler</button>
        <button id="pin-submit" class="btn-primary flex-1 justify-center">Valider</button>
      </div>
      <p class="text-xs text-muted mt-4 italic">💡 PIN démo : 4829</p>
    </div>
  `;
  showModal(html);
  setTimeout(() => {
    const input = document.getElementById('pin-input');
    input?.focus();
    const submit = () => {
      const pin = input.value;
      if (window.MMAuth.checkPIN(pin)) {
        closeModal();
        callback();
      } else {
        document.getElementById('pin-error').classList.remove('hidden');
        input.value = '';
        input.focus();
      }
    };
    document.getElementById('pin-submit').addEventListener('click', submit);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
  }, 50);
}

// =============== MODAL HELPERS ===============
function showModal(html) {
  document.getElementById('modal-content').innerHTML = html;
  document.getElementById('modal').classList.add('open');
}
function closeModal() {
  document.getElementById('modal').classList.remove('open');
}
document.getElementById('modal').addEventListener('click', e => {
  if (e.target.id === 'modal') closeModal();
});

// =============== TOAST ===============
var toastTimer = null;
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast ' + type;
  setTimeout(() => t.classList.add('show'), 10);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
}

// =============== CSV EXPORT ===============
function exportCSV() {
  const data = window.MMData.loadData();
  const rows = [['N°', 'Date', 'Heure', 'Client', 'Téléphone', 'Articles', 'Sous-total', 'Livraison', 'Total', 'Paiement', 'Statut paiement', 'Statut', 'Source']];
  data.orders.forEach(o => {
    rows.push([
      '#' + String(o.number).padStart(4,'0'),
      fmtDate(o.time),
      fmtTime(o.time),
      o.customer,
      o.phone,
      o.items.map(i => `${i.qty}× ${i.name}`).join(' | '),
      o.subtotal,
      o.deliveryFee,
      o.total,
      PAYMENT_LABELS[o.payment],
      o.paymentStatus,
      STATUS_LABELS[o.status],
      SOURCE_LABELS[o.source].replace(/[^\w]/g,'').trim()
    ]);
  });
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `miam-miam-commandes-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  showToast('✓ Export CSV téléchargé');
}

// =============== BOOTSTRAP ===============
init();
