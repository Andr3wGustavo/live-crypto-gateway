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

1. Estilo retrô/Matrix inspirado em blockchain, com identidade própria.
2. Azul, ciano e verde da logo como base, mantendo **roxo como apoio**, conforme feedback do responsável.
3. Referências de apresentação cinematográfica e narrativa por scroll de sites como Rockstar; aplicar o princípio de movimento e ritmo à explicação do produto.
4. Animação blockchain visível em desktop e celular, com reprodução, pausa, exploração por etapas e rolagem.
5. Respeitar movimento reduzido por padrão, permitindo ativação manual explícita.
6. Mesma linguagem visual na landing, login, painel e checkout.
7. Tipografia legível e explicação clara de recebimento, assinatura, rede, taxas e OBS.

## Roadmap com critérios verificáveis

| ID | Prioridade | Entrega | Estado na retomada | Critério de conclusão | Dependência |
|---|---|---|---|---|---|
| R01 | P0 | Registrar e revisar o trabalho acumulado | Organizado em commits; referências no histórico abaixo | Estado fiel documentado; arquivos revisados e commits publicados | Git e acesso ao remoto |
| R02 | P0 | Inicialização local | Implementada; revalidar | API, frontend e páginas abrem pelo `.bat`; encerramento libera portas | Node e memória disponível |
| R03 | P0 | Identidade Matrix compartilhada | Integrada; validação visual/build pendentes | Landing/login/painel/checkout coerentes, responsivos e navegáveis | Revisão visual e build |
| R04 | P0 | Animação blockchain | Implementada; validar | Movimento real, controles, scroll e comportamento reduzido verificados no navegador | Chromium; testes mobile |
| R05 | P0 | Guia do criador | Integrado; validar interação | Login, destino, OBS e link público explicados dentro das telas | R03 |
| R06 | P0 | Banco e migrações | Código e testes existentes | Suíte passa em PostgreSQL; instalação nova e atualização verificadas | Docker ou banco descartável |
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

O responsável optou por continuar sem teste visual diante da memória disponível. Build atual, navegador e PostgreSQL permanecem pendentes, sem reutilizar os resultados visuais antigos como aprovação. Foi corrigida a comparação de genesis hash Solana usando os valores completos retornados pelos RPCs públicos, com dois testes de regressão.

Os próximos marcos devem atualizar este histórico e `STATUS.md`, com resultados reais de teste e referência aos commits. As porcentagens discutidas anteriormente eram estimativas de planejamento, não medição de prontidão financeira.
