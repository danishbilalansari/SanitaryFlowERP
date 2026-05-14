import db from './src/lib/db';
(async () => {
    const res = await db('customers')
        .leftJoin('ledger', 'customers.id', 'ledger.customer_id')
        .select('customers.id', 'customers.name', 'customers.company', 'customers.city', 'customers.phone')
        .sum('ledger.debit as total_sales')
        .sum('ledger.credit as total_purchases_payments')
        .groupBy('customers.id', 'customers.name', 'customers.company', 'customers.city', 'customers.phone')
        .orderBy('customers.city', 'asc');
    console.log(JSON.stringify(res, null, 2));
    process.exit(0);
})();
