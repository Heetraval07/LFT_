// Minimal local SMTP server for testing the contact form without a real mailbox.
// Accepts AUTH PLAIN/LOGIN, stores each message as JSON in screenshots/mail/. Never relays anything.
//   node scripts/fake-smtp.mjs [port=2525] [--reject-auth]
import net from 'node:net';
import { mkdirSync, writeFileSync } from 'node:fs';

const port = Number(process.argv[2]) || 2525;
const rejectAuth = process.argv.includes('--reject-auth');
const dir = 'screenshots/mail';
mkdirSync(dir, { recursive: true });
let n = 0;

net.createServer((sock) => {
  let mode = 'cmd';
  let msg = { from: '', to: [], data: '', auth: '' };
  let buf = '';
  const say = (s) => sock.write(s + '\r\n');
  say('220 fake-smtp ready');
  sock.on('data', (chunk) => {
    buf += chunk.toString('utf8');
    let i;
    while ((i = buf.indexOf('\r\n')) >= 0) {
      const line = buf.slice(0, i);
      buf = buf.slice(i + 2);
      if (mode === 'data') {
        if (line === '.') {
          mode = 'cmd';
          const file = `${dir}/${Date.now()}-${++n}.json`;
          writeFileSync(file, JSON.stringify(msg, null, 2));
          say('250 OK queued');
          msg = { from: '', to: [], data: '', auth: msg.auth };
        } else msg.data += (line.startsWith('..') ? line.slice(1) : line) + '\n';
        continue;
      }
      if (mode === 'auth-user') { msg.auth = Buffer.from(line, 'base64').toString(); mode = 'auth-pass'; say('334 UGFzc3dvcmQ6'); continue; }
      if (mode === 'auth-pass') { mode = 'cmd'; say(rejectAuth ? '535 Authentication failed' : '235 Authenticated'); continue; }
      const cmd = line.slice(0, 4).toUpperCase();
      if (cmd === 'EHLO' || cmd === 'HELO') { sock.write('250-fake-smtp\r\n250-AUTH PLAIN LOGIN\r\n250 8BITMIME\r\n'); }
      else if (cmd === 'AUTH') {
        const [, type, init] = line.split(' ');
        if (type?.toUpperCase() === 'PLAIN') { msg.auth = Buffer.from(init || '', 'base64').toString().split('\0')[1] || ''; say(rejectAuth ? '535 Authentication failed' : '235 Authenticated'); }
        else { mode = 'auth-user'; say('334 VXNlcm5hbWU6'); }
      } else if (cmd === 'MAIL') { msg.from = line.replace(/^MAIL FROM:\s*/i, ''); say('250 OK'); }
      else if (cmd === 'RCPT') { msg.to.push(line.replace(/^RCPT TO:\s*/i, '')); say('250 OK'); }
      else if (cmd === 'DATA') { mode = 'data'; say('354 End data with <CR><LF>.<CR><LF>'); }
      else if (cmd === 'QUIT') { say('221 Bye'); sock.end(); }
      else if (cmd === 'RSET' || cmd === 'NOOP') say('250 OK');
      else say('502 Command not implemented');
    }
  });
  sock.on('error', () => {});
}).listen(port, '127.0.0.1', () => console.log(`fake SMTP listening on 127.0.0.1:${port}${rejectAuth ? ' (rejecting AUTH)' : ''}`));
