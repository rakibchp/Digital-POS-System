CREATE TABLE inventory_movements (
    id UUID PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products (id),
    quantity_change INTEGER NOT NULL CHECK (quantity_change <> 0),
    reason VARCHAR(200) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX ix_inventory_movements_product_created
    ON inventory_movements (product_id, created_at DESC);
