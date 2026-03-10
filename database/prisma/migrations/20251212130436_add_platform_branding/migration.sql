-- CreateTable
CREATE TABLE IF NOT EXISTS "platform_branding" (
    "id" TEXT NOT NULL,
    "logo_url" VARCHAR(500),
    "favicon_url" VARCHAR(500),
    "email_logo_url" VARCHAR(500),
    "pdf_logo_url" VARCHAR(500),
    "primary_color" VARCHAR(7),
    "secondary_color" VARCHAR(7),
    "accent_color" VARCHAR(7),
    "background_color" VARCHAR(7),
    "primary_font" VARCHAR(100),
    "secondary_font" VARCHAR(100),
    "theme" VARCHAR(20) DEFAULT 'light',
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_branding_pkey" PRIMARY KEY ("id")
);
