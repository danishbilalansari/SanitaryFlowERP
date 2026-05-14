import db from './src/lib/db';
(async () => {
    await db('ledger').where({ id: 1 }).update({ debit: 1200, credit: 0, account_type: 'Sales' });
    await db('ledger').where({ id: 3 }).update({ customer_id: 3, debit: 300, credit: 0 });
    await db('ledger').where({ id: 4 }).update({ customer_id: 3, debit: 150, credit: 0 });
    
    // update payments for existing completed sales
    await db('sales_orders').where({ id: 1 }).update({ paid_amount: 1200 });
    await db('ledger').insert({ customer_id: 1, account_type: 'Payment', debit: 0, credit: 1200, reference_id: 'SO-1001_PAY' });

    await db('sales_orders').where({ id: 3 }).update({ paid_amount: 300 });
    await db('ledger').insert({ customer_id: 3, account_type: 'Payment', debit: 0, credit: 300, reference_id: 'SO-1778744832172_PAY' });

    await db('sales_orders').where({ id: 4 }).update({ paid_amount: 150 });
    await db('ledger').insert({ customer_id: 3, account_type: 'Payment', debit: 0, credit: 150, reference_id: 'SO-1778745962779_PAY' });
    
    console.log("Updated ledger and sales data for initial data");
    process.exit(0);
})();
