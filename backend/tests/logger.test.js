const { test } = require('node:test');
const assert = require('node:assert/strict');

test('production logging works without a writable application filesystem', t => {
  const previous=process.env.NODE_ENV;
  process.env.NODE_ENV='production';
  t.after(()=>{ if(previous===undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV=previous; });
  const fs=require('node:fs');
  t.mock.method(fs,'mkdirSync',()=>{throw new Error('Read-only filesystem');});
  t.mock.method(fs,'appendFile',()=>{throw new Error('Read-only filesystem');});
  const lines=[];
  t.mock.method(console,'log',(...args)=>lines.push(args));
  t.mock.method(console,'error',(...args)=>lines.push(args));
  const logger=require('../src/utils/logger');
  logger.info('Container startup'); logger.error('Provider unavailable',new Error('Example'));
  assert.equal(lines.length,2); assert.match(lines[0][0],/Container startup/);
});
