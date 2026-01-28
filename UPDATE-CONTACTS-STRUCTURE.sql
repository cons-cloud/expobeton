-- Script de mise à jour de la structure des contacts
-- Modifie pour correspondre exactement à l'import Excel : email + nom de l'organisation

-- 1. Mettre à jour la table contacts pour correspondre au format Excel
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS nom VARCHAR(100),
ADD COLUMN IF NOT EXISTS prenom VARCHAR(100),
ADD COLUMN IF NOT EXISTS societe VARCHAR(255),
ADD COLUMN IF NOT EXISTS telephone VARCHAR(50);

-- 2. Mettre à jour la colonne organization_name pour la renommer en societe
ALTER TABLE contacts 
RENAME COLUMN organization_name TO societe_backup;

-- 3. Créer une nouvelle colonne societe si elle n'existe pas déjà
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS societe VARCHAR(255);

-- 4. Mettre à les contacts existants pour utiliser la nouvelle structure
UPDATE contacts 
SET 
  nom = CASE 
    WHEN email LIKE '%@%' THEN SPLIT_PART(SPLIT_PART(email, '@', 1), '.', 1)
    ELSE 'Inconnu'
  END,
  societe = COALESCE(societe, societe_backup, 'Non spécifiée'),
  telephone = COALESCE(telephone, 'Non spécifié'),
  updated_at = NOW()
WHERE user_id = auth.uid();

-- 5. Créer une vue pour l'import Excel
CREATE OR REPLACE VIEW excel_import_structure AS
SELECT 
  'Colonnes requises pour Excel' as information,
  'email | nom | prénom | société | téléphone' as format

UNION ALL

SELECT 
  'Exemple de ligne' as information,
  'contact@entreprise.com | Dupont | Jean | Entreprise SA | +243123456789' as exemple

UNION ALL

SELECT 
  'Note importante' as information,
  'Seuls email et société seront utilisés pour la synchronisation' as note;

-- 6. Créer une fonction pour l'import Excel
CREATE OR REPLACE FUNCTION import_contacts_from_excel(
  p_email VARCHAR(255),
  p_nom VARCHAR(100),
  p_prenom VARCHAR(100),
  p_societe VARCHAR(255),
  p_telephone VARCHAR(50)
)
RETURNS UUID AS $$
DECLARE
  contact_id UUID;
  organization_id UUID;
BEGIN
  -- 1. Créer ou récupérer l'organisation
  INSERT INTO organizations (name, user_id)
  VALUES (p_societe, auth.uid())
  ON CONFLICT (name, user_id) 
  DO UPDATE SET updated_at = NOW()
  RETURNING id INTO organization_id;
  
  -- 2. Créer le contact
  INSERT INTO contacts (email, nom, prenom, societe, telephone, user_id)
  VALUES (p_email, p_nom, p_prenom, p_societe, p_telephone, auth.uid())
  ON CONFLICT (email, user_id) 
  DO UPDATE SET 
    nom = p_nom,
    prenom = p_prenom,
    societe = p_societe,
    telephone = p_telephone,
    updated_at = NOW()
  RETURNING id INTO contact_id;
  
  RETURN contact_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Créer une vue pour les contacts avec le format complet
CREATE OR REPLACE VIEW contacts_complets AS
SELECT 
  ct.id,
  ct.email,
  ct.nom,
  ct.prenom,
  ct.societe,
  ct.telephone,
  ct.created_at,
  ct.updated_at,
  COUNT(es.id) as emails_envoyes,
  COUNT(CASE WHEN es.status = 'delivered' THEN 1 END) as emails_livres,
  ct.user_id
FROM contacts ct
LEFT JOIN emails_sent es ON ct.id = es.contact_id
WHERE ct.user_id = auth.uid()
GROUP BY ct.id, ct.email, ct.nom, ct.prenom, ct.societe, ct.telephone, ct.created_at, ct.updated_at, ct.user_id
ORDER BY ct.societe, ct.nom, ct.prenom;

-- 8. Mettre à jour les templates pour utiliser les nouvelles variables
UPDATE email_templates 
SET 
  content = REPLACE(
    REPLACE(
      REPLACE(content, 
        '{{organization_name}}',
        '{{societe}}'
      ),
      '{{full_name}}',
        '{{nom}} {{prenom}}'
    ),
    '{{name}}',
    '{{nom}} {{prenom}}'
  ),
  updated_at = NOW()
WHERE user_id = auth.uid();

-- 9. Afficher la structure mise à jour
SELECT '=== STRUCTURE DES CONTACTS MISE À JOUR ===' as info;

-- Afficher le format Excel requis
SELECT * FROM excel_import_structure;

-- Afficher les contacts existants avec la nouvelle structure
SELECT '=== CONTACTS ACTUELS AVEC NOUVELLE STRUCTURE ===' as info;

SELECT 
  email,
  nom,
  prenom,
  societe,
  telephone,
  'FORMAT COMPLET' as status
FROM contacts 
WHERE user_id = auth.uid()
ORDER BY societe, nom, prenom;

-- 10. Instructions pour l'import Excel
SELECT '=== INSTRUCTIONS POUR IMPORT EXCEL ===' as info;

SELECT 
  'Étape 1' as etape,
  'Préparer fichier Excel avec colonnes: email, nom, prénom, société, téléphone' as instruction

UNION ALL

SELECT 
  'Étape 2' as etape,
  'Utiliser la fonction import_contacts_from_excel() pour chaque ligne' as instruction

UNION ALL

SELECT 
  'Étape 3' as etape,
  'Seuls email et société seront utilisés pour les envois' as instruction;

SELECT '=== MISE À JOUR TERMINÉE ===' as info;
