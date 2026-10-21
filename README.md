# Hardware Arena — 100 questões

Quiz de Arquitetura e Manutenção de Computadores para o professor Janiel.

## Executar no computador (Windows, Linux ou macOS)

1. Instale Node.js 22 ou superior.
2. Extraia o ZIP inteiro para uma pasta.
3. No Windows, abra iniciar.bat. Alternativamente, no terminal desta pasta execute:

```
node scripts/assemble.mjs
node server.mjs
```

4. No computador do professor, abra http://localhost:3000.
5. Nos celulares, conecte à mesma rede Wi-Fi e abra http://IP-DO-PROFESSOR:3000 (por exemplo, http://192.168.1.10:3000). No Windows, ipconfig mostra o IPv4. Pode ser necessário liberar o Node.js no firewall para a rede privada. Algumas redes escolares isolam os dispositivos.
6. O servidor precisa permanecer ligado. Não use localhost no celular: localhost aponta para o próprio aparelho.

## Partidas e novas rodadas

- Professor: Criar uma partida, escolher 5, 10 ou 20 perguntas e o tempo.
- Alunos: informar código e nome. Aguardar o professor.
- Professor: iniciar, revelar resposta, avançar. O prazo encerra as respostas; o professor controla o avanço.
- Ao concluir, baixar o CSV antes de começar outra rodada.
- Clique em Nova rodada: mantém o código e os participantes e zera o placar da rodada. Os alunos aguardam na mesma tela.
- As questões são sorteadas sem repetição entre rodadas da sala até esgotar o banco. Quando não há perguntas suficientes para completar uma rodada, o banco é reiniciado.
- Com 20 perguntas por rodada, há 5 rodadas sem repetir perguntas. Com 10, há 10; com 5, há 20.
- O treino individual também sorteia 20 questões e permite nova rodada. O histórico do treino vale enquanto a página permanece aberta.
- As salas expiram após 24 horas. No modo local, os registros ficam em .arena-data. O CSV contém apenas a rodada atual.

## Pontos

Resposta certa: arredondar(500 + 500 × tempo restante / tempo total).
Resposta errada ou fora do prazo: zero. Classificação pela soma da rodada. Empates não têm desempate adicional.

## Editar perguntas

Edite questions.json: [enunciado, [alternativa A, B, C, D], índice correto de 0 a 3, explicação].
Depois execute node scripts/assemble.mjs e reinicie o servidor. Reinicie partidas após alterar o banco: salas existentes referenciam a ordem das questões.

## Hospedar para acesso pela internet

O ZIP inclui o servidor Node e um Worker para Cloudflare com armazenamento R2. Em hospedagem Node, use um disco persistente e uma única instância para este adaptador local. Não exponha uma instalação com dados de teste sem revisar o ambiente e o acesso.

Cloudflare: crie um bucket R2 chamado hardware-arena-rooms, ajuste wrangler.jsonc se necessário, execute node scripts/assemble.mjs e publique com Wrangler na sua conta. O bucket deve ficar privado e ser acessado apenas pelo Worker.

Não basta enviar a pasta public à Vercel: isso não executa o servidor de salas. A implantação na Vercel exige adaptar o backend e conectar armazenamento compartilhado persistente. O ZIP funciona diretamente com Node ou Worker/R2.

A pasta offline contém index.html: abra para treino individual sem servidor, sem internet e sem instalação. Salas em vários dispositivos precisam do servidor; os botões de sala informam essa necessidade no arquivo offline.

## Arquivos

public/index.html: interface. questions.json: banco com 100 questões. worker/server.js: lógica do servidor. worker/index.js: pacote gerado. server.mjs: servidor local. scripts/assemble.mjs: montagem. Nenhuma dependência npm é necessária no modo Node.

Validação: fluxo de sala, autorização do professor, prazo, pontuação, nova rodada, permanência dos alunos e não repetição do banco verificados com testes automatizados. O layout não teve conferência visual no navegador nesta atualização.
