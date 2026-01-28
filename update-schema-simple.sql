-- Script simplifié pour mettre à jour le schéma Supabase
-- Version compatible avec toutes les versions PostgreSQL

-- 1. Créer la table organizations si elle n'existe pas
CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(50),
  website VARCHAR(255),
  industry VARCHAR(100),
  size VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2. Ajouter les colonnes manquantes à la table contacts
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);

ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS job_title VARCHAR(100);

ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS phone VARCHAR(50);

ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS mobile VARCHAR(50);

ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS address TEXT;

ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS city VARCHAR(100);

ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS country VARCHAR(100);

ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS organization_name VARCHAR(255);

ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS department VARCHAR(100);

ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(255);

ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS tags TEXT[];

ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual';

ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS import_batch_id UUID;

ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Créer les index manquants
CREATE INDEX IF NOT EXISTS idx_organizations_user_id ON organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_organizations_name ON organizations(name);
CREATE INDEX IF NOT EXISTS idx_contacts_full_name ON contacts(full_name);
CREATE INDEX IF NOT EXISTS idx_contacts_organization_id ON contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_contacts_organization_name ON contacts(organization_name);
CREATE INDEX IF NOT EXISTS idx_contacts_source ON contacts(source);
CREATE INDEX IF NOT EXISTS idx_contacts_import_batch_id ON contacts(import_batch_id);

-- 4. Activer RLS sur les tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- 5. Créer les politiques RLS pour les organisations
DROP POLICY IF EXISTS "Users can view own organizations" ON organizations;
CREATE POLICY "Users can view own organizations" ON organizations 
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own organizations" ON organizations;
CREATE POLICY "Users can insert own organizations" ON organizations 
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own organizations" ON organizations;
CREATE POLICY "Users can update own organizations" ON organizations 
FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own organizations" ON organizations;
CREATE POLICY "Users can delete own organizations" ON organizations 
FOR DELETE USING (auth.uid() = user_id);

-- 6. Créer les politiques RLS pour les contacts
DROP POLICY IF EXISTS "Users can view own contacts" ON contacts;
CREATE POLICY "Users can view own contacts" ON contacts 
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own contacts" ON contacts;
CREATE POLICY "Users can insert own contacts" ON contacts 
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own contacts" ON contacts;
CREATE POLICY "Users can update own contacts" ON contacts 
FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own contacts" ON contacts;
CREATE POLICY "Users can delete own contacts" ON contacts 
FOR DELETE USING (auth.uid() = user_id);

-- 7. Insérer des données de test pour les organisations
INSERT INTO organizations (name, user_id) 
SELECT 'Expobeton RDC', auth.uid() 
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'Expobeton RDC' AND user_id = auth.uid());

INSERT INTO organizations (name, user_id) 
SELECT 'Tech Solutions', auth.uid() 
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'Tech Solutions' AND user_id = auth.uid());

-- 8. Mettre à jour les timestamps
UPDATE contacts SET updated_at = NOW() WHERE updated_at IS NULL;
UPDATE organizations SET updated_at = NOW() WHERE updated_at IS NULL;
