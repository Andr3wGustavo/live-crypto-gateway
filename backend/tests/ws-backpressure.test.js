process.env.NODE_ENV='test';
process.env.DEV_MEMORY_MODE='true';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {once}=require('node:events');
const http=require('node:http');
const WebSocket=require('ws');
const db=require('../src/db');
const {initWebSocket}=require('../src/ws');

test('a backpressured WebSocket closes without ACK and the next connection can receive the alert', {timeout:10000}, async t=>{
  const previous=db.isMemory;
  let acknowledged=false;
  // Storage is injected to isolate the transport failure. PostgreSQL semantics
  // remain covered by the separate database integration suite.
  t.mock.method(db,'query',async(sql)=>{
    if(sql.includes('FROM Streamers'))return {rows:[{id:1,public_address:'test-creator'}]};
    if(sql.includes('INSERT INTO Alert_Consumers'))return {rows:[{owner:'consumer'}]};
    if(sql.includes('SELECT o.event_id'))return {rows:acknowledged?[]:[{event_id:'1',payload:{event:'DONATION',amount:'1',currency:'POL'}}]};
    if(sql.includes('UPDATE Donation_Outbox'))acknowledged=true;
    return {rows:[]};
  });
  db.isMemory=false;
  const server=http.createServer(), wss=initWebSocket(server), sockets=[];
  let congested=true;
  wss.on('connection',socket=>Object.defineProperty(socket,'bufferedAmount',{get:()=>congested?1024*1024:0}));
  server.listen(0,'127.0.0.1'); await once(server,'listening');
  try {
    const url=`ws://127.0.0.1:${server.address().port}/?obs_token=test-token`;
    const first=new WebSocket(url); sockets.push(first);
    const [code]=await once(first,'close',{signal:t.signal});
    assert.equal(code,1013); assert.equal(acknowledged,false);
    congested=false;
    const second=new WebSocket(url); sockets.push(second);
    const donation=new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(new Error('No replay after reconnect')),3000);
      second.on('message',raw=>{const event=JSON.parse(raw);if(event.event==='DONATION'){clearTimeout(timer);resolve(event);}});
    });
    assert.equal((await donation).event_id,'1'); assert.equal(acknowledged,false);
  } finally {
    sockets.forEach(socket=>socket.terminate());
    await new Promise(resolve=>wss.close(resolve)); await new Promise(resolve=>server.close(resolve));
    db.isMemory=previous; await db.close();
  }
});
