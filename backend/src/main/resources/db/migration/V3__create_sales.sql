CREATE TABLE sales (
    id UUID PRIMARY KEY,
    total_amount NUMERIC(20, 2) NOT NULL CHECK (total_amount >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sale_items (
    id UUID PRIMARY KEY,
    sale_id UUID NOT NULL REFERENCES sales (id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products (id),
    sku VARCHAR(64) NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    line_total NUMERIC(20, 2) NOT NULL CHECK (line_total >= 0)
);

CREATE INDEX ix_sales_created ON sales (created_at DESC);
CREATE INDEX ix_sale_items_sale ON sale_items (sale_id);
