# Configuration Supabase Complète - Expobeton Email

Ce guide explique comment configurer Supabase pour que tout soit connecté et fonctionnel.

## 🚀 **Étapes de Configuration**

### 1. **Créer l'Utilisateur Supabase**

#### Via l'Interface Supabase
1. **Allez dans votre projet** Supabase
2. **Menu** → `Authentication` → `Users`
3. **Cliquez sur** `Add User`
4. **Remplissez** :
   - **Email** : `expobeton@gmail.com`
   - **Password** : `Expobeton1@`
   - **Confirm Password** : `Expobeton1@`
5. **Cliquez sur** `Create User`
6. **Copiez l'UUID** généré (il ressemble à : `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

#### Via SQL (Alternative)
```sql
-- Dans l'éditeur SQL Supabase
INSERT INTO auth.users (
  instance_id,
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  last_sign_in_at,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud
) VALUES (
  'YOUR_INSTANCE_ID',
  gen_random_uuid(),
  'expobeton@gmail.com',
  crypt('Expobeton1@', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  NOW(),
  '{}',
  false,
  'authenticated',
  'authenticated'
);
```

### 2. **Exécuter le Script de Mise à Jour**

1. **Ouvrez** `update-schema-simple.sql`
2. **Copiez tout** le contenu
3. **Allez dans** Supabase → `SQL Editor`
4. **Collez** le script
5. **Cliquez sur** `Run`

### 3. **Créer les Données de Test**

1. **Ouvrez** `CREATE-SUPABASE-USER.sql`
2. **Remplacez** `YOUR_USER_ID_HERE` par l'UUID copié
3. **Exécutez** le script dans l'éditeur SQL

### 4. **Configurer les Variables d'Environnement**

Vérifiez votre fichier `.env` :
```env
# Configuration Supabase
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-cle-anonyme

# Identifiants (doivent correspondre à l'utilisateur créé)
VITE_ALLOWED_EMAIL=expobeton@gmail.com
VITE_ALLOWED_PASSWORD=Expobeton1@
```

## 🔧 **Vérification de la Configuration**

### 1. **Vérifier l'Utilisateur**
```sql
-- Vérifier que l'utilisateur existe
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at
FROM auth.users 
WHERE email = 'expobeton@gmail.com';
```

### 2. **Vérifier les Tables**
```sql
-- Vérifier les tables créées
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### 3. **Vérifier les Données**
```sql
-- Vérifier les campagnes
SELECT * FROM public.email_campaigns 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'expobeton@gmail.com');

-- Vérifier les emails envoyés
SELECT status, COUNT(*) as count 
FROM public.emails_sent 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'expobeton@gmail.com')
GROUP BY status;
```

## 🎯 **Test de Connexion**

### 1. **Démarrez l'Application**
```bash
npm run dev
```

### 2. **Testez la Connexion**
1. **Allez sur** `http://localhost:5173`
2. **Identifiants** :
   - **Email** : `expobeton@gmail.com`
   - **Mot de passe** : `Expobeton1@`
3. **Cliquez sur** `Se connecter`

### 3. **Vérifiez les Logs**
Dans la console du navigateur, vous devriez voir :
```
Tentative de connexion Supabase avec: {email: "expobeton@gmail.com", password: "***"}
Connexion Supabase réussie: expobeton@gmail.com
Redirection vers dashboard...
Utilisateur Supabase authentifié: expobeton@gmail.com
✅ Données Supabase chargées avec succès
```

## 🛠️ **Dépannage**

### Problème : "Invalid login credentials"
**Cause** : L'utilisateur n'existe pas ou le mot de passe est incorrect
**Solution** :
1. Vérifiez que l'utilisateur est créé dans `Authentication > Users`
2. Vérifiez que le mot de passe est `Expobeton1@`
3. Essayez de réinitialiser le mot de passe dans Supabase

### Problème : "User not authenticated"
**Cause** : La session Supabase n'est pas valide
**Solution** :
1. Déconnectez-vous et reconnectez-vous
2. Vérifiez les variables d'environnement
3. Nettoyez le cache du navigateur

### Problème : "relation does not exist"
**Cause** : Les tables n'ont pas été créées
**Solution** :
1. Exécutez `update-schema-simple.sql`
2. Vérifiez que toutes les tables sont créées
3. Vérifiez les permissions RLS

### Problème : "row-level security policy violation"
**Cause** : Les politiques RLS bloquent l'accès
**Solution** :
1. Vérifiez que les politiques RLS sont créées
2. Vérifiez que l'utilisateur a les bonnes permissions
3. Temporairement désactivez RLS pour tester

## 📊 **Architecture Complète**

### ✅ **Flux d'Authentification**
```
1. Login.tsx → supabase.auth.signInWithPassword()
2. Supabase Auth → Vérifie les identifiants
3. Session → Stockée dans le navigateur
4. Dashboard.tsx → supabase.auth.getUser()
5. Données → Chargées depuis les tables Supabase
```

### ✅ **Tables Supabase**
- **`auth.users`** : Utilisateurs authentifiés
- **`public.email_campaigns`** : Campagnes d'emails
- **`public.emails_sent`** : Emails envoyés
- **`public.contacts`** : Liste de contacts
- **`public.organizations`** : Organisations

### ✅ **Sécurité**
- **RLS (Row Level Security)** : Chaque utilisateur ne voit que ses données
- **Politiques par utilisateur** : `user_id = auth.uid()`
- **Sessions sécurisées** : Gérées par Supabase Auth

## 🔄 **Maintenance**

### Régulièrement
1. **Sauvegardez** votre base de données
2. **Surveillez** les logs d'erreurs
3. **Nettoyez** les anciennes données
4. **Mettez à jour** les politiques RLS

### En Production
1. **Activez** les backups automatiques
2. **Configurez** les alertes
3. **Surveillez** les performances
4. **Documentez** les changements

---

🎉 **Votre application est maintenant entièrement connectée à Supabase !**

Toutes les données sont synchronisées, sécurisées et persistantes. L'authentification est gérée par Supabase Auth et le dashboard affiche les données réelles de votre base de données.
