-- Migration manuelle pour créer les tables HR
-- À exécuter dans PostgreSQL si prisma migrate ne fonctionne pas

-- Table employees
CREATE TABLE IF NOT EXISTS employees (
    id VARCHAR(255) PRIMARY KEY,
    company_id VARCHAR(255) NOT NULL,
    employee_number VARCHAR(50) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    date_of_birth DATE,
    gender VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'RDC',
    postal_code VARCHAR(20),
    position VARCHAR(255),
    department VARCHAR(100),
    hire_date DATE NOT NULL,
    termination_date DATE,
    employment_type VARCHAR(50) DEFAULT 'full_time',
    status VARCHAR(50) DEFAULT 'active',
    base_salary DECIMAL(15, 2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'CDF',
    salary_frequency VARCHAR(20) DEFAULT 'monthly',
    bank_account VARCHAR(100),
    bank_name VARCHAR(255),
    nif VARCHAR(50),
    social_security_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    CONSTRAINT employees_company_employee_number_unique UNIQUE (company_id, employee_number)
);

CREATE INDEX IF NOT EXISTS employees_company_id_idx ON employees(company_id);
CREATE INDEX IF NOT EXISTS employees_status_idx ON employees(status);
CREATE INDEX IF NOT EXISTS employees_department_idx ON employees(department);
CREATE INDEX IF NOT EXISTS employees_deleted_at_idx ON employees(deleted_at);

-- Table attendances
CREATE TABLE IF NOT EXISTS attendances (
    id VARCHAR(255) PRIMARY KEY,
    company_id VARCHAR(255) NOT NULL,
    employee_id VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    check_in TIMESTAMP,
    check_out TIMESTAMP,
    hours_worked DECIMAL(5, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'present',
    leave_type VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT attendances_company_employee_date_unique UNIQUE (company_id, employee_id, date)
);

CREATE INDEX IF NOT EXISTS attendances_company_id_idx ON attendances(company_id);
CREATE INDEX IF NOT EXISTS attendances_employee_id_idx ON attendances(employee_id);
CREATE INDEX IF NOT EXISTS attendances_date_idx ON attendances(date);
CREATE INDEX IF NOT EXISTS attendances_status_idx ON attendances(status);

-- Table payrolls
CREATE TABLE IF NOT EXISTS payrolls (
    id VARCHAR(255) PRIMARY KEY,
    company_id VARCHAR(255) NOT NULL,
    employee_id VARCHAR(255) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    pay_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    gross_salary DECIMAL(15, 2) DEFAULT 0,
    total_deductions DECIMAL(15, 2) DEFAULT 0,
    net_salary DECIMAL(15, 2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'CDF',
    payment_method VARCHAR(50),
    payment_reference VARCHAR(255),
    paid_at TIMESTAMP,
    paid_by VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS payrolls_company_id_idx ON payrolls(company_id);
CREATE INDEX IF NOT EXISTS payrolls_employee_id_idx ON payrolls(employee_id);
CREATE INDEX IF NOT EXISTS payrolls_period_start_idx ON payrolls(period_start);
CREATE INDEX IF NOT EXISTS payrolls_period_end_idx ON payrolls(period_end);
CREATE INDEX IF NOT EXISTS payrolls_status_idx ON payrolls(status);
CREATE INDEX IF NOT EXISTS payrolls_pay_date_idx ON payrolls(pay_date);

-- Table payroll_items
CREATE TABLE IF NOT EXISTS payroll_items (
    id VARCHAR(255) PRIMARY KEY,
    payroll_id VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    is_deduction BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS payroll_items_payroll_id_idx ON payroll_items(payroll_id);
CREATE INDEX IF NOT EXISTS payroll_items_type_idx ON payroll_items(type);

-- Foreign keys
ALTER TABLE employees ADD CONSTRAINT employees_company_fk FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE attendances ADD CONSTRAINT attendances_company_fk FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE attendances ADD CONSTRAINT attendances_employee_fk FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
ALTER TABLE payrolls ADD CONSTRAINT payrolls_company_fk FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE payrolls ADD CONSTRAINT payrolls_employee_fk FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
ALTER TABLE payroll_items ADD CONSTRAINT payroll_items_payroll_fk FOREIGN KEY (payroll_id) REFERENCES payrolls(id) ON DELETE CASCADE;

