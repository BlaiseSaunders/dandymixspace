const WebSocket = require('ws');
const fs = require('fs');
const uuidv4 = require('uuid/v4');

//const pcm_file = './test.raw';
const pcm_file = './out.raw';
let interval = 0,
    sampleRate = 44100,
    bytePerSample = 2,
    channels = 2,
    bytesChunk = (sampleRate * bytePerSample * channels),
    offset = 0,
    pcmData,
    wss;

function noop() {}

function heartbeat() 
{
  this.isAlive = true;
}


fs.readFile(pcm_file, (err, data) => {
    if (err) throw err;
    pcmData = data;
});

openSocket();



function openSocket() {
  wss = new WebSocket.Server({ port: 8080 });
  console.log('Server ready...');
 

  wss.on('connection', function connection(ws) 
  {
        ws.isAlive = true;
        ws.on('pong', heartbeat);
       
        console.log('Socket connected. sending data...');
        if (interval)
            clearInterval(interval);
        interval = setInterval(function() {
          sendData();
        }, 250);
  });

  wss.on('error', () => {console.log("peepeepoopoo");});

  const ninterval = setInterval(function ping() {
    wss.clients.forEach(function each(ws) {
      if (ws.isAlive === false) 
      {
        console.log("got no pang");
        return ws.terminate();
      }
  
      ws.isAlive = false;
      ws.ping(noop);
    });
  }, 1500);
}



function sendData() {
    let payload;
    if (offset >= pcmData.length) {
       offset = 0;
    }
    
    console.log("Sending data...");

    payload = pcmData.subarray(offset, (offset + bytesChunk));
    offset += bytesChunk;
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
          client.send(payload);
      }
    });
}