CREATE TABLE customers (
    id UUID PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(254),
    phone VARCHAR(32),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX ix_customers_name ON customers (name);

ALTER TABLE sales
    ADD COLUMN customer_id UUID REFERENCES customers (id) ON DELETE SET NULL;

CREATE INDEX ix_sales_customer ON sales (customer_id);
