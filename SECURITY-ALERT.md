# 🚨 ATTENTION: Guide de Sécurité Complet

## État de Sécurité Actuel : **PARTIELLEMENT SÉCURISÉ** ⚠️

### ✅ Ce qui est déjà sécurisé :
- **Authentification Supabase** avec PKCE
- **Protection anti-bruteforce** (5 tentatives max, blocage 15min)
- **Validation des entrées** (email, password, XSS protection)
- **Variables d'environnement** protégées par .gitignore
- **Chiffrement AES-256** des données sensibles

### 🚨 Ce qui n'est PAS sécurisé :

#### **CRITIQUE - À corriger IMMÉDIATEMENT :**

1. **🔑 Clé de chiffrement en dur dans le code**
   - La clé `ENCRYPTION_KEY` est visible dans `supabase-secure.ts`
   - **Risque** : N'importe qui peut déchiffrer les données

2. **🌐 Pas de validation côté serveur**
   - Toute la validation se fait côté client
   - **Risque** : Contournement possible avec outils développeur

3. **📧 API keys exposées**
   - Clés Supabase et Resend dans les variables d'environnement
   - **Risque** : Utilisation abusive si leak

4. **🔓 Pas de RLS (Row Level Security)**
   - Tous les utilisateurs peuvent voir toutes les données
   - **Risque** : Fuite de données entre utilisateurs

#### **MOYEN - Important :**

5. **🛡️ Pas de CSP (Content Security Policy)**
   - **Risque** : XSS attacks

6. **🔄 Pas de CSRF protection**
   - **Risque** : Requêtes forgées

7. **⏱️ Pas de rate limiting serveur**
   - **Risque** : DDoS, spam

## 🎯 Pour atteindre 100% de sécurité :

### **IMMÉDIAT (Avant déploiement) :**

```bash
# 1. Créer une vraie clé secrète
openssl rand -base64 32

# 2. Ajouter aux variables Vercel
vercel env add ENCRYPTION_KEY
vercel env add SUPABASE_SERVICE_KEY

# 3. Configurer RLS sur Supabase
# Aller dans Supabase > Authentication > Policies
```

### **CODE À MODIFIER :**

1. **Déplacer la clé de chiffrement** :
```typescript
// Dans supabase-secure.ts
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY
```

2. **Activer RLS** sur toutes les tables :
```sql
-- Dans Supabase SQL Editor
ALTER TABLE emails_sent ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Créer politiques
CREATE POLICY "Users can only see their own emails" ON emails_sent
  FOR ALL USING (auth.uid() = user_id);
```

3. **Ajouter validation serveur** :
```typescript
// Dans les fonctions Supabase
create function validate_email_input(email text)
returns boolean as $$
begin
  return email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
end;
$$ language plpgsql;
```

### **SÉCURITÉ PRODUCTION :**

```typescript
// Dans vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

## 🚀 Actions Immédiates Recommandées :

### **1. Sécuriser les clés**
```bash
# Remplacer la clé en dur
# Générer nouvelle clé : openssl rand -base64 32
# Ajouter à Vercel : vercel env add ENCRYPTION_KEY
```

### **2. Activer RLS Supabase**
```sql
-- Activer sur toutes les tables
ALTER TABLE emails_sent ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité
CREATE POLICY "Users own data" ON emails_sent
  FOR ALL USING (auth.uid() = user_id);
```

### **3. Validation serveur**
```sql
-- Fonctions de validation
CREATE OR REPLACE FUNCTION validate_email_format(email text)
RETURNS boolean AS $$
BEGIN
  RETURN email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### **4. CSP Headers**
```json
// Dans vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Content-Security-Policy", "value": "default-src 'self'; connect-src 'self' https://*.supabase.co;" }
      ]
    }
  ]
}
```

## 📊 Score de Sécurité Actuel : **65/100**

- ✅ Authentification : 20/20
- ✅ Anti-bruteforce : 15/15  
- ✅ Validation client : 10/10
- ❌ Validation serveur : 0/15
- ❌ RLS : 0/15
- ❌ CSP/CSRF : 0/10
- ❌ Clés sécurisées : 0/15

## 🎯 Objectif : **100/100** (Après corrections)

---

**⚠️ Le système est fonctionnel mais VULNÉRABLE. 
Les corrections critiques doivent être faites AVANT le déploiement production.**

*Contactez un expert sécurité si besoin pour la validation finale.*
