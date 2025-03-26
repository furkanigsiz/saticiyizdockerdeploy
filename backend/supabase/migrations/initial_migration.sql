-- Mevcut veritabanındaki tüm tabloları Supabase'e aktarmak için SQL komutları

-- API Entegrasyonları Tablosu
CREATE TABLE IF NOT EXISTS "api_integrations" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "seller_id" VARCHAR(255) NOT NULL,
  "api_key" VARCHAR(255) NOT NULL,
  "api_secret" VARCHAR(255) NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Siparişler Tablosu
CREATE TABLE IF NOT EXISTS "orders" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "order_number" VARCHAR(255) NOT NULL,
  "customer_first_name" VARCHAR(255) NOT NULL,
  "customer_last_name" VARCHAR(255) NOT NULL,
  "customer_email" VARCHAR(255) NOT NULL,
  "total_price" DECIMAL(10, 2) NOT NULL,
  "status" VARCHAR(50) DEFAULT 'Created',
  "lines" JSONB,
  "order_date" TIMESTAMP NOT NULL,
  "last_update_date" TIMESTAMP NOT NULL,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("user_id", "order_number")
);

-- Ürünler Tablosu
CREATE TABLE IF NOT EXISTS "products" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "trendyol_id" INTEGER NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "barcode" VARCHAR(255) NOT NULL,
  "stock_code" VARCHAR(255),
  "product_code" VARCHAR(255),
  "brand" VARCHAR(255),
  "category_name" VARCHAR(255),
  "quantity" INTEGER DEFAULT 0,
  "stock_unit_type" VARCHAR(50),
  "dimensional_weight" DOUBLE PRECISION,
  "description" TEXT,
  "list_price" DECIMAL(10, 2),
  "sale_price" DECIMAL(10, 2),
  "vat_rate" DOUBLE PRECISION,
  "images" JSONB,
  "gender" VARCHAR(50),
  "color" VARCHAR(50),
  "size" VARCHAR(50),
  "approved" BOOLEAN DEFAULT FALSE,
  "on_sale" BOOLEAN DEFAULT FALSE,
  "has_active_campaign" BOOLEAN DEFAULT FALSE,
  "archived" BOOLEAN DEFAULT FALSE,
  "last_update_date" TIMESTAMP,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("user_id", "trendyol_id")
);

-- Satış Verileri Tablosu
CREATE TABLE IF NOT EXISTS "sales_data" (
  "id" SERIAL PRIMARY KEY,
  "store_id" INTEGER,
  "product_name" VARCHAR(255),
  "price" DECIMAL,
  "commission" DECIMAL,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE
);

-- Mağazalar Tablosu
CREATE TABLE IF NOT EXISTS "stores" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER,
  "store_name" VARCHAR(255),
  "api_key" VARCHAR(255),
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Kullanıcılar Tablosu
CREATE TABLE IF NOT EXISTS "users" (
  "id" SERIAL PRIMARY KEY,
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "password" VARCHAR(255) NOT NULL,
  "first_name" VARCHAR(255),
  "last_name" VARCHAR(255),
  "phone" VARCHAR(255),
  "role" VARCHAR(255) DEFAULT 'user',
  "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Ürün Ayarları Tablosu
CREATE TABLE IF NOT EXISTS "product_settings" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "trendyol_id" VARCHAR(255) NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "barcode" VARCHAR(255) NOT NULL,
  "stock_code" VARCHAR(255),
  "product_code" VARCHAR(255),
  "brand" VARCHAR(255),
  "category_name" VARCHAR(255),
  "quantity" INTEGER DEFAULT 0,
  "stock_unit_type" VARCHAR(50),
  "dimensional_weight" DOUBLE PRECISION,
  "description" TEXT,
  "list_price" DECIMAL(10, 2),
  "sale_price" DECIMAL(10, 2),
  "cost" DECIMAL(10, 2),
  "vat_rate" DOUBLE PRECISION,
  "images" JSONB,
  "gender" VARCHAR(50),
  "color" VARCHAR(50),
  "size" VARCHAR(50),
  "approved" BOOLEAN DEFAULT FALSE,
  "on_sale" BOOLEAN DEFAULT FALSE,
  "has_active_campaign" BOOLEAN DEFAULT FALSE,
  "archived" BOOLEAN DEFAULT FALSE,
  "last_update_date" TIMESTAMP,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("user_id", "trendyol_id"),
  UNIQUE ("user_id", "barcode")
);

-- Entegrasyon Ayarları Tablosu
CREATE TABLE IF NOT EXISTS "integration_settings" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "service" VARCHAR(50) NOT NULL,
  "credentials" JSONB NOT NULL,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("user_id", "service")
);

-- Flash Ürünler Tablosu
CREATE TABLE IF NOT EXISTS "flash_products" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "barcode" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "brand" TEXT,
  "category" TEXT,
  "sale_price" DOUBLE PRECISION NOT NULL,
  "original_price" DOUBLE PRECISION,
  "discount_rate" INTEGER DEFAULT 0 NOT NULL,
  "quantity" INTEGER DEFAULT 0 NOT NULL,
  "flash_end_date" TIMESTAMP,
  "image_url" TEXT,
  "product_code" TEXT,
  "option1_price" DOUBLE PRECISION,
  "option2_price" DOUBLE PRECISION,
  "selected_flash_price" DOUBLE PRECISION,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP
);

-- Avantajlı Ürünler Tablosu
CREATE TABLE IF NOT EXISTS "advantage_products" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "barcode" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "brand" TEXT,
  "category" TEXT,
  "sale_price" DOUBLE PRECISION NOT NULL,
  "original_price" DOUBLE PRECISION,
  "discount_rate" INTEGER DEFAULT 0 NOT NULL,
  "quantity" INTEGER DEFAULT 0 NOT NULL,
  "advantage_label" TEXT,
  "label_end_date" TIMESTAMP,
  "image_url" TEXT,
  "product_code" TEXT,
  "stock_code" TEXT,
  "size" TEXT,
  "commission_rate" DOUBLE PRECISION,
  "price_1_lower" DOUBLE PRECISION,
  "price_2_upper" DOUBLE PRECISION,
  "price_2_lower" DOUBLE PRECISION,
  "price_3_upper" DOUBLE PRECISION,
  "price_3_lower" DOUBLE PRECISION,
  "price_4_upper" DOUBLE PRECISION,
  "commission_1" DOUBLE PRECISION,
  "commission_2" DOUBLE PRECISION,
  "commission_3" DOUBLE PRECISION,
  "commission_4" DOUBLE PRECISION,
  "commission_base" DOUBLE PRECISION,
  "current_commission" DOUBLE PRECISION,
  "calculated_commission" DOUBLE PRECISION,
  "current_tsf" DOUBLE PRECISION,
  "new_tsf" DOUBLE PRECISION,
  "apply_until_end" BOOLEAN DEFAULT FALSE,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP
);

-- Oturum Tablosu
CREATE TABLE IF NOT EXISTS "sessions" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "refresh_token" TEXT UNIQUE NOT NULL,
  "user_agent" TEXT,
  "ip" TEXT,
  "expires_at" TIMESTAMP NOT NULL,
  "is_active" BOOLEAN DEFAULT TRUE,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- İndeksler
CREATE INDEX IF NOT EXISTS "advantage_products_barcode_idx" ON "advantage_products" ("barcode");
CREATE INDEX IF NOT EXISTS "advantage_products_user_id_idx" ON "advantage_products" ("user_id");
CREATE INDEX IF NOT EXISTS "flash_products_barcode_idx" ON "flash_products" ("barcode");
CREATE INDEX IF NOT EXISTS "flash_products_user_id_idx" ON "flash_products" ("user_id");
CREATE INDEX IF NOT EXISTS "sessions_is_active" ON "sessions" ("is_active");
CREATE INDEX IF NOT EXISTS "sessions_user_id" ON "sessions" ("user_id");

-- Tetikleyiciler (Trigger) - Güncelleme tarihini otomatik olarak güncellemek için
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tüm tablolar için tetikleyiciler
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name != '_prisma_migrations'
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS update_updated_at_trigger ON %I;
      CREATE TRIGGER update_updated_at_trigger
      BEFORE UPDATE ON %I
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
    ', t, t);
  END LOOP;
END;
$$ LANGUAGE plpgsql; 