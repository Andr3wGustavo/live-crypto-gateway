"use client";

import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [streamer, setStreamer] = useState({ public_address: '0x...', obs_token: '1234-abcd-5678-efgh' });
  const [transactions, setTransactions] = useState([]);
  
  // Dummy dashboard data for now
  useEffect(() => {
    // In production, fetch from /api/dashboard with JWT
    setTransactions([
      { tx_hash: '0xabc...123', sender_address: '0x123...abc', amount: 50.5, currency: 'MATIC', status: 'CONFIRMED' },
      { tx_hash: '0xdef...456', sender_address: '0x456...def', amount: 10.0, currency: 'MATIC', status: 'CONFIRMED' }
    ]);
  }, []);

  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto">
      <header className="border-b border-primary pb-4 mb-8">
        <h1 className="text-2xl font-bold uppercase tracking-widest">&gt; LIVE CRYPTO DASHBOARD_</h1>
        <p className="mt-2 text-sm opacity-80">Welcome back, {streamer.public_address}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="border border-primary p-4 shadow-[0_0_10px_rgba(0,255,0,0.2)]">
          <h2 className="text-xl mb-4 border-b border-primary inline-block pb-1">-- SYSTEM INFO --</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs uppercase mb-1 opacity-70">OBS Browser Source URL</label>
              <div className="flex">
                <input 
                  type="text" 
                  readOnly 
                  value={`http://localhost:3000/overlay/${streamer.obs_token}`}
                  className="w-full p-2 text-sm bg-black text-primary border border-primary font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase mb-1 opacity-70">Donation Page URL (dApp)</label>
              <div className="flex">
                <input 
                  type="text" 
                  readOnly 
                  value={`http://localhost:3000/pay/1`}
                  className="w-full p-2 text-sm bg-black text-primary border border-primary font-mono"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="border border-primary p-4 shadow-[0_0_10px_rgba(0,255,0,0.2)]">
          <h2 className="text-xl mb-4 border-b border-primary inline-block pb-1">-- WALLET CONFIG --</h2>
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="block text-xs uppercase mb-1 opacity-70">Chain ID</label>
              <select className="w-full p-2 bg-black text-primary border border-primary">
                <option value="137">Polygon (137)</option>
                <option value="1">Ethereum (1)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase mb-1 opacity-70">Payout Address</label>
              <input 
                type="text" 
                placeholder="0x..." 
                className="w-full p-2 bg-black text-primary border border-primary font-mono"
              />
            </div>
            <button type="submit" className="w-full py-2 border border-primary hover:bg-primary/10 transition-colors uppercase font-bold tracking-wider">
              [ SAVE CONFIG ]
            </button>
          </form>
        </section>
      </div>

      <section className="mt-8 border border-primary p-4 shadow-[0_0_10px_rgba(0,255,0,0.2)]">
        <h2 className="text-xl mb-4 border-b border-primary inline-block pb-1">-- RECENT TRANSACTIONS --</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-primary/50 text-xs uppercase">
                <th className="p-2">TX Hash</th>
                <th className="p-2">Sender</th>
                <th className="p-2">Amount</th>
                <th className="p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx: any, i) => (
                <tr key={i} className="border-b border-primary/20 hover:bg-primary/5 text-sm">
                  <td className="p-2 font-mono">{tx.tx_hash}</td>
                  <td className="p-2 font-mono">{tx.sender_address}</td>
                  <td className="p-2">{tx.amount} {tx.currency}</td>
                  <td className="p-2">[{tx.status}]</td>
                </tr>
              ))}
            </tbody>
          </table>
          {transactions.length === 0 && (
            <p className="p-4 text-center opacity-70 italic">No transactions found.</p>
          )}
        </div>
      </section>
    </div>
  );
}
