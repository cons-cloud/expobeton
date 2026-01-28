# Importation Excel avec Organisations et Contacts

Ce guide explique comment utiliser la fonctionnalité d'importation Excel pour gérer les organisations et les contacts dans Expobeton Email.

## 🎯 **Fonctionnalités**

### ✅ **Importation Excel Intelligente**
- **Détection automatique** des colonnes (français/anglais)
- **Création automatique** des organisations
- **Validation des emails** et gestion des doublons
- **Mapping flexible** des champs
- **Support multilingue** des en-têtes

### ✅ **Gestion des Organisations**
- **Création automatique** si l'organisation n'existe pas
- **Association** des contacts à leurs organisations
- **Évitement des doublons** d'organisations
- **Informations complètes** : nom, adresse, téléphone, site web, secteur, taille

### ✅ **Contacts Enrichis**
- **Informations complètes** : email, nom, prénom, poste, téléphone, adresse
- **Organisation liée** automatiquement
- **Tags personnalisés**
- **Source tracking** (Excel, manuel, etc.)
- **Import par lots** avec suivi

## 📋 **Format Excel Supporté**

### Colonnes Reconnues (Français/Anglais)

| Français | Anglais | Description |
|---------|---------|-------------|
| email / e-mail / mail | email | **Obligatoire** |
| prénom / prenom | first_name | Prénom |
| nom / nom de famille | last_name | Nom de famille |
| nom complet / nom et prénom | full_name | Nom complet |
| poste / fonction / titre | job_title | Poste |
| téléphone / tel | phone | Téléphone fixe |
| portable / mobile | mobile | Téléphone portable |
| adresse | address | Adresse postale |
| ville | city | Ville |
| pays | country | Pays |
| organisation / entreprise / société | organization / company | Nom de l'organisation |
| département / service | department | Département |
| linkedin / profil linkedin | linkedin | Profil LinkedIn |
| notes / remarques / commentaires | notes | Notes |

### Exemple de Structure Excel

```
| email                    | prénom      | nom        | poste              | organisation        | ville      |
|--------------------------|-------------|------------|--------------------|---------------------|------------|
| jean.dupont@email.com   | Jean        | Dupont     | Directeur          | Expobeton RDC        | Kinshasa   |
| marie.martin@email.com  | Marie        | Martin     | Responsable RH     | Société ABC          | Lubumbashi |
| paul.kabeya@email.com   | Paul        | Kabeya     | Ingénieur          | Tech Solutions      | Goma       |
```

## 🚀 **Utilisation**

### 1. Préparer le Fichier Excel
- **Format** : `.xlsx` ou `.xls`
- **En-têtes** : Première ligne avec les noms de colonnes
- **Email obligatoire** : Chaque ligne doit avoir un email valide
- **Nettoyage** : Supprimer les lignes vides

### 2. Importer dans l'Application
1. Allez dans l'onglet "Contacts"
2. Cliquez sur "📁 Importer Excel"
3. Sélectionnez votre fichier
4. **Drag & Drop** ou cliquez pour parcourir
5. Validez l'importation

### 3. Résultats de l'Importation
- ✅ **Contacts importés** : Nombre de nouveaux contacts
- 🏢 **Organisations créées** : Nombre de nouvelles organisations
- ⚠️ **Doublons** : Contacts déjà existants (mis à jour)
- ❌ **Erreurs** : Problèmes rencontrés

## 📊 **Base de Données**

### Tables Modifiées

#### `organizations`
```sql
- id (UUID)
- name (VARCHAR, NOT NULL)
- address (TEXT)
- phone (VARCHAR)
- website (VARCHAR)
- industry (VARCHAR)
- size (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- user_id (UUID)
```

#### `contacts` (Améliorée)
```sql
- id (UUID)
- email (VARCHAR, NOT NULL)
- first_name (VARCHAR)
- last_name (VARCHAR)
- full_name (VARCHAR)
- job_title (VARCHAR)
- phone (VARCHAR)
- mobile (VARCHAR)
- address (TEXT)
- city (VARCHAR)
- country (VARCHAR)
- organization_id (UUID, FK)
- organization_name (VARCHAR)
- department (VARCHAR)
- linkedin_url (VARCHAR)
- notes (TEXT)
- tags (TEXT[])
- source (VARCHAR) -- 'excel', 'manual', etc.
- import_batch_id (UUID)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- user_id (UUID)
UNIQUE(email, user_id)
```

## 🔧 **Fichiers Techniques**

### `src/lib/excelImportService.ts`
- **Classe principale** pour l'importation Excel
- **Parsing intelligent** des colonnes
- **Validation** des données
- **Gestion des organisations**
- **Tracking des imports**

### Fonctions Clés
```typescript
// Lire le fichier Excel
ExcelImportService.readExcelFile(file: File)

// Importer dans Supabase
ExcelImportService.importContacts(contacts: ExcelContact[])

// Statistiques d'importation
ExcelImportService.getImportStats(batchId?: string)
```

## 🎯 **Cas d'Usage**

### 1. Importation de Liste de Prospects
- **Source** : Salons professionnels, achats de listes
- **Organisations** : Créées automatiquement
- **Segmentation** : Par secteur, taille, localisation

### 2. Migration depuis un Autre CRM
- **Export** : Format CSV/Excel de l'ancien système
- **Mapping** : Colonnes adaptées automatiquement
- **Historique** : Conservation des données existantes

### 3. Mise à Jour en Masse
- **Ajout** : Nouveaux contacts
- **Mise à jour** : Informations existantes
- **Dédoublonnage** : Automatique

## 🛡️ **Sécurité**

### RLS (Row Level Security)
- ✅ **Isolation utilisateur** : Chaque utilisateur voit ses données
- ✅ **Organisations privées** : Non partagées entre utilisateurs
- ✅ **Contacts sécurisés** : Accès par user_id

### Validation
- ✅ **Email format** : Validation regex
- ✅ **Données obligatoires** : Email requis
- ✅ **Nettoyage** : Espaces et caractères invalides

## 📈 **Statistiques et Reporting**

### Métriques Disponibles
- **Total contacts** : Par utilisateur
- **Source tracking** : Excel vs Manuel
- **Imports récents** : 7 derniers jours
- **Organisations** : Nombre total
- **Doublons gérés** : Statistiques de déduplication

### Export des Données
- **Contacts** : Format Excel
- **Organisations** : Format CSV
- **Historique** : Imports par lots

## 🚨 **Dépannage**

### Erreurs Communes

#### "Format de fichier non supporté"
- ✅ Vérifiez l'extension (`.xlsx` ou `.xls`)
- ✅ Assurez-vous que le fichier n'est pas corrompu

#### "Aucun email valide trouvé"
- ✅ Vérifiez la colonne email
- ✅ Nettoyez les données (espaces, caractères spéciaux)
- ✅ Validez le format des emails

#### "Erreur lors de l'importation"
- ✅ Vérifiez la connexion internet
- ✅ Contrôlez les permissions Supabase
- ✅ Consultez les logs dans la console

### Performance
- **Limite** : 1000 contacts par importation recommandée
- **Temps** : ~1 seconde par 100 contacts
- **Mémoire** : Optimisée pour gros fichiers

## 🔄 **Mises à Jour Futures**

### Prochaines Améliorations
- [ ] **Import CSV** en plus d'Excel
- [ ] **Mapping personnalisé** des colonnes
- [ ] **Aperçu avant importation**
- [ ] **Validation avancée** avec règles personnalisées
- [ ] **Import planifié** avec cron
- [ ] **API publique** pour imports externes
- [ ] **Templates d'importation** pré-configurés

---

🎉 **L'importation Excel est maintenant entièrement intégrée avec la gestion des organisations et les contacts !**
