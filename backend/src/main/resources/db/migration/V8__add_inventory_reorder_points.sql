ALTER TABLE products
    ADD COLUMN reorder_point INTEGER NOT NULL DEFAULT 0
        CHECK (reorder_point BETWEEN 0 AND 1000000);
