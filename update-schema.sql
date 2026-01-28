-- Script pour mettre à jour le schéma Supabase
-- Exécutez ce script dans l'éditeur SQL Supabase pour corriger les erreurs

-- 1. Mettre à jour la table contacts pour inclure organization_id
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- 2. Ajouter les colonnes manquantes à la table contacts
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS full_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS job_title VARCHAR(100),
ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS mobile VARCHAR(50),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS country VARCHAR(100),
ADD COLUMN IF NOT EXISTS organization_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS department VARCHAR(100),
ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS import_batch_id UUID,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Créer la contrainte UNIQUE si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'contacts_email_user_id_unique'
    ) THEN
        ALTER TABLE contacts 
        ADD CONSTRAINT contacts_email_user_id_unique UNIQUE(email, user_id);
    END IF;
END $$;

-- 4. Créer les index manquants
CREATE INDEX IF NOT EXISTS idx_contacts_full_name ON contacts(full_name);
CREATE INDEX IF NOT EXISTS idx_contacts_organization_id ON contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_contacts_organization_name ON contacts(organization_name);
CREATE INDEX IF NOT EXISTS idx_contacts_source ON contacts(source);
CREATE INDEX IF NOT EXISTS idx_contacts_import_batch_id ON contacts(import_batch_id);

-- 5. Ajouter les triggers pour la nouvelle colonne updated_at
CREATE TRIGGER IF NOT EXISTS update_contacts_updated_at BEFORE UPDATE ON contacts 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Activer RLS sur la table organizations si ce n'est pas déjà fait
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY IF NOT EXISTS;

-- 7. Créer les politiques RLS pour les organisations si elles n'existent pas
CREATE POLICY IF NOT EXISTS "Users can view own organizations" ON organizations 
FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert own organizations" ON organizations 
FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update own organizations" ON organizations 
FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can delete own organizations" ON organizations 
FOR DELETE USING (auth.uid() = user_id);

-- 8. Mettre à jour les politiques RLS pour les contacts pour inclure les nouvelles colonnes
DROP POLICY IF EXISTS "Users can view own contacts" ON contacts;
CREATE POLICY "Users can view own contacts" ON contacts 
FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own contacts" ON contacts 
FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own contacts" ON contacts 
FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own contacts" ON contacts 
FOR DELETE USING (auth.uid() = user_id);

-- 9. Insérer des données de test pour les organisations
INSERT INTO organizations (name, user_id) 
SELECT 'Expobeton RDC', auth.uid() 
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'Expobeton RDC' AND user_id = auth.uid());

INSERT INTO organizations (name, user_id) 
SELECT 'Tech Solutions', auth.uid() 
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'Tech Solutions' AND user_id = auth.uid());

-- 10. Mettre à jour les contacts existants pour avoir des organisations
UPDATE contacts 
SET organization_id = (
  SELECT id FROM organizations WHERE name = 'Expobeton RDC' AND user_id = contacts.user_id LIMIT 1
)
WHERE organization_name = 'Expobeton RDC' AND organization_id IS NULL AND user_id IS NOT NULL;

UPDATE contacts 
SET organization_id = (
  SELECT id FROM organizations WHERE name = 'Tech Solutions' AND user_id = contacts.user_id LIMIT 1
)
WHERE organization_name = 'Tech Solutions' AND organization_id IS NULL AND user_id IS NOT NULL;

-- 11. Mettre à jour les timestamps
UPDATE contacts SET updated_at = NOW() WHERE updated_at IS NULL;
UPDATE organizations SET updated_at = NOW() WHERE updated_at IS NULL;
