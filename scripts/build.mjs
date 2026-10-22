import fs from 'node:fs';
const sources = {
 arquitetura: ['Arquitetura e Manutenção de Computadores', 'questions.json'],
 html_css: ['HTML/CSS', 'questions_html_css.json'],
 logica_python: ['Lógica de Programação e Python', 'questions_logica_python.json']
};
const questions=[], subjects={};
for(const [id,[label,file]] of Object.entries(sources)){
 const bank=JSON.parse(fs.readFileSync(file,'utf8'));
 if(bank.length<20)throw Error('Banco incompleto: '+id);
 const start=questions.length;
 for(const q of bank){if(q.length!==4||q[1].length!==4||!Number.isInteger(q[2])||q[2]<0||q[2]>3)throw Error('Questão inválida: '+id);questions.push(q)}
 subjects[id]={label,indices:bank.map((_,i)=>start+i)};
}
fs.writeFileSync('lib/engine.js','const Q='+JSON.stringify(questions)+';\nconst SUBJECTS='+JSON.stringify(subjects)+';\nconst HTML="";\n'+fs.readFileSync('lib/game.js','utf8'));
console.log('Build Vercel concluído: '+questions.length+' questões, '+Object.keys(subjects).length+' disciplinas.');
