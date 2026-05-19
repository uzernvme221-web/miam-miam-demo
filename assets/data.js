// =====================================================
// MIAM MIAM — Mock Data (frontend-only demo)
// All data persists in localStorage on first load
// =====================================================

const STORAGE_KEY = 'mm_data_v2';

const DEFAULT_DATA = {
  menu: [
    // Classiques
    { id: 'm01', cat: 'Classiques', name: 'Burger Local', price: 2000, desc: 'Pain burger, steak haché de boeuf, salade, oignon, tomate, œuf, fromage, frites, ketchup, mayonnaise', available: true, image: '🍔' },
    { id: 'm02', cat: 'Classiques', name: 'Chawarma Viande', price: 2000, desc: 'Pain arabe, bœuf mariné, tomate, oignon, persil, frites, sauce Tahini', available: true, image: '🥙' },
    { id: 'm03', cat: 'Classiques', name: 'Chawarma Poulet', price: 2500, desc: 'Pain arabe, poulet mariné, tomate, oignon, persil, frites, sauce Tahini', available: true, image: '🥙' },
    { id: 'm04', cat: 'Classiques', name: 'Fataya Complet', price: 1000, desc: 'Viande hachée, œuf, oignon, emmental, frites, ketchup, mayonnaise', available: true, image: '🥟' },
    { id: 'm05', cat: 'Classiques', name: 'Norvégienne', price: 1500, desc: 'Pain arabe, saucisse hot-dog, frites, sauce cocktail, emmental, œuf', available: true, image: '🌭' },
    // Hors-Jeu
    { id: 'm06', cat: 'Hors-Jeu', name: 'Philly Cheese', price: 3000, desc: 'Demi-baguette, viande au choix, oignons et poivrons sautés, frites, sauce tomate', available: true, image: '🥖' },
    { id: 'm07', cat: 'Hors-Jeu', name: 'Chawarma Delux', price: 3000, desc: 'Pain arabe, double portion de viande au choix, tomate, oignon, persil, frites, sauce Tahini', available: true, image: '🥙' },
    { id: 'm08', cat: 'Hors-Jeu', name: 'Pacha', price: 3000, desc: 'Pain arabe, saucisse hot-dog, viande au choix, frites, sauce cocktail, emmental, œuf', available: true, image: '🌯' },
    // Burgers
    { id: 'm09', cat: 'Burgers', name: 'Burger New-Yorkais', price: 1000, desc: 'Pain burger, steak haché de boeuf, salade, tomate, oignon, cheddar', available: true, image: '🍔' },
    { id: 'm10', cat: 'Burgers', name: 'Chicken Burger', price: 1500, desc: 'Pain burger, tenders de poulet, salade, tomate, oignon, cheddar, mayonnaise à l\'Italienne, bbq', available: true, image: '🍔' },
    { id: 'm11', cat: 'Burgers', name: 'Miammiam Burger', price: 4000, desc: 'Pain burger, 2 steaks hachés de boeuf, œuf, cheddar, salade, tomate, oignon, sauce MiamMiam', available: true, image: '🍔' },
    { id: 'm12', cat: 'Burgers', name: 'Burger Royal', price: 2500, desc: 'Pain burger, steak haché, salade, tomate, oignon, cheddar, sauce royale', available: true, image: '🍔' },
    { id: 'm13', cat: 'Burgers', name: 'Kebab Burger', price: 3500, desc: 'Pain burger, viande kebab, salade, tomate, oignon, sauce fromage, cheddar', available: true, image: '🍔' },
    { id: 'm14', cat: 'Burgers', name: 'Grilled Cheese Burger', price: 3500, desc: 'Pain burger, steak haché, cheddar, emmental, sauce MiamMiam, oignon confit', available: true, image: '🍔' },
    // French Tacos
    { id: 'm15', cat: 'French Tacos', name: 'Tacos Poulet', price: 3000, desc: 'Blanc de poulet mariné, cheddar, moutarde à l\'Italienne, frites, sauce fromagère', available: true, image: '🌮' },
    { id: 'm16', cat: 'French Tacos', name: 'Tacos Viande Filet', price: 3500, desc: 'Steak haché de boeuf, viande marinée, cheddar, frites, sauce fromagère', available: true, image: '🌮' },
    { id: 'm17', cat: 'French Tacos', name: 'Tacos Crispy Tenders', price: 3500, desc: 'Tenders de poulet frits, cheddar, moutarde, frites, sauce fromagère', available: true, image: '🌮' },
    { id: 'm18', cat: 'French Tacos', name: 'Tacos Kebab', price: 3000, desc: 'Viande kebab, salade, tomate, oignon, fromage, sauce fromagère', available: true, image: '🌮' },
    { id: 'm19', cat: 'French Tacos', name: 'Tacos Burger', price: 3000, desc: 'Steak de boeuf 100g, cheddar, frites, salade, tomate, œuf', available: true, image: '🌮' },
    { id: 'm20', cat: 'French Tacos', name: 'Tacos Chawarma', price: 3000, desc: 'Viande chawarma, tomate, oignon, persil, frites, sauce fromagère', available: true, image: '🌮' },
    // Sandwich Pita
    { id: 'm21', cat: 'Sandwich Pita', name: 'Chicken Chika', price: 3500, desc: 'Pain pita, poulet chika, salade, tomate, oignon, cheddar, sauce blanche, frites', available: true, image: '🥙' },
    { id: 'm22', cat: 'Sandwich Pita', name: "L'Américain", price: 3500, desc: 'Pain pita, steak haché de boeuf, jambon, œuf, salade, tomate, oignon, cheddar, sauce miammiam, frites', available: true, image: '🥙' },
    { id: 'm23', cat: 'Sandwich Pita', name: 'Chicken Crispy', price: 4000, desc: 'Pain pita, chicken crispy, salade, tomate, oignon, sauce tartare, bbq, cheddar, frites', available: true, image: '🥙' },
    { id: 'm24', cat: 'Sandwich Pita', name: 'Chicken Boursin', price: 4000, desc: 'Pain pita, blanc de poulet mariné, salade, tomate, oignon, boursin, cheddar, frites', available: true, image: '🥙' },
  ],

  orders: [],

  employees: [
    { id: 'emp1', username: 'employee1', name: 'Mamadou Sy', role: 'Caissier', phone: '+221 77 111 11 11', active: true, joined: '2024-08-15' },
    { id: 'emp2', username: 'employee2', name: 'Awa Diouf', role: 'Cuisinier', phone: '+221 77 222 22 22', active: true, joined: '2025-01-10' },
    { id: 'emp3', username: 'employee3', name: 'Ibrahima Ka', role: 'Livreur', phone: '+221 77 333 33 33', active: true, joined: '2025-03-22' },
    { id: 'emp4', username: 'employee4', name: 'Fatou Ndour', role: 'Cuisinier', phone: '+221 77 444 44 44', active: false, joined: '2024-05-05' },
  ],

  settings: {
    restaurantName: 'Miam Miam Food',
    phone: '+221 77 554 21 60',
    waveNumber: '+221 77 554 21 60',
    omNumber: '+221 77 554 21 60',
    hoursOpen: '11:00',
    hoursClose: '23:00',
    deliveryZones: [
      { name: 'Plateau', fee: 1000 },
      { name: 'Sacré-Cœur', fee: 1000 },
      { name: 'Mermoz', fee: 1000 },
      { name: 'Almadies', fee: 1500 },
      { name: 'Ngor', fee: 1500 },
    ]
  }
};

// === STORAGE HELPERS ===
function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DATA));
      return JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
    return JSON.parse(raw);
  } catch (e) {
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function resetData() {
  localStorage.removeItem(STORAGE_KEY);
  return loadData();
}

// === FORMATTERS ===
function fmtFCFA(n) {
  return new Intl.NumberFormat('fr-FR').format(n) + ' Fr';
}

function fmtTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

// === LABELS ===
const STATUS_LABELS = {
  pending: 'Nouvelle',
  preparing: 'En préparation',
  ready: 'Prête',
  delivered: 'Livrée',
  cancelled: 'Annulée'
};

const STATUS_COLORS = {
  pending: 'bg-blue-100 text-blue-700 border-blue-200',
  preparing: 'bg-orange-100 text-orange-700 border-orange-200',
  ready: 'bg-purple-100 text-purple-700 border-purple-200',
  delivered: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200'
};

const SOURCE_LABELS = {
  web: '🌐 Web',
  phone: '📞 Téléphone',
  walkin: '🏪 Sur place',
  whatsapp: '💬 WhatsApp'
};

const SOURCE_COLORS = {
  web: 'bg-blue-50 text-blue-700',
  phone: 'bg-amber-50 text-amber-700',
  walkin: 'bg-green-50 text-green-700',
  whatsapp: 'bg-emerald-50 text-emerald-700'
};

const PAYMENT_LABELS = {
  wave: 'Wave',
  orange_money: 'Orange Money',
  cash: 'Cash'
};

// Expose globally
window.MMData = { loadData, saveData, resetData, DEFAULT_DATA, STORAGE_KEY };
window.MMFmt = { fmtFCFA, fmtTime, fmtDate, STATUS_LABELS, STATUS_COLORS, SOURCE_LABELS, SOURCE_COLORS, PAYMENT_LABELS };
