import fs from 'node:fs';
const q=fs.readFileSync('questions.json','utf8');const html=fs.readFileSync('public/index.html','utf8');const s=fs.readFileSync('worker/server.js','utf8');fs.writeFileSync('worker/index.js','const Q='+q+';\nconst HTML='+JSON.stringify(html)+';\n'+s);
