CREATE TABLE suppliers (
    id UUID PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(254),
    phone VARCHAR(32),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX ix_suppliers_name ON suppliers (name);

CREATE TABLE purchase_receipts (
    id UUID PRIMARY KEY,
    supplier_id UUID NOT NULL REFERENCES suppliers (id),
    supplier_reference VARCHAR(64),
    total_cost NUMERIC(20, 2) NOT NULL CHECK (total_cost >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX ix_purchase_receipts_created ON purchase_receipts (created_at DESC);
CREATE INDEX ix_purchase_receipts_supplier ON purchase_receipts (supplier_id, created_at DESC);

CREATE TABLE purchase_receipt_items (
    id UUID PRIMARY KEY,
    receipt_id UUID NOT NULL REFERENCES purchase_receipts (id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products (id),
    sku VARCHAR(64) NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_cost NUMERIC(12, 2) NOT NULL CHECK (unit_cost >= 0),
    line_cost NUMERIC(20, 2) NOT NULL CHECK (line_cost >= 0),
    UNIQUE (receipt_id, product_id),
    CHECK (line_cost = quantity * unit_cost)
);

CREATE INDEX ix_purchase_receipt_items_product ON purchase_receipt_items (product_id);

ALTER TABLE inventory_movements
    ADD COLUMN purchase_receipt_id UUID REFERENCES purchase_receipts (id);

CREATE INDEX ix_inventory_movements_purchase_receipt
    ON inventory_movements (purchase_receipt_id)
    WHERE purchase_receipt_id IS NOT NULL;
