# Lingol — Frontend (Angular 19)

PWA da plataforma Lingol. Consome os dois microsserviços .NET 9 do repositório
`Lingol.Backend`.

## Rodando

```
npm install
npm start
```

A aplicação sobe em `http://localhost:4200`. As duas APIs precisam estar no ar:

| Serviço | URL | Configurado em |
|---|---|---|
| Cadastro | http://localhost:5030 | `src/environments/environment.ts` |
| Pedagógico | http://localhost:5209 | `src/environments/environment.ts` |

Ambas já liberam CORS para `http://localhost:4200`, então não é preciso proxy.

## Estrutura

```
src/app/core/          AuthService, interceptor JWT, guards, services de API, SignalR
src/app/features/
  landing/             página inicial
  auth/                login do professor (com cadastro) e do aluno
  professor/
    dashboard/         lista e criação de turmas
    turma-detalhe/     alunos (com perfil AEE) e atividades da turma
    nova-atividade/    copiloto de IA: formulário + espera não bloqueante
    atividade-detalhe/ status, questões geradas e acerto por questão
    relatorio-turma/   dashboard diagnóstico (mapa de lacunas)
  aluno/
    home/              atividades liberadas para a turma do aluno
    atividade-simples/ questionário com feedback por questão
    jogo/              tabuleiro gamificado
      temas/           configuração de cada tema (textos, itens, avatar)
```

## Fluxo do professor

1. **Login / criar conta** → `/login-professor`
2. **Criar turma** (nome, ano, matéria) → `/professor`
3. **Cadastrar alunos** com matrícula e perfil AEE → `/professor/turmas/:id`
4. **Adaptar atividade**: livro, assunto, nº de questões e formato
   (questionário simples ou gamificado). O backend devolve **202** na hora e a
   tela não trava — o aviso chega por SignalR quando a IA termina.
5. **Dashboard diagnóstico** → `/professor/turmas/:id/relatorio`

O perfil AEE dos alunos da turma é resumido automaticamente e enviado no prompt
(ex.: "2 aluno(s) com TDAH"), sem o professor precisar digitar nada.

## Tempo real

`SignalRService` conecta em `/hubs/atividades` com o mesmo JWT e entra no grupo
`turma-{id}`. Eventos tratados:

| Evento | Efeito na tela |
|---|---|
| `AtividadeGerada` | Tela de espera vira "Atividade pronta"; lista da turma recarrega |
| `AtividadeErro` | Mostra o erro com botão "tentar de novo" |
| `CorrecaoPronta` | Dashboard recarrega sozinho quando a IA termina o diagnóstico |

Se o hub não conectar, as telas continuam utilizáveis — só perdem a atualização
automática (há botão "atualizar" na tela da atividade).

## Autenticação

O token JWT fica em `localStorage` (`lingol_token`) e é decodificado com
`jwt-decode` para extrair papel, id e `turmaId`. O interceptor anexa o header
`Authorization` em todas as chamadas e derruba a sessão em 401. Tokens expirados
são descartados ao carregar a página.

## Fluxo do aluno

1. **Login** com nome completo + número de matrícula → `/login-aluno`
2. **Atividades liberadas** da sua turma → `/aluno`
3. **Questionário** (`/aluno/atividades/:id`) ou **jogo** (`/aluno/jogo/:id`),
   conforme o formato escolhido pelo professor
4. Ao final: `"Você acertou X/N questões!"`

Cada resposta é enviada na hora (`POST /respostas/questao`) e devolve se acertou
mais a explicação da regra — é o que alimenta o modal de item ganho/perdido.
O backend aceita **uma tentativa por questão**, então não dá para ficar chutando.
Ao responder a última, o app chama `POST /finalizar`, que consolida o placar e
dispara o diagnóstico pedagógico.

## Temas do jogo

O tabuleiro é genérico; o tema é só configuração em
`features/aluno/jogo/temas/`. Para criar um tema novo:

1. Copie `tema-fantasia.ts` e ajuste textos, itens, ícones, avatar e arte;
2. Registre em `index.ts`;
3. Adicione o id em `TemasAtividade` no backend
   (`Pedagogico.Domain/Entities/Atividade.cs`) e a ambientação correspondente
   em `GeminiPrompts.AmbientacaoDoTema`.

O seletor de tema aparece sozinho na tela do professor quando o formato
gamificado é escolhido.

O jogo se adapta ao número de questões: com 5 questões são 5 fases, 5 slots de
itens e a narrativa fala em 5. O teto é **10** (tamanho do tabuleiro), validado
no frontend e no backend.
