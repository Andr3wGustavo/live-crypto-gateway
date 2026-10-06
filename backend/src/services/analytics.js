const { parseUnits, formatUnits } = require('ethers');

function summarizeTransactions(rows) {
  const confirmed = rows.filter(row=>row.status === 'CONFIRMED');
  const assets = Object.create(null), networks = Object.create(null);
  for (const row of confirmed) {
    const currency = String(row.currency || 'UNKNOWN').toUpperCase();
    const chain = String(row.chain_id || 'legacy');
    // PostgreSQL returns NUMERIC as a decimal string. Never round it via Number.
    const units = parseUnits(String(row.amount),18);
    assets[currency] = (assets[currency] || 0n) + units;
    networks[chain] ??= Object.create(null);
    networks[chain][currency] = (networks[chain][currency] || 0n) + units;
  }
  const format = totals=>Object.fromEntries(Object.entries(totals).map(([asset,units])=>[asset,formatUnits(units,18)]));
  return { totalTransactions:confirmed.length,estimatedTotalUSD:null,tokenBreakdown:format(assets),
    networkBreakdown:Object.fromEntries(Object.entries(networks).map(([chain,totals])=>[chain,format(totals)])),
    recentCount:Math.min(7,confirmed.length) };
}
module.exports = { summarizeTransactions };
