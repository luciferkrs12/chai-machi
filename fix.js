const fs = require('fs');
let file = fs.readFileSync('src/pages/Customers.tsx', 'utf8');
file = file.replace("{o.payment_method === 'Credit' ? 'Unpaid' : 'Paid'}", "{o.payment_method === 'Credit' ? ( <div className='flex justify-end gap-2 items-center'><span className='px-2 py-1 rounded text-xs font-bold bg-destructive/10 text-destructive whitespace-nowrap'>Unpaid</span><button onClick={() => payCredit(o.id)} className='px-2 py-1 bg-primary text-primary-foreground text-xs font-bold rounded hover:opacity-90 transition whitespace-nowrap'>Settle</button></div> ) : ( <span className='px-2 py-1 rounded text-xs font-bold bg-success/10 text-success'>Paid ({o.payment_method})</span> )}");
fs.writeFileSync('src/pages/Customers.tsx', file);
