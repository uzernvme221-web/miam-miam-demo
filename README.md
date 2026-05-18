# Miam Miam Food — Demo Frontend

Demo complete frontend-only d'un systeme de gestion pour restaurant fast-food a Dakar. **Aucun backend requis** — toutes les donnees sont mockees et persistent via `localStorage`.

## Comptes de demo

| Role | Username | Password | Acces |
|------|----------|----------|-------|
| **Proprietaire** | `niang` | `12345` | Toutes les fonctionnalites |
| **Employe** | `employee1` | `12345` | Limite (pas d'analytics, settings, suppression) |

**PIN manager** (pour debloquer les actions sensibles cote employe) : `4829`

## Structure

```
miam-miam-demo/
├── index.html          # Landing publique + panier + checkout
├── login.html          # Connexion fake
├── dashboard.html      # Dashboard owner/employee (role-aware)
├── vercel.json         # Config Vercel
├── README.md
└── assets/
    ├── styles.css      # Tokens brand (bourgogne/creme/or)
    ├── data.js         # Menu, commandes, employes mockes
    ├── auth.js         # Fake auth + session localStorage
    ├── landing.js      # Cart + checkout logic
    └── dashboard.js    # Toutes les pages admin
```

## Deploiement Vercel

```bash
npm i -g vercel
cd miam-miam-demo
vercel --prod
```

Ou: drag & drop le dossier sur vercel.com/new

## Limites de la demo

Ce demo est **frontend-only** et **persistance locale**. Pour une version production il faudra :
- Vrai backend (Supabase recommande)
- Authentification reelle
- Synchronisation multi-appareils
- Notifications push / SMS
- Verification automatique des paiements Wave/OM
