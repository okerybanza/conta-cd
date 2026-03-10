-- =====================================================
-- SCHEMA BASE DE DONNÉES - CONTA APPLICATION
-- Version: 1.0
-- Date: 2025-11-22
-- =====================================================

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: companies (Entreprises)
-- =====================================================
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    business_name VARCHAR(255),
    logo_url VARCHAR(500),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'RDC',
    postal_code VARCHAR(20),
    
    -- Identifiants fiscaux
    nif VARCHAR(50),
    rccm VARCHAR(50),
    def VARCHAR(50), -- Dispositif Electronique Fiscal
    
    -- Configuration
    currency VARCHAR(3) DEFAULT 'CDF',
    invoice_prefix VARCHAR(20) DEFAULT 'FAC',
    invoice_numbering_type VARCHAR(20) DEFAULT 'sequential', -- sequential, date_based
    next_invoice_number INTEGER DEFAULT 1,
    
    -- Template facture
    invoice_template_id VARCHAR(50) DEFAULT 'template-1-modern',
    
    -- Facture RDC
    rdc_normalized_enabled BOOLEAN DEFAULT false,
    
    -- Paramètres
    default_payment_terms TEXT,
    default_due_days INTEGER DEFAULT 30,
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT companies_email_unique UNIQUE (email),
    CONSTRAINT companies_nif_unique UNIQUE (nif) WHERE nif IS NOT NULL
);

CREATE INDEX idx_companies_email ON companies(email);
CREATE INDEX idx_companies_nif ON companies(nif);
CREATE INDEX idx_companies_deleted_at ON companies(deleted_at);

-- =====================================================
-- TABLE: users (Utilisateurs)
-- =====================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Informations personnelles
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    
    -- Authentification
    email_verified BOOLEAN DEFAULT false,
    email_verification_token VARCHAR(255),
    email_verification_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- 2FA
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(255),
    two_factor_backup_codes TEXT[], -- Array de codes de backup
    
    -- Récupération mot de passe
    password_reset_token VARCHAR(255),
    password_reset_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Rôle et permissions
    role VARCHAR(50) DEFAULT 'manager', -- admin, accountant, manager
    permissions JSONB DEFAULT '{}',
    
    -- Préférences
    preferences JSONB DEFAULT '{}',
    language VARCHAR(10) DEFAULT 'fr',
    timezone VARCHAR(50) DEFAULT 'Africa/Kinshasa',
    
    -- Sécurité
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_login_ip VARCHAR(45),
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT users_email_unique UNIQUE (email),
    CONSTRAINT users_company_email_unique UNIQUE (company_id, email) WHERE deleted_at IS NULL
);

CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);

-- =====================================================
-- TABLE: customers (Clients)
-- =====================================================
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Type de client
    type VARCHAR(20) NOT NULL DEFAULT 'particulier', -- particulier, entreprise
    
    -- Informations particuliers
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    
    -- Informations entreprise
    business_name VARCHAR(255),
    contact_person VARCHAR(255),
    
    -- Coordonnées
    email VARCHAR(255),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    
    -- Adresse
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'RDC',
    postal_code VARCHAR(20),
    
    -- Identifiants fiscaux (pour entreprises)
    nif VARCHAR(50),
    rccm VARCHAR(50),
    
    -- Informations additionnelles
    notes TEXT,
    tags TEXT[],
    
    -- Statistiques
    total_invoiced DECIMAL(15, 2) DEFAULT 0,
    total_paid DECIMAL(15, 2) DEFAULT 0,
    total_outstanding DECIMAL(15, 2) DEFAULT 0,
    invoice_count INTEGER DEFAULT 0,
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT customers_type_check CHECK (type IN ('particulier', 'entreprise')),
    CONSTRAINT customers_particulier_check CHECK (
        (type = 'particulier' AND first_name IS NOT NULL AND last_name IS NOT NULL) OR
        (type = 'entreprise' AND business_name IS NOT NULL)
    )
);

CREATE INDEX idx_customers_company_id ON customers(company_id);
CREATE INDEX idx_customers_type ON customers(type);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_business_name ON customers(business_name);
CREATE INDEX idx_customers_nif ON customers(nif);
CREATE INDEX idx_customers_deleted_at ON customers(deleted_at);

-- =====================================================
-- TABLE: products (Articles/Services)
-- =====================================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Informations de base
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sku VARCHAR(100),
    
    -- Type
    type VARCHAR(20) DEFAULT 'service', -- product, service
    
    -- Prix et taxes
    unit_price DECIMAL(15, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'CDF',
    tax_rate DECIMAL(5, 2) DEFAULT 0, -- Taux TVA en pourcentage
    
    -- Catégorie
    category VARCHAR(100),
    
    -- Stock (si produit)
    track_stock BOOLEAN DEFAULT false,
    stock_quantity INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 0,
    
    -- Statut
    is_active BOOLEAN DEFAULT true,
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT products_unit_price_check CHECK (unit_price >= 0),
    CONSTRAINT products_tax_rate_check CHECK (tax_rate >= 0 AND tax_rate <= 100)
);

CREATE INDEX idx_products_company_id ON products(company_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_deleted_at ON products(deleted_at);

-- =====================================================
-- TABLE: invoices (Factures)
-- =====================================================
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    
    -- Numérotation
    invoice_number VARCHAR(100) NOT NULL,
    invoice_prefix VARCHAR(20),
    sequential_number INTEGER,
    
    -- Dates
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    paid_at TIMESTAMP WITH TIME ZONE,
    
    -- Statut
    status VARCHAR(50) DEFAULT 'draft', -- draft, sent, partial, paid, cancelled, overdue
    
    -- Références
    reference VARCHAR(255),
    po_number VARCHAR(255), -- Purchase Order Number
    
    -- Adresse de livraison (si différente)
    shipping_address TEXT,
    shipping_city VARCHAR(100),
    shipping_country VARCHAR(100),
    
    -- Totaux
    subtotal_ht DECIMAL(15, 2) NOT NULL DEFAULT 0,
    transport_fees DECIMAL(15, 2) DEFAULT 0,
    platform_fees DECIMAL(15, 2) DEFAULT 0,
    total_tax DECIMAL(15, 2) NOT NULL DEFAULT 0,
    total_ttc DECIMAL(15, 2) NOT NULL DEFAULT 0,
    
    -- Paiements
    paid_amount DECIMAL(15, 2) DEFAULT 0,
    remaining_balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
    
    -- Devise
    currency VARCHAR(3) DEFAULT 'CDF',
    
    -- Template utilisé
    template_id VARCHAR(50) DEFAULT 'template-1-modern',
    
    -- Facture RDC normalisée
    is_rdc_normalized BOOLEAN DEFAULT false,
    qr_code_url VARCHAR(500),
    qr_code_data TEXT, -- Données encodées dans QR code
    
    -- Notes et conditions
    notes TEXT,
    payment_terms TEXT,
    footer_text TEXT,
    
    -- Envoi
    sent_at TIMESTAMP WITH TIME ZONE,
    sent_via VARCHAR(50), -- email, sms, whatsapp, link
    view_count INTEGER DEFAULT 0,
    last_viewed_at TIMESTAMP WITH TIME ZONE,
    
    -- Métadonnées
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT invoices_invoice_number_unique UNIQUE (company_id, invoice_number),
    CONSTRAINT invoices_status_check CHECK (status IN ('draft', 'sent', 'partial', 'paid', 'cancelled', 'overdue')),
    CONSTRAINT invoices_totals_check CHECK (total_ttc >= 0 AND remaining_balance >= 0)
);

CREATE INDEX idx_invoices_company_id ON invoices(company_id);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_is_rdc_normalized ON invoices(is_rdc_normalized);
CREATE INDEX idx_invoices_deleted_at ON invoices(deleted_at);

-- =====================================================
-- TABLE: invoice_lines (Lignes de facture)
-- =====================================================
CREATE TABLE invoice_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    
    -- Informations ligne
    line_number INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Quantité et prix
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(15, 2) NOT NULL,
    
    -- Taxes
    tax_rate DECIMAL(5, 2) DEFAULT 0,
    tax_amount DECIMAL(15, 2) DEFAULT 0,
    
    -- Totaux ligne
    subtotal DECIMAL(15, 2) NOT NULL,
    total DECIMAL(15, 2) NOT NULL,
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT invoice_lines_quantity_check CHECK (quantity > 0),
    CONSTRAINT invoice_lines_unit_price_check CHECK (unit_price >= 0),
    CONSTRAINT invoice_lines_line_number_unique UNIQUE (invoice_id, line_number)
);

CREATE INDEX idx_invoice_lines_invoice_id ON invoice_lines(invoice_id);
CREATE INDEX idx_invoice_lines_product_id ON invoice_lines(product_id);

-- =====================================================
-- TABLE: payments (Paiements)
-- =====================================================
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    
    -- Montant
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'CDF',
    
    -- Date et méthode
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50) NOT NULL, -- mobile_money, cash, bank_transfer, check, card
    
    -- Détails Mobile Money
    mobile_money_provider VARCHAR(50), -- orange_money, m_pesa, airtel_money
    mobile_money_number VARCHAR(50),
    transaction_reference VARCHAR(255),
    
    -- Détails autres méthodes
    bank_name VARCHAR(255),
    check_number VARCHAR(100),
    card_last_four VARCHAR(4),
    
    -- Référence
    reference VARCHAR(255),
    notes TEXT,
    
    -- Statut
    status VARCHAR(50) DEFAULT 'confirmed', -- pending, confirmed, failed, refunded
    
    -- Métadonnées
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT payments_amount_check CHECK (amount > 0),
    CONSTRAINT payments_payment_method_check CHECK (
        payment_method IN ('mobile_money', 'cash', 'bank_transfer', 'check', 'card', 'other')
    ),
    CONSTRAINT payments_status_check CHECK (
        status IN ('pending', 'confirmed', 'failed', 'refunded')
    )
);

CREATE INDEX idx_payments_company_id ON payments(company_id);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);
CREATE INDEX idx_payments_payment_method ON payments(payment_method);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_deleted_at ON payments(deleted_at);

-- =====================================================
-- TABLE: notification_templates (Templates de notifications)
-- =====================================================
CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Type
    type VARCHAR(50) NOT NULL, -- email, sms
    name VARCHAR(255) NOT NULL,
    
    -- Contenu
    subject VARCHAR(500), -- Pour email
    body TEXT NOT NULL,
    
    -- Variables disponibles
    available_variables TEXT[],
    
    -- Statut
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notification_templates_company_id ON notification_templates(company_id);
CREATE INDEX idx_notification_templates_type ON notification_templates(type);
CREATE INDEX idx_notification_templates_is_active ON notification_templates(is_active);

-- =====================================================
-- TABLE: notifications (Notifications envoyées)
-- =====================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Type et destinataire
    type VARCHAR(50) NOT NULL, -- email, sms
    recipient VARCHAR(255) NOT NULL,
    
    -- Contenu
    subject VARCHAR(500),
    body TEXT NOT NULL,
    
    -- Contexte
    related_type VARCHAR(50), -- invoice, payment
    related_id UUID,
    
    -- Statut
    status VARCHAR(50) DEFAULT 'pending', -- pending, sent, failed, delivered
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_company_id ON notifications(company_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_related ON notifications(related_type, related_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- =====================================================
-- TABLE: audit_logs (Journal d'audit)
-- =====================================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Qui
    user_id UUID REFERENCES users(id),
    user_email VARCHAR(255),
    
    -- Quoi
    action VARCHAR(100) NOT NULL, -- create, update, delete, view, export
    entity_type VARCHAR(50) NOT NULL, -- invoice, customer, payment, etc.
    entity_id UUID,
    
    -- Détails
    changes JSONB, -- Changements effectués (avant/après)
    metadata JSONB, -- Métadonnées additionnelles
    
    -- Où
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    -- Quand
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_company_id ON audit_logs(company_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- =====================================================
-- TABLE: file_uploads (Fichiers uploadés)
-- =====================================================
CREATE TABLE file_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Informations fichier
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255),
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100),
    
    -- Type et contexte
    file_type VARCHAR(50), -- logo, invoice_pdf, attachment
    related_type VARCHAR(50), -- company, invoice
    related_id UUID,
    
    -- Métadonnées
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_file_uploads_company_id ON file_uploads(company_id);
CREATE INDEX idx_file_uploads_related ON file_uploads(related_type, related_id);
CREATE INDEX idx_file_uploads_file_type ON file_uploads(file_type);

-- =====================================================
-- TABLE: settings (Paramètres système)
-- =====================================================
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Clé et valeur
    key VARCHAR(100) NOT NULL,
    value JSONB NOT NULL,
    
    -- Type
    type VARCHAR(50) DEFAULT 'string', -- string, number, boolean, json
    
    -- Description
    description TEXT,
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT settings_key_unique UNIQUE (company_id, key)
);

CREATE INDEX idx_settings_company_id ON settings(company_id);
CREATE INDEX idx_settings_key ON settings(key);

-- =====================================================
-- TRIGGERS: Mise à jour automatique updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoice_lines_updated_at BEFORE UPDATE ON invoice_lines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_templates_updated_at BEFORE UPDATE ON notification_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTIONS: Calculs automatiques
-- =====================================================

-- Fonction pour mettre à jour les totaux d'une facture
CREATE OR REPLACE FUNCTION update_invoice_totals(invoice_uuid UUID)
RETURNS VOID AS $$
DECLARE
    invoice_record RECORD;
    calculated_subtotal DECIMAL(15, 2);
    calculated_tax DECIMAL(15, 2);
    calculated_total DECIMAL(15, 2);
    calculated_paid DECIMAL(15, 2);
    calculated_balance DECIMAL(15, 2);
BEGIN
    -- Récupérer la facture
    SELECT * INTO invoice_record FROM invoices WHERE id = invoice_uuid;
    
    -- Calculer le sous-total HT depuis les lignes
    SELECT COALESCE(SUM(subtotal), 0) INTO calculated_subtotal
    FROM invoice_lines WHERE invoice_id = invoice_uuid;
    
    -- Calculer la TVA totale
    SELECT COALESCE(SUM(tax_amount), 0) INTO calculated_tax
    FROM invoice_lines WHERE invoice_id = invoice_uuid;
    
    -- Calculer le total TTC
    calculated_total := calculated_subtotal + 
                       COALESCE(invoice_record.transport_fees, 0) + 
                       COALESCE(invoice_record.platform_fees, 0) + 
                       calculated_tax;
    
    -- Calculer le montant payé
    SELECT COALESCE(SUM(amount), 0) INTO calculated_paid
    FROM payments 
    WHERE invoice_id = invoice_uuid 
      AND status = 'confirmed' 
      AND deleted_at IS NULL;
    
    -- Calculer le solde restant
    calculated_balance := calculated_total - calculated_paid;
    
    -- Mettre à jour la facture
    UPDATE invoices SET
        subtotal_ht = calculated_subtotal,
        total_tax = calculated_tax,
        total_ttc = calculated_total,
        paid_amount = calculated_paid,
        remaining_balance = calculated_balance,
        status = CASE
            WHEN calculated_balance <= 0 THEN 'paid'
            WHEN calculated_paid > 0 THEN 'partial'
            WHEN invoice_record.status = 'draft' THEN 'draft'
            ELSE 'sent'
        END
    WHERE id = invoice_uuid;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour les totaux après modification des lignes
CREATE OR REPLACE FUNCTION trigger_update_invoice_totals()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM update_invoice_totals(COALESCE(NEW.invoice_id, OLD.invoice_id));
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_invoice_totals_on_line_change
    AFTER INSERT OR UPDATE OR DELETE ON invoice_lines
    FOR EACH ROW EXECUTE FUNCTION trigger_update_invoice_totals();

-- Trigger pour mettre à jour les totaux après modification des paiements
CREATE TRIGGER update_invoice_totals_on_payment_change
    AFTER INSERT OR UPDATE OR DELETE ON payments
    FOR EACH ROW EXECUTE FUNCTION trigger_update_invoice_totals();

-- =====================================================
-- FUNCTIONS: Mise à jour statistiques client
-- =====================================================
CREATE OR REPLACE FUNCTION update_customer_statistics(customer_uuid UUID)
RETURNS VOID AS $$
DECLARE
    total_invoiced DECIMAL(15, 2);
    total_paid DECIMAL(15, 2);
    total_outstanding DECIMAL(15, 2);
    invoice_count INTEGER;
BEGIN
    SELECT 
        COALESCE(SUM(total_ttc), 0),
        COALESCE(SUM(paid_amount), 0),
        COALESCE(SUM(remaining_balance), 0),
        COUNT(*)
    INTO total_invoiced, total_paid, total_outstanding, invoice_count
    FROM invoices
    WHERE customer_id = customer_uuid 
      AND status != 'cancelled'
      AND deleted_at IS NULL;
    
    UPDATE customers SET
        total_invoiced = total_invoiced,
        total_paid = total_paid,
        total_outstanding = total_outstanding,
        invoice_count = invoice_count
    WHERE id = customer_uuid;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour les statistiques client
CREATE OR REPLACE FUNCTION trigger_update_customer_statistics()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM update_customer_statistics(COALESCE(NEW.customer_id, OLD.customer_id));
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customer_statistics_on_invoice_change
    AFTER INSERT OR UPDATE OR DELETE ON invoices
    FOR EACH ROW EXECUTE FUNCTION trigger_update_customer_statistics();

-- =====================================================
-- SEEDS: Données initiales
-- =====================================================

-- Templates de notifications par défaut
INSERT INTO notification_templates (company_id, type, name, subject, body, is_default, available_variables) VALUES
(NULL, 'email', 'Facture envoyée', 'Facture {{invoiceNumber}} de {{companyName}}', 
'Bonjour {{clientName}},\n\nVeuillez trouver ci-joint votre facture N° {{invoiceNumber}} d''un montant de {{totalTTC}} {{currency}}.\n\nDate d''échéance : {{dueDate}}\n\nMerci pour votre confiance.\n\n{{companyName}}', 
true, ARRAY['{{clientName}}', '{{invoiceNumber}}', '{{totalTTC}}', '{{currency}}', '{{dueDate}}', '{{companyName}}']),

(NULL, 'email', 'Paiement reçu', 'Paiement reçu pour la facture {{invoiceNumber}}', 
'Bonjour {{clientName}},\n\nNous avons bien reçu votre paiement de {{amount}} {{currency}} pour la facture N° {{invoiceNumber}}.\n\nSolde restant : {{remainingBalance}} {{currency}}\n\nMerci.\n\n{{companyName}}', 
true, ARRAY['{{clientName}}', '{{invoiceNumber}}', '{{amount}}', '{{currency}}', '{{remainingBalance}}', '{{companyName}}']),

(NULL, 'sms', 'Facture envoyée', NULL, 
'Bonjour {{clientName}}, votre facture N° {{invoiceNumber}} de {{totalTTC}} {{currency}} a été envoyée. Échéance : {{dueDate}}. {{companyName}}', 
true, ARRAY['{{clientName}}', '{{invoiceNumber}}', '{{totalTTC}}', '{{currency}}', '{{dueDate}}', '{{companyName}}']),

(NULL, 'sms', 'Paiement reçu', NULL, 
'Paiement de {{amount}} {{currency}} reçu pour facture {{invoiceNumber}}. Solde : {{remainingBalance}} {{currency}}. {{companyName}}', 
true, ARRAY['{{invoiceNumber}}', '{{amount}}', '{{currency}}', '{{remainingBalance}}', '{{companyName}}']);

-- =====================================================
-- COMMENTAIRES SUR LES TABLES
-- =====================================================
COMMENT ON TABLE companies IS 'Entreprises utilisant l''application';
COMMENT ON TABLE users IS 'Utilisateurs de l''application avec rôles et permissions';
COMMENT ON TABLE customers IS 'Clients (particuliers ou entreprises)';
COMMENT ON TABLE products IS 'Articles ou services facturables';
COMMENT ON TABLE invoices IS 'Factures créées';
COMMENT ON TABLE invoice_lines IS 'Lignes de détail des factures';
COMMENT ON TABLE payments IS 'Paiements reçus pour les factures';
COMMENT ON TABLE notification_templates IS 'Templates de notifications Email/SMS';
COMMENT ON TABLE notifications IS 'Historique des notifications envoyées';
COMMENT ON TABLE audit_logs IS 'Journal d''audit de toutes les actions';
COMMENT ON TABLE file_uploads IS 'Fichiers uploadés (logos, PDFs, etc.)';
COMMENT ON TABLE settings IS 'Paramètres système par entreprise';

