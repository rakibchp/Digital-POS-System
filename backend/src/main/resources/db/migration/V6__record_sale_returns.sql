ALTER TABLE sales
    ADD COLUMN returned_at TIMESTAMPTZ,
    ADD COLUMN return_reason VARCHAR(150),
    ADD COLUMN refund_amount NUMERIC(20, 2);

ALTER TABLE sales
    ADD CONSTRAINT chk_sales_return_fields
        CHECK (
            (returned_at IS NULL AND return_reason IS NULL AND refund_amount IS NULL)
            OR (
                returned_at IS NOT NULL
                AND return_reason IS NOT NULL
                AND length(trim(return_reason)) > 0
                AND refund_amount IS NOT NULL
                AND refund_amount = total_amount
            )
        );

CREATE INDEX ix_sales_returned ON sales (returned_at) WHERE returned_at IS NOT NULL;
