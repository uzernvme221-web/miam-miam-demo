// =====================================================
// MIAM MIAM — Fake Auth (frontend-only demo)
// =====================================================

var SESSION_KEY = 'mm_session_v1';
var MANAGER_PIN = '4829';

var CREDENTIALS = {
  niang: { password: '12345', role: 'owner', name: 'M. Niang', avatar: 'N' },
  employee1: { password: '12345', role: 'employee', name: 'Mamadou Sy', avatar: 'M' },
  employee2: { password: '12345', role: 'employee', name: 'Awa Diouf', avatar: 'A' },
};

function login(username, password) {
  const cred = CREDENTIALS[username.toLowerCase()];
  if (!cred || cred.password !== password) {
    return { success: false, error: 'Identifiants incorrects' };
  }
  const session = {
    username: username.toLowerCase(),
    role: cred.role,
    name: cred.name,
    avatar: cred.avatar,
    loginTime: new Date().toISOString()
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { success: true, session };
}

function logout() {
  localStorage.removeItem(SESSION_KEY);
  window.location.href = 'index.html';
}

function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function requireAuth() {
  const session = getSession();
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }
  return session;
}

function checkPIN(pin) {
  return pin === MANAGER_PIN;
}

window.MMAuth = { login, logout, getSession, requireAuth, checkPIN, MANAGER_PIN };
