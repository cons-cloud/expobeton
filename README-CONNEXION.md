# Guide de Connexion - Expobeton Email

Ce guide explique comment se connecter au dashboard avec les identifiants autorisés.

## 🔐 **Identifiants de Connexion**

### ✅ **Identifiants par Défaut**
- **Email** : `expobeton@gmail.com`
- **Mot de passe** : `Expobeton1@`

### 📝 **Configuration des Identifiants**

Les identifiants sont configurés dans le fichier `.env` :

```env
# Identifiants autorisés pour l'authentification
VITE_ALLOWED_EMAIL=expobeton@gmail.com
VITE_ALLOWED_PASSWORD=Expobeton1@
```

## 🚀 **Étapes de Connexion**

### 1. **Accéder à la Page de Connexion**
1. **Démarrez l'application** : `npm run dev`
2. **Ouvrez votre navigateur** : `http://localhost:5173`
3. **Vous serez redirigé** automatiquement vers la page de connexion

### 2. **Saisir les Identifiants**
1. **Email** : `expobeton@gmail.com`
2. **Mot de passe** : `Expobeton1@`
3. **Cliquez sur "Se connecter"**

### 3. **Accès au Dashboard**
- **Si succès** : Redirection automatique vers le dashboard
- **Si échec** : Message d'erreur "Identifiants incorrects"

## 🔧 **Personnalisation des Identifiants**

### Modifier les Identifiants
1. **Ouvrez le fichier** `.env`
2. **Modifiez les valeurs** :
   ```env
   VITE_ALLOWED_EMAIL=votre-email@personnalisé.com
   VITE_ALLOWED_PASSWORD=votre-mot-de-passe-sécurisé
   ```
3. **Redémarrez l'application** : `npm run dev`

### Exemple Personnalisé
```env
VITE_ALLOWED_EMAIL=admin@expobetonrdc.com
VITE_ALLOWED_PASSWORD=MonMotDePasse123!
```

## 🛡️ **Sécurité**

### ✅ **Système d'Authentification**
- **Validation locale** : Via `localStorage`
- **Variables d'environnement** : Identifiants non visibles dans le code
- **Session sécurisée** : Nettoyage automatique à la déconnexion

### 🔒 **Bonnes Pratiques**
- **Mot de passe fort** : Minimum 8 caractères, majuscules, chiffres, symboles
- **Email professionnel** : Utilisez une adresse email professionnelle
- **Ne partagez pas** : Gardez les identifiants confidentiels
- **Changez régulièrement** : Mettez à jour les identifiants périodiquement

## 🐛 **Dépannage**

### Problèmes Communs

#### "Identifiants incorrects"
1. ✅ **Vérifiez l'orthographe** : Pas d'espace, majuscules correctes
2. ✅ **Copiez-collez** : Évitez les erreurs de frappe
3. ✅ **Vérifiez le .env** : Assurez-vous que les variables sont correctes

#### "La page ne se charge pas"
1. ✅ **Redémarrez le serveur** : `npm run dev`
2. ✅ **Videz le cache** : Ctrl+F5 ou Cmd+Shift+R
3. ✅ **Vérifiez la console** : F12 pour voir les erreurs

#### "Redirection vers login"
1. ✅ **Session expirée** : Reconnectez-vous
2. ✅ **LocalStorage vidé** : Reconnectez-vous
3. ✅ **Erreur de navigation** : Rechargez la page

### Logs de Débogage
La console affiche les informations de connexion :

```javascript
// Tentative de connexion
Tentative de connexion avec: { email: "expobeton@gmail.com", password: "***" }

// Validation des identifiants
Validation des identifiants: true

// Connexion réussie
Connexion réussie, redirection vers dashboard...

// Dans le dashboard
Utilisateur authentifié: expobeton@gmail.com
```

## 🔄 **Processus d'Authentification**

### 1. **Connexion**
```typescript
// 1. Validation des identifiants
const isValid = validateCredentials(email, password)

// 2. Stockage local
localStorage.setItem('isAuthenticated', 'true')
localStorage.setItem('userEmail', email)

// 3. Redirection
navigate('/dashboard')
```

### 2. **Vérification Dashboard**
```typescript
// 1. Vérification localStorage
const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
const userEmail = localStorage.getItem('userEmail')

// 2. Chargement des données
if (isAuthenticated) {
  await loadData()
}
```

### 3. **Déconnexion**
```typescript
// 1. Nettoyage localStorage
localStorage.removeItem('isAuthenticated')
localStorage.removeItem('userEmail')

// 2. Déconnexion Supabase
await supabase.auth.signOut()

// 3. Redirection
navigate('/login')
```

## 📊 **États de Connexion**

### ✅ **Connecté**
- **Dashboard accessible** : Interface complète
- **Données chargées** : Statistiques, campagnes
- **Menu profil** : Déconnexion disponible

### ❌ **Non Connecté**
- **Page de login** : Formulaire d'authentification
- **Accès refusé** : Redirection automatique
- **Message d'erreur** : Si identifiants incorrects

### ⏳ **En Cours**
- **Écran de chargement** : Animation de progression
- **Vérification** : Validation des identifiants
- **Redirection** : Vers dashboard ou erreur

## 🎯 **Cas d'Usage**

### Développement Local
- **Identifiants par défaut** : Rapide pour les tests
- **Pas de configuration** : Fonctionne immédiatement
- **Logs détaillés** : Facile à déboguer

### Production
- **Identifiants personnalisés** : Sécurisés
- **Variables d'environnement** : Protégées
- **Session persistante** : Tant que le navigateur est ouvert

### Multi-utilisateurs (Futur)
- **Base de données** : Gestion des utilisateurs
- **Rôles et permissions** : Admin, utilisateur, etc.
- **Authentification Supabase** : Système complet

---

🎉 **Vous pouvez maintenant vous connecter avec les identifiants configurés !**

Utilisez `expobeton@gmail.com` / `Expobeton1@` pour accéder au dashboard.
