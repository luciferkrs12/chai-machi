const fs = require('fs');
let lines = fs.readFileSync('src/pages/Customers.tsx', 'utf8').split('\n');

// Replace lines 199-201 (0-indexed: 198-200) with the full ledger block
const newLines = [
  ...lines.slice(0, 199), // lines 1-199 (keep up to and including the h3 heading)
  `                   <div className="space-y-3 mb-4">`,
  `                      {selectedCustOrders.length === 0 ? (`,
  `                         <div className="rounded-xl border py-10 text-center text-muted-foreground text-sm">No completed transactions yet</div>`,
  `                      ) : selectedCustOrders.map(o => (`,
  `                         <div key={o.id} className={\`rounded-xl border overflow-hidden \${o.payment_method === 'Credit' ? 'border-destructive/30 bg-destructive/5' : 'bg-card'}\`}>`,
  `                            <div className="flex items-center justify-between px-4 py-3 border-b">`,
  `                               <div>`,
  `                                  <p className="text-xs text-muted-foreground font-mono">#{o.id.substring(0,8)}</p>`,
  `                                  <p className="text-sm font-semibold text-foreground">`,
  `                                     {new Date(o.completed_at ?? o.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
  `                                  </p>`,
  `                               </div>`,
  `                               <div className="flex items-center gap-3">`,
  `                                  <p className="text-lg font-bold text-foreground">\u20b9{o.total_amount}</p>`,
  `                                  {o.payment_method === 'Credit' ? (`,
  `                                     <div className="flex items-center gap-2">`,
  `                                        <span className="px-2 py-1 rounded-full text-xs font-bold bg-destructive/10 text-destructive">Unpaid</span>`,
  `                                        <button onClick={() => payCredit(o.id)} className="px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full hover:opacity-90 transition">Settle \u2713</button>`,
  `                                     </div>`,
  `                                  ) : (`,
  `                                     <span className="px-2 py-1 rounded-full text-xs font-bold bg-success/10 text-success">Paid \u00b7 {o.payment_method}</span>`,
  `                                  )}`,
  `                               </div>`,
  `                            </div>`,
  `                            <div className="px-4 py-2 divide-y divide-border/50">`,
  `                               {o.items.map(item => (`,
  `                                  <div key={item.id} className="flex items-center justify-between py-2">`,
  `                                     <div className="flex items-center gap-2">`,
  `                                        <span className="text-xs font-bold text-primary bg-primary/10 rounded px-1.5 py-0.5">{item.quantity}\u00d7</span>`,
  `                                        <span className="text-sm text-foreground">{item.product_name}</span>`,
  `                                     </div>`,
  `                                     <span className="text-sm font-semibold text-foreground">\u20b9{item.total}</span>`,
  `                                  </div>`,
  `                               ))}`,
  `                            </div>`,
  `                         </div>`,
  `                      ))}`,
  `                   </div>`,
  `                </div>`,  // closes <div className="p-6 print:p-0">
  `              </motion.div>`,
  `           </motion.div>`,
  ...lines.slice(204) // from line 205 onward (the )} and </AnimatePresence> etc)
];

fs.writeFileSync('src/pages/Customers.tsx', newLines.join('\n'));
console.log('Done! Total lines:', newLines.length);
