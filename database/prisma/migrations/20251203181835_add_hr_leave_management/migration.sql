-- AlterTable: Add managerId to employees
ALTER TABLE "employees" ADD COLUMN "manager_id" TEXT;

-- CreateTable: LeavePolicy
CREATE TABLE "leave_policies" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "leave_type" VARCHAR(50) NOT NULL,
    "days_per_year" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "days_per_month" DECIMAL(5,2) DEFAULT 0,
    "max_accumulation" DECIMAL(5,2),
    "carry_forward" BOOLEAN NOT NULL DEFAULT false,
    "requires_approval" BOOLEAN NOT NULL DEFAULT true,
    "min_notice_days" INTEGER DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable: LeaveRequest
CREATE TABLE "leave_requests" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "leave_type" VARCHAR(50) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "days_requested" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "reason" TEXT,
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_at" TIMESTAMP(3),
    "approved_by" TEXT,
    "rejected_at" TIMESTAMP(3),
    "rejected_by" TEXT,
    "rejection_reason" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable: LeaveBalance
CREATE TABLE "leave_balances" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "leave_type" VARCHAR(50) NOT NULL,
    "year" INTEGER NOT NULL,
    "total_days" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "used_days" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "pending_days" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "remaining_days" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "carried_forward" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable: EmployeeDocument
CREATE TABLE "employee_documents" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "document_type" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "file_id" TEXT NOT NULL,
    "expiry_date" DATE,
    "is_expired" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "employee_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "leave_policies_company_id_leave_type_key" ON "leave_policies"("company_id", "leave_type");

-- CreateIndex
CREATE UNIQUE INDEX "leave_balances_company_id_employee_id_leave_type_year_key" ON "leave_balances"("company_id", "employee_id", "leave_type", "year");

-- CreateIndex
CREATE INDEX "leave_policies_company_id_idx" ON "leave_policies"("company_id");
CREATE INDEX "leave_policies_leave_type_idx" ON "leave_policies"("leave_type");
CREATE INDEX "leave_policies_is_active_idx" ON "leave_policies"("is_active");

CREATE INDEX "leave_requests_company_id_idx" ON "leave_requests"("company_id");
CREATE INDEX "leave_requests_employee_id_idx" ON "leave_requests"("employee_id");
CREATE INDEX "leave_requests_leave_type_idx" ON "leave_requests"("leave_type");
CREATE INDEX "leave_requests_status_idx" ON "leave_requests"("status");
CREATE INDEX "leave_requests_start_date_idx" ON "leave_requests"("start_date");
CREATE INDEX "leave_requests_end_date_idx" ON "leave_requests"("end_date");

CREATE INDEX "leave_balances_company_id_idx" ON "leave_balances"("company_id");
CREATE INDEX "leave_balances_employee_id_idx" ON "leave_balances"("employee_id");
CREATE INDEX "leave_balances_leave_type_idx" ON "leave_balances"("leave_type");
CREATE INDEX "leave_balances_year_idx" ON "leave_balances"("year");

CREATE INDEX "employee_documents_company_id_idx" ON "employee_documents"("company_id");
CREATE INDEX "employee_documents_employee_id_idx" ON "employee_documents"("employee_id");
CREATE INDEX "employee_documents_document_type_idx" ON "employee_documents"("document_type");
CREATE INDEX "employee_documents_expiry_date_idx" ON "employee_documents"("expiry_date");
CREATE INDEX "employee_documents_is_expired_idx" ON "employee_documents"("is_expired");
CREATE INDEX "employee_documents_deleted_at_idx" ON "employee_documents"("deleted_at");

CREATE INDEX "employees_manager_id_idx" ON "employees"("manager_id");

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "leave_policies" ADD CONSTRAINT "leave_policies_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_rejected_by_fkey" FOREIGN KEY ("rejected_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "employee_documents" ADD CONSTRAINT "employee_documents_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "employee_documents" ADD CONSTRAINT "employee_documents_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "employee_documents" ADD CONSTRAINT "employee_documents_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "file_uploads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

