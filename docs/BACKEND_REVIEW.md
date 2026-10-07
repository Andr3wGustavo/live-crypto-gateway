# Revisão do backend — 06/10/2026

## Resultado e escopo

Revisão dos pontos de entrada HTTP, autenticação/sessões, configuração do criador, upload/TTS, verificação de pagamentos, reconciliação, ledger/outbox, WebSocket, armazenamento e logging. Foram corrigidos problemas reproduzíveis e adicionados testes de regressão. Esta revisão de código não substitui auditoria independente, pagamentos testnet reais, recuperação em PostgreSQL/Redis ou homologação na VPS.

**Evidência inicial da rodada:** 45 testes backend, **42 aprovados e 3 pulados** por ausência de `TEST_DATABASE_URL`; auditoria npm de dependências de produção sem vulnerabilidades reportadas após atualizar Axios para 1.20.0. Lint do produto, seis testes de idiomas e TypeScript passaram. O comando combinado atingiu timeout na primeira tentativa de TypeScript; a execução isolada posterior passou.

**Atualização de 07/10:** Docker Desktop iniciado com autorização; PostgreSQL e Redis saudáveis. O runner de migrações terminou com sucesso. A suíte foi repetida com PostgreSQL real: **45 aprovados, zero falhas e zero pulados**. Isso valida também as alterações de configuração e concorrência no banco. Os testes ainda usam substitutos Redis e fixtures RPC/provedor; não houve pagamento on-chain ou teste de OBS Studio real. A inicialização do frontend foi bloqueada pelo preflight de memória do `.bat`.

## Correções

| Área | Problema encontrado | Alteração | Verificação |
|---|---|---|---|
| Sessões | Logout podia retornar sucesso se a revogação falhasse no Redis | Revoga antes de limpar cookie; falha retorna 503 e permite repetir | Teste HTTP com falha injetada no Redis |
| Rotas autenticadas | Falha ao consultar a sessão era confundida com credencial inválida | Middleware retorna 401 para sessão inválida e 503 para armazenamento indisponível | Teste HTTP de acesso ao painel durante indisponibilidade |
| Cadastro | Dois primeiros logins simultâneos podiam disputar o INSERT | Upsert conserva uma única identidade; nonces continuam individuais | Duas assinaturas válidas concorrentes e mesma conta resultante |
| Desafios de login | Resposta do nonce não tinha proibição explícita de cache | Rotas de auth usam `Cache-Control: no-store`; limite de tentativas concentrado em nonce/verify | Teste de cabeçalho e fluxos existentes |
| Configurações | Atualização parcial resetava outros presets; `null` não removia mídia | Upsert atualiza apenas campos presentes; preserva zero/false e permite remover mídia | Testes de alterações concorrentes, isolamento entre criadores e recarga |
| Prévia | Configuração retornada pelo adaptador incluía propriedade interna | Resposta do painel projeta somente campos editáveis, como no PostgreSQL | Carregar e submeter o mesmo objeto de configuração retorna sucesso |
| Sincronização | Falha de publicação podia apresentar salvamento como falha total | Resposta distingue configuração salva de publicação em tempo real; painel exibe aviso localizado | Falha de publish injetada + teste do dado salvo |
| Upload | MIME/nome do cliente eram repassados sem identificação; chamada sem timeout | Identificação de cabeçalhos, tipo normalizado, limite de 5 MB, 20 tentativas/conta/hora por processo, timeout de 15 s e sem redirects | Upload válido, conteúdo falso, tipo incompatível, tamanho excedido e falha do provedor |
| Upload e presets | Caminho de gravação separado podia divergir da configuração | Reutiliza o mesmo salvamento parcial e publicação; URL contém indicação segura de extensão | Configuração recarregada preserva título/tema após upload |
| Métricas | `parseFloat` perdia precisão nos totais | Soma decimal exata e detalhamento adicional por rede | Teste acima do limite seguro de inteiros e frações de um wei |
| HTTP e logs | JSON inválido retornava 500; detalhes de provedor podiam aparecer em erros | Respostas 400/413; query string fora do access log; erro genérico sem dados do provedor | Testes de JSON malformado, arrays e payload excessivo |
| TTS | Identificador de voz aceitava caminhos; erro de provedor era refletido; requisição sem timeout | Validação do identificador, timeout e respostas sem detalhes/cache | Falha simulada, sem chamada paga real |
| Logging em produção | Importar o logger exigia gravar dentro da aplicação | Produção usa stdout/stderr; desenvolvimento tolera ausência de acesso a arquivos | Logger executado com filesystem simulado como não gravável |
| OBS lento | Mensagem descartada por backpressure podia ficar marcada em voo | Fecha consumidor lento com 1013; só marca em voo quando o envio é aceito | WebSocket real com pressão e armazenamento injetados, seguido de reconexão |
| Dependências | Auditoria encontrou vulnerabilidade alta em Axios | Atualização compatível do lockfile, sem `--force` | Suíte completa repetida e `npm audit --omit=dev --audit-level=high` sem achados |

## Notas de API e compatibilidade

- `POST /api/dashboard/config` aceita um objeto não vazio com campos conhecidos. Campos omitidos são preservados. `media_url: null`/`audio_url: null` removem o valor; URLs fornecidas precisam ser HTTPS e não conter credenciais.
- `realtime: true` significa publicação aceita pelo Redis, **não confirmação de exibição no OBS**. `realtime: false` informa que o dado foi salvo, mas o aviso em tempo real falhou. Uma nova conexão OBS carrega a configuração salva.
- `tokenBreakdown` agora retorna **strings decimais**, não números de ponto flutuante. `networkBreakdown` separa os valores por rede. `estimatedTotalUSD` continua `null`; não somar ativos de testnet com mainnet como se tivessem o mesmo valor econômico.
- Sem `PINATA_JWT`, upload retorna 503. Tipos identificados: PNG, JPEG, GIF, WebP, MP4 de marcas suportadas, MP3, WAV e Ogg. A identificação é por cabeçalho/container, **não um decoder completo nem antivírus**.
- Erros do provedor de upload retornam 502. Nenhum upload real foi feito nesta rodada: respostas Pinata foram simuladas nos testes.
- A revogação não pode ser confirmada enquanto o Redis está indisponível. O cookie é mantido para repetir o logout; a API também recusa operações autenticadas com 503 durante a falha.
- Não foi necessária uma nova migração para estas correções. As migrações já existentes continuam obrigatórias no modo persistente.

## Pontos revisados que ainda precisam de trabalho/homologação

| Prioridade | Área | Próxima evidência/ação |
|---|---|---|
| P0 | PostgreSQL e Redis reais | Suíte PostgreSQL aprovada em 07/10, incluindo upsert parcial e cadastro concorrente; ainda ensaiar interrupção/reconexão real do Redis e restauração |
| P0 | Pagamentos EVM/Solana | Validar com RPC e carteira reais: receptor/remetente/memo/referência, taxa, confirmações, falha e reorganização; testes atuais usam fixtures RPC |
| P0 | OBS durável | Repetir replay/ACK com PostgreSQL e OBS real; testar token rotacionado, instâncias concorrentes e falha entre exibição e ACK |
| P1 | Reconciliação | Exercitar varreduras que excedam a lease de 120 s, comportamento em múltiplas instâncias, janela de sete dias e estados de falha/substituição |
| P1 | Redis | A estratégia atual limita tentativas de reconexão; validar recuperação operacional após indisponibilidade prolongada |
| P1 | TTS pago | Manter `PUBLIC_TTS_ENABLED=false` até existir autenticação/quota de custo adequada. Timeout e redação de erros não resolvem controle de gastos |
| P1 | Upload | Limite por conta é local ao processo; faltam orçamento global, remoção/unpin de órfãos, validação completa de mídia e testes contra o provedor real |
| P1 | Cadastro | O upsert resolve a disputa por identidade; criação de conta, destino e sessão ainda não é uma transação única de ponta a ponta |
| P1 | Escala e administração | Rate limiting compartilhado, observabilidade, histórico operacional e restore/rollback precisam de testes e implementação adicional |
| P2 | Legado | `services/polling.js` não é iniciado pelo servidor e usa o fluxo antigo; não reativar. O caminho ativo é `paymentIntents.js` |

Os testes de backpressure usam conexões WebSocket reais e armazenamento simulado. Os testes HTTP usam assinaturas reais geradas em teste, mas não interagem com extensões de carteira. O backend não deve ser declarado pronto para mainnet por causa desses resultados.

## Como repetir

Sem Docker, dentro de `backend`:

```powershell
npm test
npm audit --omit=dev --audit-level=high
```

Com Docker Desktop aberto, na raiz versionada:

```powershell
docker compose up -d --wait
npm --prefix backend run migrate
$env:TEST_DATABASE_URL='postgresql://postgres:password@127.0.0.1:5432/livecrypto'
npm --prefix backend test
```

As credenciais acima pertencem exclusivamente ao Compose local de desenvolvimento. Use banco descartável ou de desenvolvimento; a suíte cria schemas isolados. O runner de migrações usa `POSTGRES_*` de `backend/.env`; `TEST_DATABASE_URL` configura a suíte, não o runner.

Para conferir o produto manualmente, siga [COMO_TESTAR.md](COMO_TESTAR.md). Não confundir aprovação da suíte com aprovação do ambiente de produção.
