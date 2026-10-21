import fs from 'node:fs';
const questions=JSON.parse(fs.readFileSync('questions.json','utf8'));
if(questions.length<100)throw Error('Banco incompleto');
for(const q of questions)if(q.length!==4||q[1].length!==4||!Number.isInteger(q[2])||q[2]<0||q[2]>3)throw Error('Questão inválida');
fs.writeFileSync('lib/engine.js','const Q='+JSON.stringify(questions)+';\nconst HTML="";\n'+fs.readFileSync('lib/game.js','utf8'));
console.log('Build Vercel concluído: '+questions.length+' questões, interface e API.');
