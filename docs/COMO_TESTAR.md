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
| Roxo e laranja dominantes | Azul, ciano e verde da logo, preservando roxo como apoio |
| Tipografia mais arredondada/editorial | Space Grotesk e JetBrains Mono, detalhes de terminal e painéis geométricos |
| Montagem de blocos vinculada ao scroll, estática em algumas telas | Cena SVG com modos automático/rolagem, pausa, repetição e exploração por etapas |
| Movimento reduzido bloqueava ativação | Preferência respeitada inicialmente; ativação manual explícita disponível |
| Landing mais isolada das telas internas | Marca e tema compartilhados com login, painel e checkout |
| Explicações dispersas | Guia do criador, recebimento, segurança e instalação no OBS nas telas |

Essa revisão visual está implementada, mas a homologação em navegador/dispositivos continua pendente. Os testes visuais da versão anterior não aprovam automaticamente o Matrix. Na rodada de backend, a mudança de interface adicional foi o aviso **“salvo, mas sincronização indisponível”**.

## 4. Sequência de teste manual

| Ordem | Ação | O que observar |
|---|---|---|
| 1 | Abra a landing e troque PT/EN/ES | Logo, cores, textos e links consistentes; nenhuma rolagem horizontal indevida |
| 2 | Veja a animação e use pausa/repetir/rolagem/range | Blocos e marcador devem se mover quando permitido; controles também devem funcionar no celular |
| 3 | Se estiver estática, confira a preferência de movimento e pressione ativar | Não aumentar animação do sistema à força; usar a opção explícita da demonstração |
| 4 | Dispare o alerta da landing | Deve ser claramente uma demonstração; som apenas se você habilitar |
| 5 | Entre no estúdio com carteira de teste | Primeiro conectar, depois assinar o login; não informar seed phrase ou chave privada |
| 6 | Confira o destino cadastrado | Rede e endereço corretos; mensagem de pagamentos desativados continua visível na prévia |
| 7 | Mude tema, posição, meta e leaderboard; salve e recarregue | Valores salvos mantidos; valor zero e opção desmarcada devem persistir |
| 8 | Use os links do guia no painel | Devem levar às seções de conta, destino, OBS e compartilhamento |
| 9 | Copie o link público de doação | Checkout abre no criador correto; a URL privada do OBS não é o link para compartilhar |
| 10 | Teste logout e acesso posterior ao painel | Volta ao login; sessão revogada não autoriza novas operações |

Use MetaMask/Rabby para a jornada EVM ou Phantom para Solana. O login autentica uma conta, não envia uma doação. Não há pareamento móvel por QR implementado; no celular é necessária uma carteira/navegador compatível com o fluxo disponível.

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

Antes de habilitar pagamentos, precisamos do router EVM, tesouraria e RPC corretos, carteiras com tokens de teste e PostgreSQL/Redis disponíveis. Siga `PRODUCTION_GLOBAL_LAUNCH.md`. Não altere `DONATIONS_ENABLED` para testar a aparência.

## 9. Como enviar feedback

Envie a tela/idioma, passos para reproduzir, resultado esperado e o erro visível. Para animações, um vídeo curto ajuda. Para falhas de inicialização, envie a última mensagem do terminal. Oculte credenciais, signatures, frases de recuperação e URLs privadas do overlay.
