ALTER TABLE sales
    ADD COLUMN payment_method VARCHAR(16),
    ADD COLUMN amount_tendered NUMERIC(20, 2),
    ADD COLUMN change_due NUMERIC(20, 2);

ALTER TABLE sales
    ADD CONSTRAINT chk_sales_payment_method
        CHECK (payment_method IS NULL OR payment_method IN ('CASH', 'CARD', 'OTHER')),
    ADD CONSTRAINT chk_sales_amount_tendered
        CHECK (amount_tendered IS NULL OR amount_tendered >= 0),
    ADD CONSTRAINT chk_sales_change_due
        CHECK (change_due IS NULL OR change_due >= 0),
    ADD CONSTRAINT chk_sales_payment_amounts
        CHECK (
            payment_method IS NULL
            OR (
                amount_tendered IS NOT NULL
                AND change_due IS NOT NULL
                AND amount_tendered >= total_amount
                AND (
                    (payment_method = 'CASH' AND change_due = amount_tendered - total_amount)
                    OR (
                        payment_method IN ('CARD', 'OTHER')
                        AND amount_tendered = total_amount
                        AND change_due = 0
                    )
                )
            )
        );
