# Retomada e roadmap — LiveCrypto

Registro de retomada: **04/10/2026**. Este arquivo registra decisões, pendências e evidências. Implementação, validação local, publicação no GitHub e implantação na VPS são etapas distintas.

## Objetivo

Concluir uma beta controlada de doações cripto não custodiais para criadores, com login por carteira, destinos de recebimento explícitos, checkout verificável e alertas recuperáveis para OBS.

Fluxo do criador: **entrar com carteira → conferir o destino → configurar overlay → instalar no OBS → testar → compartilhar o checkout público**.

## Estado no início da retomada (04/10)

- A base inclui autenticação por assinaturas EVM/Solana, cookies revogáveis, cadastro de destinos, intenções persistentes, reconciliação, ledger e outbox de alertas.
- A inicialização Windows foi corrigida após falta de memória e timeouts; exige nova conferência na retomada.
- A landing anterior (Afterglow, roxo/laranja) foi testada. O redesign seguinte, Matrix, ficou incompleto e ainda não tem a mesma evidência.
- Os componentes `Brand`, `BlockchainScene` e `CreatorGuide` existem. Falta concluir a integração do guia e da identidade nas telas do produto e testar a interação.
- Dockerfiles, Compose, proxy e CI foram preparados localmente. Nenhuma VPS foi implantada nesta entrega.
- No início desta retomada, o último commit local era `7ce5629`; havia alterações acumuladas sem commit. A publicação deve ser confirmada pelo Git, não presumida.

## Direção visual aprovada

1. **Act VII (vigente): campanha ciano, superfície cinematográfica.** Pedido do responsável por uma direção unificada inspirada na Rockstar, com o roxo removido. Landing, login, painel, checkout e overlay compartilham base quase preta `#04090d`, ciano elétrico `#22e6ff`, azul `#0891b2`/`#2b9dff` e gelo `#d7f7ff`; Anton nos títulos, Inter Tight no corpo e JetBrains Mono na telemetria. Botões usam um único padrão de cápsula de vidro preenchida (primário em gradiente ciano, secundário em vidro escuro), cards são superfícies de vidro arredondadas de 16–22 px e o cabeçalho superior foi substituído por uma navegação lateral de vidro: 84 px recolhida / 268 px aberta no desktop, abrindo no hover ou no foco de teclado e recolhendo quando o ponteiro sai, sem botão no desktop. Abaixo de 980 px vira gaveta de altura total com hambúrguer, X, scrim, foco preso e Escape. O logo permanece visível, o seletor de idioma é apenas um ícone de globo e a seção atual do trilho é marcada por scroll spy.
2. Estilo retrô/Matrix inspirado em blockchain, com identidade própria — base histórica que permanece no git e nos contratos de movimento.
3. Azul, ciano e verde da logo como base. O roxo foi **removido** no Act VI; a paleta passa a ser ciano `#22e6ff`, azul `#2b9dff`, gelo `#d7f7ff` e aço `#04090d`.
4. Referências de apresentação cinematográfica e narrativa por scroll de sites como Rockstar; aplicar o princípio de movimento e ritmo à explicação do produto. No Act VI o vídeo do cubo é a entrada embutida do herói e o vídeo da malha é uma faixa de fundo em `#in-motion`, nunca um card de player.
5. Animação blockchain visível em desktop e celular, com reprodução automática, exploração por etapas, replay e rolagem — sem botão de pausa.
6. Movimento é regra, não opção: não há botão de pausa, ativação ou opt-in em nenhuma tela. Isso inclui quem usa `prefers-reduced-motion`; a decisão é explícita do responsável e o trade-off de acessibilidade está registrado em `STATUS.md` e `docs/LANDING_DESIGN.md`.
7. Mesma linguagem visual na landing, login, painel, checkout e overlay — todos na mesma superfície escura e nos mesmos tokens.
8. Tipografia legível e explicação clara de recebimento, assinatura, rede, taxas e OBS.
9. Contraste: texto principal em gelo `#f4fcff`, corpo em `#b9d3dd`, apoio em `#7e9aa6`. Ciano marca números, réguas e estados, sem carregar parágrafos longos.

## Roadmap com critérios verificáveis

| ID | Prioridade | Entrega | Estado na retomada | Critério de conclusão | Dependência |
|---|---|---|---|---|---|
| R01 | P0 | Registrar e revisar o trabalho acumulado | Organizado em commits; referências no histórico abaixo | Estado fiel documentado; arquivos revisados e commits publicados | Git e acesso ao remoto |
| R02 | P0 | Inicialização local | Implementada; revalidar | API, frontend e páginas abrem pelo `.bat`; encerramento libera portas | Node e memória disponível |
| R03 | P0 | Identidade Matrix compartilhada | Integrada; validação visual/build pendentes | Landing/login/painel/checkout coerentes, responsivos e navegáveis | Revisão visual e build |
| R04 | P0 | Animação blockchain | Implementada; validar | Movimento real, controles de auto/scroll/replay, scrubber e comportamento em viewport pequeno verificados no navegador (sem pausa) | Chromium; testes mobile |
| R05 | P0 | Guia do criador | Integrado; validar interação | Login, destino, OBS e link público explicados dentro das telas | R03 |
| R06 | P0 | Banco e migrações | Suíte PostgreSQL e runner local aprovados em 07/10; restore/upgrade de produção pendentes | Suíte passa em PostgreSQL; instalação nova e atualização verificadas | Docker ou banco descartável |
| R07 | P0 | Dependências e isolamento | Revisão pendente | Auditoria atualizada; problemas corrigidos sem downgrade incompatível; sessões e isolamento testados | Dependências/RPCs |
| R08 | P0 | Doação EVM em testnet | Pendente | Carteira real → router → ledger exato → alerta OBS; repetição não duplica crédito | Router, RPC e carteiras de teste |
| R09 | P0 | Doação Solana em Devnet | Pendente | Assinatura, cluster, referência, split e finalização verificados de ponta a ponta | SDK, RPC e carteiras de teste |
| R10 | P0 | OBS real e recuperação | Implementado; validar no OBS | Offline, replay, rajadas, ACK, token rotacionado e reinício verificados | OBS e R06 |
| R11 | P1 | Staging na VPS | Artefatos preparados | Imagens, migrações, HTTPS/WSS, healthchecks e restart verificados | Provedor, domínio, DNS e acesso |
| R12 | P1 | Operação e recuperação | Pendente | Backup externo restaurado; alertas operacionais e rollback ensaiados | R11 |
| R13 | P1 | Piloto de criadores | Pendente | Começar com 5 criadores; medir ativação, falhas, suporte e retorno | Fluxo testnet aprovado |
| R14 | P1 | Modelo comercial | Hipóteses documentadas | Validar taxa, custos, condições, suporte e mercados atendidos | Piloto e decisões do negócio |
| R15 | P2 | Receita em mainnet | Pendente | Revisão independente, configuração aprovada, operação e piloto controlado | R08–R14 |
| R16 | P2 | Aquisição e expansão | Plano documentado | Conteúdo e parcerias com conversão medida; investimento guiado por retenção | Produto confiável e métricas |
| R17 | P0 | Identidade Sui e múltiplas carteiras | Implementada; testes criptográficos passam; validação com extensões reais pendente | Login Sui (ed25519/secp256k1), payout Sui, Slush/Sui Wallet, Phantom/Solflare/Backpack, RPC Solana configurável e SIWE vinculado à rede | Extensões instaladas e carteiras de testnet |

**Próximo foco:** concluir R03–R05 e verificar R02/R04. Staging vem depois da primeira validação local; mainnet permanece uma etapa separada.

## Recebimento, acesso e segurança na interface

- Conectar uma carteira não é o mesmo que autenticar: o login exige assinatura de uma mensagem.
- Assinatura de login e transação de doação devem ser distinguidas antes da autorização.
- A carteira de acesso identifica a conta; o endereço de recebimento deve ser conferido por rede.
- O criador recebe a parte líquida na carteira configurada. Não há saldo custodial para sacar na plataforma.
- A confirmação da rede antecede o registro e o alerta. Não prometer liquidação instantânea.
- O link de checkout é público. A URL do overlay é privada e autoriza acesso aos alertas.
- Nunca solicitar seed phrase, senha da carteira ou chave privada.
- Um comando de teste enviado não comprova que o OBS exibiu ou reproduziu áudio.

## VPS

Proposta inicial de dimensionamento: Linux LTS, 4 vCPU, 8 GB RAM e aproximadamente 80 GB SSD, a confirmar conforme preço e carga medida. Banco e Redis sem exposição pública; acesso HTTP/WSS pelo proxy TLS. Backups precisam ficar também fora da VPS.

Decisões ainda necessárias: **provedor, orçamento, região, domínio, DNS e acesso administrativo**. Criar staging separado, com segredos e carteiras de teste próprios. A VPS não transforma código em operação validada automaticamente.

## Monetização e divulgação

- Testnet: aprendizado com poucos criadores, sem receita real.
- Piloto comercial: taxa transparente por doação verificada; a hipótese inicial foi 2%, sujeita a validação.
- Assinaturas Pro/Studio: avaliar depois de demonstrar demanda e custos; não estão implementadas como cobrança.
- Aquisição inicial: contato com criadores, demonstrações, comunidades e conteúdo de instalação/OBS.
- Tráfego pago: experimentar depois de medir ativação e retenção, com limites e custo de aquisição conhecido.
- Termos, privacidade, tributação, mercados e suporte exigem decisões do responsável e revisão adequada antes da operação comercial.

Detalhamento: `PRODUCT_BUSINESS_AND_GTM_PLAN.md` e `PRODUCTION_GLOBAL_LAUNCH.md`, na raiz do repositório.

## Política de trabalho e publicação

O responsável autorizou explicitamente **commits e pushes regulares para o GitHub**, acompanhados de documentação.

Em cada etapa: revisar o diff → executar verificações pertinentes → registrar evidências e bloqueios → stage somente dos arquivos intencionais → commit em inglês → push → confirmar hash remoto.

Não publicar segredos, arquivos `.env`, chaves, tokens de overlay ou dados privados. Não marcar como testado um cenário pulado, nem confundir push com deploy. Não usar force-push ou ignorar hooks. Se o push falhar, registrar e corrigir a causa antes de declarar publicação.

## Histórico de retomada

| Data | Marco | Evidência | Publicação |
|---|---|---|---|
| 04/10/2026 | Registro inicial da retomada | Status e componentes conferidos; testes históricos separados da revisão Matrix | `cfe2335`, push confirmado |
| 05/10/2026 | Integração Matrix, guias e revisão do trabalho acumulado | TypeScript/lint aprovados; 6 testes de idiomas; 32 backend aprovados e 3 pulados | `881b112` |
| 05/10/2026 | Infraestrutura, launcher e CI | 5 testes do launcher aprovados; CI inclui lint/build e PostgreSQL; execução remota ainda não verificada | `d961787` |
| 06/10/2026 | Revisão do backend e guia de testes | 42 testes backend aprovados, 3 pulados; audit sem achados; lint/idiomas/TypeScript aprovados | Consultar o commit desta revisão |
| 07/10/2026 | Docker iniciado e validação persistente | PostgreSQL/Redis saudáveis; migrações conferidas; 45 testes aprovados com PostgreSQL, nenhum pulado | Consultar o commit deste registro |
| 30/10/2026 | Camada cinematográfica da landing | TypeScript, lint e 6 testes de idiomas aprovados; revisão Chromium headless em 1440×900, 1024×800 e 390×844 sem overflow horizontal nem erros de console; intro, skip, reveals, tilt, spotlight e modo de movimento reduzido exercitados; build de produção aprovado (14 páginas) e spot check do bundle em 3001 | Consultar o commit desta revisão |
| 31/10/2026 | Act II: sistema de movimento em todo o produto | Preferência de movimento compartilhada; atmosfera, cortina de rota, progresso de rolagem e luz de ponteiro; contadores, meta e alerta reais no Creator Studio; órbita e 4 etapas reais no login; divisão de taxa e linha do tempo do checkout; trilha de capítulos e interlúdio na landing; revelações observam nós montados após a API e existe fallback de hidratação em 2,4 s. TypeScript, lint, 6 testes de idiomas e build de produção (14 páginas) aprovados; revisão CDP do bundle em 1440×900, 1024×800 e 390×844 sem overflow e com 0 erros de console | Consultar o commit desta revisão |
| 01/11/2026 | Act III: painel de comando e densidade de dados reais | Chips de protocolo e deck de três nós no herói; espinha de capítulos sincronizada com o scroll; navegação com scroll-spy e skeletons no Creator Studio; gráfico de 14 dias alimentado pelo mesmo histórico (oculto de tecnologias assistivas), meta em anel e valores rápidos no checkout; anel de etapas e tremor de erro no login; foco visível e brilho de botões unificados. TypeScript, lint, 6 testes de idiomas e build (14 páginas) aprovados; revisão CDP em 1440×900 e 390×844 sem overflow, 0 erros de console, modo reduzido estático com opt-in | Consultar o commit desta revisão |
| 01/11/2026 | Act IV: movimento visível e controlável | Filme do herói de 0,2 para 0,38 de opacidade com deriva lenta; nova faixa “em movimento” com os dois vídeos de marca em loop, posters reais e selo `AUTO LOOP`/`PAUSED`; interruptor de movimento movido para o cabeçalho com `aria-pressed`; aviso explícito no herói quando o sistema pede movimento reduzido, com botão de ativação. Revisão CDP no bundle: 2 reels tocando a 1280×720, pausa zerando animações e vídeos, retomada reiniciando ambos, caminho reduzido estático com opt-in funcional, 25,4% de pixels alterados em 1,3 s na faixa de vídeos, sem overflow e 0 erros de console | Consultar o commit desta revisão |
| 01/11/2026 | Act V: redesign gaming vibrante com tema híbrido | Landing clara `#f7f3ff` com roxo saturado, cards brancos e sombras duras; telas de produto escuras `#07040f`; cabeçalho fixo com linha de gradiente animada; herói com “stream card” 16:9 escuro (vídeo de marca, selo `LIVE`, alerta simulado e deck carteira→blockchain→OBS) no lugar do filme, canvas, chuva de código e scanlines; faixas escuras no interlúdio, OBS, preços, fechamento e rodapé. Camada escopada em `.matrix-landing.gaming`, com `gaming-system.css` global para os componentes de produto. TypeScript, lint, 6 testes de idiomas e build (14 páginas) aprovados; revisão CDP em 1440×900 e 390×844 sem overflow, 0 erros de console, modo reduzido estático com opt-in funcional e login revalidado | Consultar o commit desta revisão |
| 02/11/2026 | Act VII: movimento obrigatório, trilho no hover e lapidação | Removidos todos os controles de pausa/opt-in (`MotionToggle`, `MotionHint`, botão do `SiteMotion`, pausa do `BlockchainScene`); `useMotionPreference` sempre ligado, script de pré-hidratação sempre `data-site-motion="on"` e blocos CSS de `prefers-reduced-motion` que suprimiam animação deletados. Trilho desktop abre no hover/foco e recolhe ao sair, sem botão; gaveta mobile mantém foco preso, fundo `inert`, Escape e retorno de foco. Passe de alinhamento: gutter mobile 5,5%, microtexto ≥0,5–0,6 rem, marcador de seção ativa e labels i18n (`obsStudio`, `faq`, `brandHome`). TypeScript, ESLint e 6 testes de idiomas aprovados; build e revisão CDP registrados abaixo | Consultar o commit desta revisão |

Na tentativa de 07/10, o `.bat --full --no-browser --check` parou antes de iniciar API/frontend: apenas 233 MB de RAM disponíveis. Os contêineres ficaram ligados; as portas 3000/8080 continuaram livres. Próxima ação operacional: liberar memória e repetir o launcher, então validar as páginas. Esta execução não colocou o site no ar.

Em 30/10, a máquina reportou 8 GiB instalados e cerca de 1,0–1,1 GB livres; o preflight parou em 976 MB contra o requisito de 1024 MB. O trabalho visual foi revisado com `next dev --webpack` iniciado diretamente e backend em `DEV_MEMORY_MODE=true`. Isso contorna o launcher e não conta como validação do `.bat`. O Docker Desktop estava parado, então a suíte com PostgreSQL não foi repetida.

Relatório detalhado: [BACKEND_REVIEW.md](BACKEND_REVIEW.md). Passos para o responsável testar a interface, configurações, carteira e OBS: [COMO_TESTAR.md](COMO_TESTAR.md). O relatório também registra os pontos que ainda não foram resolvidos ou homologados.

A camada cinematográfica passou revisão visual em Chromium headless contra o servidor de desenvolvimento em 30/10. O build de produção, a jornada real com extensão de carteira e a renderização no OBS continuam pendentes; a suíte PostgreSQL foi validada em 07/10. Os resultados visuais antigos não aprovam o design atual. Foi corrigida a comparação de genesis hash Solana usando os valores completos retornados pelos RPCs públicos, com dois testes de regressão.

Em 31/10, o Act II levou o movimento para login, Creator Studio e checkout usando o mesmo contrato de preferência da landing. A revisão CDP do bundle de produção confirmou tilt 3D no herói, trilha de capítulos estável, revelações de painéis montados após a API, divisão real de taxa e linha do tempo ociosa no checkout, fallback de hidratação e modo reduzido estático com opt-in explícito. A jornada real de carteira, a renderização no OBS e a matriz completa de aceitação continuam pendentes.

Em 01/11, o Act III refinou a mesma linguagem sem criar uma segunda camada de movimento: o herói ganhou chips de protocolo e um deck de três nós; os capítulos passaram a compartilhar uma espinha de progresso; o Creator Studio ganhou navegação com scroll-spy, skeletons de carregamento, gráfico de 14 dias, meta em anel e o checkout recebeu valores rápidos. O gráfico usa as mesmas transações confirmadas do histórico e permanece `aria-hidden`, porque a tabela continua sendo a fonte acessível. A revisão CDP confirmou os estados reais (0,333 de progresso, 14 buckets, 6 com dados, elo ativo mudando para `#studio-ledger`, valor rápido alterando a taxa), ausência de overflow em 1440×900 e 390×844, modo reduzido estático e 0 erros de console. Continua sendo uma revisão visual e de interação, não uma aceitação de pagamentos ou OBS.

O Act IV, ainda em 01/11, atacou um problema de percepção: a página já animava, mas o movimento era discreto e o único interruptor ficava flutuando no canto. O filme do herói subiu para 0,38 de opacidade com deriva lenta; uma nova faixa “em movimento” passa os dois vídeos de marca em loop, com posters reais extraídos dos próprios clipes e selo que diz `AUTO LOOP` ou `PAUSED` conforme o estado; o interruptor foi para o cabeçalho; e quem usa movimento reduzido no sistema recebe um aviso explícito no herói com botão de ativação. A revisão CDP mediu 25,4% de pixels alterados em 1,3 s na faixa de vídeos, confirmou pausa/retomada persistida, o caminho reduzido estático com opt-in funcional, ausência de overflow e 0 erros de console. Nada disso altera a regra de acessibilidade: o movimento continua desligado por padrão para quem pede menos movimento.

Os próximos marcos devem atualizar este histórico e `STATUS.md`, com resultados reais de teste e referência aos commits. As porcentagens discutidas anteriormente eram estimativas de planejamento, não medição de prontidão financeira.

O Act V, também em 01/11, trocou a direção visual depois que o responsável rejeitou o visual escuro e pediu **gaming vibrante (Twitch/Kick), tema híbrido e a paleta da logo preservada**. A landing passou para uma superfície clara com roxo saturado, títulos em tinta e cards brancos com sombra dura; login, Creator Studio, checkout e overlay continuam escuros. As duas superfícies compartilham os mesmos tokens (violeta `#6d3bff`, ciano `#00c2ff`, verde `#00e57d`, rosa `#ff2e93`), e em fundo claro verde e ciano nunca carregam texto. O herói perdeu filme de fundo, canvas, chuva de código e scanlines: o vídeo da marca agora vive dentro de um “stream card” 16:9 escuro com selo `LIVE`, alerta de doação simulado e o deck carteira→blockchain→OBS, sempre rotulado como prévia. Tudo está escopado em `.matrix-landing.gaming` e o sistema global ficou em `gaming-system.css`, então a direção anterior continua no histórico e a reversão é simples. A revisão CDP do bundle confirmou 1440×900 e 390×844 sem overflow, 0 erros de console, modo reduzido estático (`motion=off`, zero animações, sem `src` no vídeo, poster real) com opt-in funcional, e o login revalidado com fundo `rgb(7,4,15)` e botão primário verde→ciano. Continua sendo revisão visual: carteira real, OBS, testnet e audit seguem pendentes.

Em 02/11, o Act VII respondeu a uma revisão do responsável sobre a prévia em execução. **Animação passa a ser regra:** sumiram o interruptor do trilho, o aviso de movimento reduzido, o botão flutuante do shell e a pausa da cena blockchain; o contrato agora retorna `enabled: true`, o script inline sempre marca `data-site-motion="on"` e os blocos CSS de `prefers-reduced-motion` que desligavam movimento foram removidos. **O trilho desktop retrata no mouse:** entra no hover ou no foco de teclado, empurra o conteúdo de 116 px para 300 px e recolhe para 84 px quando o ponteiro sai, sem botão; a gaveta mobile continua explícita, com foco preso, fundo `inert`, Escape e retorno do foco ao hambúrguer. **Lapidação:** o topo mobile passou a usar o mesmo gutter de 5,5% do herói, microtextos subiram para uma faixa legível (0,5–0,6 rem), o trilho ganhou marcador de seção ativa por scroll spy e os rótulos `OBS Studio`, `FAQ` e `Live Crypto · Home` foram traduzidos. O trade-off é assumido: quem pede menos movimento no sistema não tem mais como pausar a experiência. Carteira real, OBS, testnet e auditoria continuam pendentes.
