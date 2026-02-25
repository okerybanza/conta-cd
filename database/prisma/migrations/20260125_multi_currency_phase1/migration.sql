-- SPRINT 2 - TASK 2.4 (FIN-003): Multi-Currency Support - Phase 1
-- This migration adds exchange rate management and currency settings

-- Table: exchange_rates
-- Stores historical exchange rates between currency pairs
CREATE TABLE exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency VARCHAR(3) NOT NULL,
  to_currency VARCHAR(3) NOT NULL,
  rate DECIMAL(18, 8) NOT NULL,
  effective_date DATE NOT NULL,
  source VARCHAR(50) DEFAULT 'manual', -- 'manual', 'ecb', 'openexchangerates'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_rate_per_date UNIQUE(from_currency, to_currency, effective_date),
  CONSTRAINT positive_rate CHECK (rate > 0),
  CONSTRAINT different_currencies CHECK (from_currency != to_currency)
);

-- Indexes for efficient rate lookups
CREATE INDEX idx_exchange_rates_currencies_date 
ON exchange_rates(from_currency, to_currency, effective_date DESC);

CREATE INDEX idx_exchange_rates_effective_date 
ON exchange_rates(effective_date DESC);

-- Table: currency_settings
-- Company-specific currency configuration
CREATE TABLE currency_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  base_currency VARCHAR(3) NOT NULL DEFAULT 'CDF',
  auto_update_rates BOOLEAN DEFAULT false,
  rate_provider VARCHAR(50) DEFAULT 'manual', -- 'manual', 'ecb', 'openexchangerates'
  api_key VARCHAR(255), -- For external rate providers (encrypted)
  last_rate_update TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_currency_settings_per_company UNIQUE(company_id)
);

CREATE INDEX idx_currency_settings_company 
ON currency_settings(company_id);

-- Comments for documentation
COMMENT ON TABLE exchange_rates IS 'Historical exchange rates between currency pairs';
COMMENT ON COLUMN exchange_rates.rate IS 'Exchange rate: 1 from_currency = rate * to_currency';
COMMENT ON COLUMN exchange_rates.source IS 'Source of the rate: manual, ecb, openexchangerates';
COMMENT ON COLUMN exchange_rates.effective_date IS 'Date when this rate becomes effective';

COMMENT ON TABLE currency_settings IS 'Currency configuration per company';
COMMENT ON COLUMN currency_settings.base_currency IS 'Company base currency for reporting and consolidation';
COMMENT ON COLUMN currency_settings.auto_update_rates IS 'Automatically fetch rates from external provider';
COMMENT ON COLUMN currency_settings.rate_provider IS 'External rate provider: manual, ecb, openexchangerates';

-- Insert default currency settings for existing companies
INSERT INTO currency_settings (company_id, base_currency, auto_update_rates, rate_provider)
SELECT id, COALESCE(currency, 'CDF'), false, 'manual'
FROM companies
WHERE id NOT IN (SELECT company_id FROM currency_settings);
