const { test } = require('node:test');
const assert = require('node:assert/strict');
const { summarizeTransactions } = require('../src/services/analytics');

test('analytics preserves single-wei precision, separates networks and excludes unconfirmed records', () => {
  const totals=summarizeTransactions([
    {chain_id:'1',currency:'ETH',amount:'9007199254740993.000000000000000001',status:'CONFIRMED'},
    {chain_id:'1',currency:'ETH',amount:'0.000000000000000001',status:'CONFIRMED'},
    {chain_id:'84532',currency:'ETH',amount:'1.0',status:'CONFIRMED'},
    {chain_id:'1',currency:'ETH',amount:'999',status:'PENDING'},
    {chain_id:'1',currency:'ETH',amount:'999',status:'FAILED'}
  ]);
  assert.equal(totals.totalTransactions,3);
  assert.equal(totals.tokenBreakdown.ETH,'9007199254740994.000000000000000002');
  assert.equal(totals.networkBreakdown['1'].ETH,'9007199254740993.000000000000000002');
  assert.equal(totals.networkBreakdown['84532'].ETH,'1.0');
  assert.equal(totals.estimatedTotalUSD,null);
});
