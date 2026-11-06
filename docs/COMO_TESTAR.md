# Como testar o LiveCrypto — roteiro do responsável

## 1. Preparar o computador

- Use Node.js 24 e npm. Deixe aproximadamente 2 GB de RAM disponíveis para a compilação; confira **Disponível** no Gerenciador de Tarefas, não apenas a RAM total.
- Feche o terminal de uma execução anterior antes de iniciar outra. As portas locais são 3000 e 8080.
- Mantenha o arquivo de paginação do Windows habilitado/gerenciado pelo sistema. O launcher informa falta de memória antes de iniciar quando consegue detectá-la.
- Não é necessário Docker para olhar a prévia. Docker é necessário para testar persistência pelo modo completo.

## 2. Abrir a prévia

Na raiz do repositório, abra `start-dev.bat`. Nesta máquina há também um `.bat` na pasta acima, que encaminha ao launcher versionado.

```powershell
.\start-dev.bat
```

Espere a mensagem `READY`. A primeira compilação pode demorar alguns minutos. O navegador deve abrir em `http://localhost:3000`; mantenha o terminal aberto. `Ctrl+C` encerra os servidores.

**Prévia:** dados temporários, pagamentos desativados. Recarregar a página deve manter os dados da sessão enquanto a API estiver rodando; reiniciar a API pode apagar os dados de demonstração.

## 3. O que mudou no design

| Antes: Afterglow | Agora: Protocol / Matrix |
|---|---|
| Roxo e laranja dominantes | Campanha ciano sobre aço quase preto, com roxo removido |
| Tipografia mais arredondada/editorial | Anton nos títulos, Inter Tight no corpo e JetBrains Mono na telemetria |
| Montagem de blocos vinculada ao scroll, estática em algumas telas | Cena SVG com modos automático/rolagem, repetição e exploração por etapas, sem pausa |
| Movimento reduzido bloqueava ativação | Movimento é regra: não há pausa nem opt-in em nenhuma tela |
| Landing mais isolada das telas internas | Marca e tema compartilhados com login, painel, checkout e overlay |
| Explicações dispersas | Guia do criador, recebimento, segurança e instalação no OBS nas telas |

Essa revisão visual está implementada, mas a homologação em navegador/dispositivos continua pendente. Os testes visuais da versão anterior não aprovam automaticamente o Matrix. Na rodada de backend, a mudança de interface adicional foi o aviso **“salvo, mas sincronização indisponível”**.

## 4. Sequência de teste manual

| Ordem | Ação | O que observar |
|---|---|---|
| 1 | Abra a landing e troque PT/EN/ES | Logo, cores, textos e links consistentes; nenhuma rolagem horizontal indevida |
| 2 | Veja a animação e use repetir/rolagem/range | Blocos e marcador devem se mover; os controles também devem funcionar no celular |
| 3 | Passe o mouse sobre o trilho lateral e depois afaste-o | O trilho abre no hover, empurra o conteúdo e recolhe ao sair; não há botão no desktop |
| 4 | Dispare o alerta da landing | Deve ser claramente uma demonstração; som apenas se você habilitar |
| 5 | Entre no estúdio com carteira de teste | Primeiro conectar, depois assinar o login; não informar seed phrase ou chave privada |
| 6 | Confira o destino cadastrado | Rede e endereço corretos; mensagem de pagamentos desativados continua visível na prévia |
| 7 | Mude tema, posição, meta e leaderboard; salve e recarregue | Valores salvos mantidos; valor zero e opção desmarcada devem persistir |
| 8 | Use os links do guia no painel | Devem levar às seções de conta, destino, OBS e compartilhamento |
| 9 | Copie o link público de doação | Checkout abre no criador correto; a URL privada do OBS não é o link para compartilhar |
| 10 | Teste logout e acesso posterior ao painel | Volta ao login; sessão revogada não autoriza novas operações |
| 11 | Abra a aba **Sui** e entre com a Slush (ou outra carteira Sui) | A carteira aparece na lista; conectar não abre sessão; assine a mensagem e confirme que o endereço exibido é `0x` + 64 hex |
| 12 | Cadastre um endereço Sui em "Carteiras de recebimento" | O endereço é salvo em minúsculas; endereço curto (`0x2`), zero ou tesouraria são recusados; pagamentos Sui continuam desativados |
| 13 | Abra `/{locale}/docs` nos três idiomas | Layout de documentação em três colunas; sumário, âncoras, tabelas e blocos de código funcionam; nenhuma rolagem horizontal; o texto não promete QR, mainnet ou auditoria |
| 14 | Leia as seções "Fluxo da doação" e "QR e mobile" | O fluxo intent → assinatura → verificação → alerta está claro; o QR aparece como planejado e nunca como pagamento implementado |

Use MetaMask/Rabby para a jornada EVM, Phantom/Solflare/Backpack para Solana ou Slush/Sui Wallet para Sui. O login autentica uma conta, não envia uma doação. Não há pareamento móvel por QR implementado; no celular é necessária uma carteira/navegador compatível com o fluxo disponível.

## 5. Instalar no OBS

1. No painel, copie a **URL privada do overlay**.
2. No OBS Studio, abra sua cena. Em **Fontes → + → Navegador**, crie uma fonte chamada LiveCrypto.
3. Cole a URL. Use 1920 × 1080 ou as dimensões da sua composição.
4. Deixe a opção de desligar a fonte quando não estiver visível desmarcada se ela precisar permanecer conectada.
5. No painel, clique em **Testar alerta OBS**. Confira imagem, posição e áudio na prévia do OBS.
6. Não mostre a URL privada em prints ou na transmissão. Um aviso de comando enviado não prova que a fonte exibiu o alerta: confira no OBS.

O teste do painel não registra uma doação financeira. Replay durável de doações reais exige o modo persistente e uma transação testnet validada.

## 6. Testar persistência

Abra Docker Desktop e espere o engine ficar pronto:

```powershell
.\start-dev.bat --full
```

O launcher sobe PostgreSQL/Redis e aplica migrações. Confira `http://localhost:8080/api/health`: deve indicar `ok` e serviços conectados, em vez de `memory-preview`.

Salve um título e presets, encerre com `Ctrl+C`, inicie novamente no modo completo e entre com a mesma carteira. Os valores devem continuar salvos. Não use `docker compose down -v` neste teste: isso apaga os volumes.

## 7. Upload e falhas

- Upload exige `PINATA_JWT` configurado apenas no backend. Sem credencial, a interface deve mostrar falha, nunca sucesso falso.
- Use arquivo de teste pequeno: PNG/JPEG/GIF/WebP/MP4 para mídia; MP3/WAV/Ogg para áudio. Máximo de 5 MB.
- Arquivo acima do limite deve falhar. Renomear um HTML para `.gif` não deve torná-lo uma imagem aceita.
- Após upload válido, confira que tema/título continuam salvos. Credenciais e erros internos do provedor não devem aparecer na resposta.
- Uma indisponibilidade de publicação pode salvar o arquivo/configuração, mas mostrar aviso de sincronização. Reconecte OBS ou salve novamente após recuperação.

Falhas de Redis/logout e provedor já têm regressões automatizadas com falhas injetadas. Não interrompa serviços de produção para reproduzi-las; use um ambiente descartável.

## 8. Pagamentos reais de testnet: próxima etapa

Antes de habilitar pagamentos, precisamos do router EVM, tesouraria e RPC corretos, carteiras com tokens de teste e PostgreSQL/Redis disponíveis. Siga `PRODUCTION_GLOBAL_LAUNCH.md`. Não altere `DONATIONS_ENABLED` para testar a aparência. No Sui, login e cadastro de destino já funcionam, mas o checkout só deve ser habilitado depois de publicar o pacote Move, configurar `SUI_TREASURY_ADDRESS` e `SUI_PACKAGE_ID` e reconciliar uma doação real de testnet; sem o pacote, `capabilities.sui` permanece `false`.

## 9. Como enviar feedback

Envie a tela/idioma, passos para reproduzir, resultado esperado e o erro visível. Para animações, um vídeo curto ajuda. Para falhas de inicialização, envie a última mensagem do terminal. Oculte credenciais, signatures, frases de recuperação e URLs privadas do overlay.
