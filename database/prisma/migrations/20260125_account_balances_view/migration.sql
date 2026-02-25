-- Create account_balances_view
CREATE OR REPLACE VIEW account_balances_view AS
SELECT 
    a.id AS account_id,
    a.company_id AS company_id,
    COALESCE(SUM(
        CASE 
            WHEN a.type IN ('asset', 'expense') THEN (l.debit - l.credit)
            ELSE (l.credit - l.debit)
        END
    ), 0)::DECIMAL(15, 2) AS balance
FROM accounts a
LEFT JOIN journal_entry_lines l ON a.id = l.account_id
LEFT JOIN journal_entries e ON l.journal_entry_id = e.id AND e.status = 'posted'
GROUP BY a.id, a.company_id;
