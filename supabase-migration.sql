-- Script de migration pour ExpoBeton Email
-- Ce script vérifie les tables existantes et ajoute seulement ce qui manque

-- Vérifier et créer la table campaigns si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'campaigns') THEN
        CREATE TABLE campaigns (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name TEXT NOT NULL,
            subject TEXT NOT NULL,
            content TEXT,
            status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
            recipients_count INTEGER DEFAULT 100,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            sent_at TIMESTAMP WITH TIME ZONE,
            sender_email TEXT DEFAULT 'henrinelngando229@gmail.com'
        );
        RAISE NOTICE 'Table campaigns créée';
    ELSE
        RAISE NOTICE 'Table campaigns existe déjà';
    END IF;
END $$;

-- Vérifier et ajouter les colonnes manquantes à la table campaigns
DO $$
BEGIN
    -- Vérifier si la colonne status existe
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'status') THEN
        ALTER TABLE campaigns ADD COLUMN status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed'));
        RAISE NOTICE 'Colonne status ajoutée à campaigns';
    END IF;
    
    -- Vérifier si la colonne recipients_count existe
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'recipients_count') THEN
        ALTER TABLE campaigns ADD COLUMN recipients_count INTEGER DEFAULT 100;
        RAISE NOTICE 'Colonne recipients_count ajoutée à campaigns';
    END IF;
    
    -- Vérifier si la colonne sent_at existe
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'sent_at') THEN
        ALTER TABLE campaigns ADD COLUMN sent_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Colonne sent_at ajoutée à campaigns';
    END IF;
    
    -- Vérifier si la colonne sender_email existe
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'sender_email') THEN
        ALTER TABLE campaigns ADD COLUMN sender_email TEXT DEFAULT 'henrinelngando229@gmail.com';
        RAISE NOTICE 'Colonne sender_email ajoutée à campaigns';
    END IF;
    
    -- Vérifier si la colonne updated_at existe
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'updated_at') THEN
        ALTER TABLE campaigns ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Colonne updated_at ajoutée à campaigns';
    END IF;
END $$;

-- Créer la table email_stats si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'email_stats') THEN
        CREATE TABLE email_stats (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
            total_sent INTEGER DEFAULT 0,
            total_delivered INTEGER DEFAULT 0,
            total_opened INTEGER DEFAULT 0,
            total_clicked INTEGER DEFAULT 0,
            total_bounced INTEGER DEFAULT 0,
            total_unsubscribed INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Table email_stats créée';
    ELSE
        RAISE NOTICE 'Table email_stats existe déjà';
    END IF;
END $$;

-- Créer la table contacts si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'contacts') THEN
        CREATE TABLE contacts (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            name TEXT,
            first_name TEXT,
            last_name TEXT,
            company TEXT,
            status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'unsubscribed')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Table contacts créée';
    ELSE
        RAISE NOTICE 'Table contacts existe déjà';
    END IF;
END $$;

-- Créer la table notifications si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'notifications') THEN
        CREATE TABLE notifications (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            type TEXT NOT NULL CHECK (type IN ('email_received', 'email_replied', 'campaign_update', 'system')),
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            data JSONB DEFAULT '{}',
            is_read BOOLEAN DEFAULT false,
            is_important BOOLEAN DEFAULT false,
            time_category TEXT DEFAULT 'new' CHECK (time_category IN ('new', 'recent', 'old')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            read_at TIMESTAMP WITH TIME ZONE
        );
        RAISE NOTICE 'Table notifications créée';
    ELSE
        RAISE NOTICE 'Table notifications existe déjà';
    END IF;
END $$;

-- Créer les index si ils n'existent pas
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_stats_campaign_id ON email_stats(campaign_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Activer RLS si pas déjà fait
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'campaigns') THEN
        ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Enable all operations for campaigns" ON campaigns FOR ALL USING (true);
        RAISE NOTICE 'RLS activé pour campaigns';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'email_stats') THEN
        ALTER TABLE email_stats ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Enable all operations for email_stats" ON email_stats FOR ALL USING (true);
        RAISE NOTICE 'RLS activé pour email_stats';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'contacts') THEN
        ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Enable all operations for contacts" ON contacts FOR ALL USING (true);
        RAISE NOTICE 'RLS activé pour contacts';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'notifications') THEN
        ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Enable all operations for notifications" ON notifications FOR ALL USING (true);
        RAISE NOTICE 'RLS activé pour notifications';
    END IF;
END $$;

-- Insérer des données de démonstration seulement si les tables sont vides
DO $$
BEGIN
    -- Insérer des campagnes de démonstration si la table est vide
    IF (SELECT COUNT(*) FROM campaigns) = 0 THEN
        INSERT INTO campaigns (name, subject, content, status, recipients_count) VALUES
        ('Campagne de Bienvenue', 'Bienvenue chez ExpoBeton', 'Merci de vous être inscrit !', 'sent', 150),
        ('Promotion Printemps', 'Offres spéciales Printemps 2026', 'Découvrez nos nouvelles offres...', 'draft', 200),
        ('Newsletter Mensuelle', 'Actualités ExpoBeton', 'Les dernières nouveautés...', 'scheduled', 100);
        RAISE NOTICE 'Données de démonstration insérées dans campaigns';
    END IF;
    
    -- Insérer des notifications de démonstration si la table est vide
    IF (SELECT COUNT(*) FROM notifications) = 0 THEN
        INSERT INTO notifications (type, title, message, is_read, is_important) VALUES
        ('email_received', 'Nouvel email reçu', 'contact@entreprise-abc.com vous a envoyé un message', false, true),
        ('campaign_update', 'Campagne terminée', 'La campagne "Campagne de Bienvenue" a été envoyée avec succès', false, false),
        ('system', 'Système', 'Connexion à la base de données établie', true, false);
        RAISE NOTICE 'Données de démonstration insérées dans notifications';
    END IF;
END $$;

-- Afficher l'état final
SELECT 
    'campaigns' as table_name, 
    COUNT(*) as row_count 
FROM campaigns
UNION ALL
SELECT 
    'email_stats' as table_name, 
    COUNT(*) as row_count 
FROM email_stats
UNION ALL
SELECT 
    'contacts' as table_name, 
    COUNT(*) as row_count 
FROM contacts
UNION ALL
SELECT 
    'notifications' as table_name, 
    COUNT(*) as row_count 
FROM notifications;
