# Hardware Arena — versão Vercel

Este pacote substitui o ZIP anterior para hospedagem na Vercel. Possui 100 questões, treino individual, salas compartilhadas, pontuação, CSV e novas rodadas.

## 1. Substituir o projeto no GitHub

Extraia este ZIP. Envie o CONTEÚDO da pasta hardware-arena-vercel para a raiz do repositório utilizado na Vercel. package.json, vercel.json, public/, api/, lib/, questions.json e scripts/ precisam ficar no mesmo nível. Não misture com os arquivos antigos: substitua o projeto anterior para evitar que a Vercel use o antigo scripts/build.sh. Não envie arquivos .env com credenciais ao GitHub.

## 2. Configurar a Vercel

Abra o projeto > Settings > Build and Deployment (ou a seção de configurações de build).

- Framework Preset: Other.
- Root Directory: pasta onde está o novo package.json; deixe vazio se estiver na raiz do repositório.
- Build Command: npm run build. Remova qualquer override antigo que aponte para bash scripts/build.sh.
- Output Directory: public. Remova qualquer override antigo que aponte para dist.
- Install Command: padrão npm install.
- Node.js: 22.x ou versão superior suportada.

O vercel.json do pacote já declara o build e a pasta pública.

## 3. Conectar o banco para as salas

A interface e o treino funcionam sem o Redis. Criar sala e sincronizar os alunos exigem o banco.

Na Vercel, abra Storage ou Marketplace, procure Upstash Redis, crie/selecione um banco e conecte-o a este projeto. Se a interface mudar, você também pode criar o banco em https://console.upstash.com e copiar as credenciais REST para as variáveis do projeto Vercel.

Em Settings > Environment Variables, confira estas duas variáveis:

UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN

Use a URL HTTPS REST e o token REST com leitura E escrita, não o token read-only e não a URL redis://. Marque o ambiente Production e também Preview se quiser testar os deployments de preview. O adaptador também aceita KV_REST_API_URL e KV_REST_API_TOKEN quando a integração fornece esses nomes. Nunca coloque esses valores no HTML nem compartilhe seu token.

## 4. Fazer Redeploy

Depois de salvar as variáveis, vá em Deployments > Redeploy. Para eliminar configuração antiga, faça o primeiro redeploy sem reutilizar o cache de build, se a opção estiver disponível.

Abra https://SEU-DOMINIO.vercel.app/api/health. Com o banco conectado deve retornar:

{"ok":true,"storage":"connected"}

Se aparecer mensagem de configuração, confira as variáveis e refaça o deploy. O banco é um serviço externo; os limites e os custos são os do plano escolhido. Nenhum banco ou assinatura é criado pelo ZIP.

## 5. Jogar

Professor: Criar uma partida > escolher 5, 10 ou 20 questões e o tempo > Criar sala.
O código de seis números aparece na tela de espera.
Alunos: abrir o mesmo endereço do site no celular, informar código e nome.
Professor: iniciar, revelar resposta e avançar.
No final: baixar CSV e clicar em Nova rodada. Mantém sala e participantes e zera o placar.
Com 20 perguntas: cinco rodadas sem repetição antes de reiniciar o banco.

Salas e registros expiram após 24 horas. Cada atualização da sala consulta o banco; a turma acompanha as alterações em aproximadamente três segundos, além da latência da rede. A pontuação usa o tempo recebido pelo servidor, portanto a conexão pode influenciar o resultado. Para avaliar notas, considere também o número de acertos.

## 6. Editar ou testar

Edite questions.json: [enunciado, [A, B, C, D], índice correto 0–3, explicação].
Edite public/index.html para alterar o visual e lib/game.js para alterar regras.
Execute npm run build depois de alterar perguntas ou regras.
Execute npm test para verificar o pacote. O teste usa Redis simulado; não estabelece conexão com um banco real.

Validação desta entrega: build e quatro testes passaram, cobrindo API, configuração, treino sem Redis, persistência entre invocações, pontuação e cinco rodadas sem repetição. O pacote ainda precisa ser publicado na sua conta Vercel e validado com as credenciais reais. Nenhum deploy na sua conta foi realizado.

Referências oficiais:
https://vercel.com/docs/functions/runtimes/node-js
https://vercel.com/docs/redis
https://upstash.com/docs/redis/features/restapi

## Atualização 2.2 — alternativas embaralhadas por aluno

Em salas NOVAS, cada participante recebe as alternativas em uma ordem sorteada individualmente. A pergunta permanece sincronizada para a turma. A posição permanece estável ao atualizar a página e nas consultas automáticas. O servidor converte a escolha para a alternativa original antes de calcular os pontos. A revelação destaca a alternativa correta na ordem de cada aluno. No professor, a ordem permanece a original, e a resposta é apresentada por texto para evitar confusão com letras diferentes nos celulares.

As 24 ordens possíveis podem coincidir entre alunos; o sorteio é independente, não uma garantia de ordem exclusiva. Salas criadas antes da atualização conservam o comportamento anterior: crie uma sala nova para ativar o embaralhamento. O treino individual mantém seu comportamento anterior.

Para instalar: substitua os arquivos deste ZIP no mesmo repositório, preservando as variáveis Redis na Vercel. Use Framework Other, Build npm run build e Output public. Aguarde um NOVO deploy do commit atualizado; redeploy de commit antigo não incorpora as mudanças. Não reintroduza server.mjs nem scripts/build.sh. A raiz do repositório deve conter api/, lib/, public/, scripts/, package.json e vercel.json.

Cinco testes passaram, incluindo ordem individual, estabilidade ao recarregar, acertos e erros após embaralhar, destaque da resposta e cinco rodadas sem repetir questões. A atualização não foi publicada na sua conta Vercel por este ambiente; exige o envio ao repositório e um novo deploy. Os testes do banco usam um Redis simulado.
