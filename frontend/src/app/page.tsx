import Link from 'next/link';
import { CreatorDemo, FeeCalculator } from '@/components/CreatorDemo';

const questions = [
  ['O Live Crypto já está disponível para receber dinheiro?', 'Esta é uma prévia em desenvolvimento. Pagamentos começam desativados. O checkout só libera redes configuradas pelo operador, com uma carteira cadastrada pelo criador. A validação em testnet vem antes do lançamento público.'],
  ['Preciso instalar um plugin no OBS?', 'Não. O overlay usa uma fonte de navegador do OBS. Você copia o link privado do painel, adiciona a fonte e testa o alerta. Mantenha esse link em segredo.'],
  ['O dinheiro fica na plataforma?', 'O fluxo proposto envia os fundos diretamente para a carteira do criador e a taxa para a tesouraria. Você mantém a custódia da sua carteira; contratos e integrações precisam ser validados antes do uso em produção.'],
  ['Quais moedas e formas de pagamento poderei usar?', 'A primeira integração foca moedas nativas de redes EVM selecionadas e SOL. Stablecoins, Sui, Bitcoin/Lightning e meios locais como Pix são expansões planejadas, cada uma com confirmação e custos próprios.'],
  ['Quanto tempo leva para aparecer o alerta?', 'O backend espera as confirmações exigidas pela rede antes de registrar a doação. Depois, publica o alerta para o OBS conectado. A duração varia conforme a blockchain e a infraestrutura; não prometemos liquidação instantânea.'],
  ['Como funcionam as taxas?', 'O modelo inicial proposto é 2% por doação roteada, mais a taxa de rede apresentada pela carteira. O checkout informa o valor da plataforma e o líquido do criador antes da assinatura. Funcionalidades Pro serão avaliadas no beta.']
];

export default function Home() {
  return (
    <div className="marketing-page">
      <a href="#main" className="skip-link">Pular para o conteúdo</a>
      <header className="site-header">
        <Link href="/" className="brand-wordmark" aria-label="Live Crypto, início">LIVE<span>CRYPTO</span><span className="brand-dot" /></Link>
        <nav aria-label="Navegação principal">
          <a href="#experience">Experiência</a><a href="#how-it-works">Como funciona</a><a href="#pricing">Taxas</a>
        </nav>
        <Link href="/login" className="brand-button secondary small">Área do criador <span aria-hidden>↗</span></Link>
      </header>

      <main id="main">
        <section className="hero-section" aria-labelledby="hero-title">
          <div className="hero-orbit" aria-hidden="true"><span /><span /><span /></div>
          <div className="hero-content">
            <p className="eyebrow"><span className="status-light" /> THE NEXT CHAPTER OF LIVE / PRÉVIA</p>
            <h1 id="hero-title">Sua comunidade.<br />Sua live.<br /><span>Seu próximo nível.</span></h1>
            <p className="hero-description">Transforme apoio em momentos que ficam.<br />Doações cripto direto para sua carteira, com a energia<br className="desktop-break" /> da sua comunidade na tela.</p>
            <div className="button-row"><Link href="/login" className="brand-button primary">Explorar como criador <span aria-hidden>↗</span></Link><a href="#experience" className="brand-button secondary">Ver em ação <span aria-hidden>↓</span></a></div>
            <p className="hero-caption">SEM CUSTÓDIA DE SALDO · FEITO PARA TRANSMISSÕES AO VIVO</p>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="art-cross cross-one">+</div><div className="art-cross cross-two">+</div>
            <div className="art-label">CREATOR SIGNAL / 001</div>
            <div className="signal-mark"><span>↗</span></div>
            <div className="hero-alert"><span className="alert-avatar">A</span><div><small>UM NOVO APOIO. UM NOVO MOMENTO.</small><strong>alex.sol <span>+0.1 SOL</span></strong><p>Essa live merece ir mais longe.</p></div></div>
            <span className="art-footnote">CONCEITO VISUAL · DADOS DEMONSTRATIVOS</span>
          </div>
          <div className="hero-bottom"><span>01 / BUILT FOR YOUR NEXT CHAPTER</span><a href="#experience">DESCUBRA A EXPERIÊNCIA ↓</a></div>
        </section>

        <section className="manifesto section-wrap">
          <p className="eyebrow">MENOS DISTÂNCIA. MAIS CONEXÃO.</p>
          <h2>O apoio é da comunidade.<br /><span className="muted">O controle continua seu.</span></h2>
          <div className="principle-grid">
            <article><span className="index-number">01</span><h3>Direto para você.</h3><p>Receba na sua própria carteira. A proposta é simples: um fluxo transparente, sem saldo preso na plataforma.</p></article>
            <article><span className="index-number">02</span><h3>Com a sua identidade.</h3><p>Seu tema, seu som, seu momento. Alertas, mídias e controles para compor a experiência da sua transmissão.</p></article>
            <article><span className="index-number">03</span><h3>Clareza em cada apoio.</h3><p>Rede, taxa e destino visíveis antes de assinar. Confirmação verificada antes de registrar uma doação.</p></article>
          </div>
        </section>

        <section id="experience" className="experience-section section-wrap">
          <div className="section-heading"><div><p className="eyebrow">O APOIO GANHA VIDA</p><h2>Não é só uma doação.<br /><span className="muted">É parte do show.</span></h2></div><p>Experimente um conceito de alerta.<br />Sem conectar carteira. Sem enviar cripto.</p></div>
          <CreatorDemo />
        </section>

        <section id="how-it-works" className="section-wrap workflow-section">
          <div className="section-heading"><div><p className="eyebrow">DA CARTEIRA À SUA TELA</p><h2>Um fluxo.<br />Cada etapa visível.</h2></div><p>A experiência deve ser simples.<br />A confirmação, rigorosa.</p></div>
          <ol className="workflow-grid">
            <li><span>01 / CONFIGURE</span><h3>Seu espaço.</h3><p>Conecte sua carteira, cadastre o destino na rede escolhida e personalize o overlay no painel.</p></li>
            <li><span>02 / COMPARTILHE</span><h3>Seu link.</h3><p>A comunidade acessa seu checkout, revisa a taxa e autoriza a transação na própria carteira.</p></li>
            <li><span>03 / TRANSMITA</span><h3>Seu momento.</h3><p>Depois da confirmação na rede, o sistema registra o apoio e enfileira o alerta para o OBS conectado.</p></li>
          </ol>
        </section>

        <section id="pricing" className="pricing-section section-wrap">
          <div><p className="eyebrow">UM MODELO QUE CRESCE COM VOCÊ</p><h2>Mais do apoio<br /><span className="muted">fica com quem cria.</span></h2><p className="section-copy">Nossa proposta inicial: 2% por doação roteada.<br />Sem confundir taxa da plataforma com taxa da rede.</p><ul className="plain-list"><li>Divisão no próprio fluxo de pagamento</li><li>Valor líquido visível antes da assinatura</li><li>Recursos Pro planejados para a próxima fase</li></ul><p className="field-hint">Modelo proposto para o beta. Condições finais serão publicadas antes do lançamento.</p></div>
          <FeeCalculator />
        </section>

        <section className="network-section section-wrap">
          <p className="eyebrow">MULTICHAIN, COM CRITÉRIO</p><h2>Um mundo de possibilidades.<br /><span className="muted">Uma integração de cada vez.</span></h2>
          <div className="network-grid">
            <article className="product-panel"><span className="network-symbol">Ξ</span><h3>EVM</h3><p>Polygon Amoy e Base Sepolia primeiro. Roteamento nativo com divisão de taxa em contrato.</p><span className="phase-tag">INTEGRAÇÃO / TESTNET</span></article>
            <article className="product-panel"><span className="network-symbol">≋</span><h3>Solana</h3><p>SOL em Devnet. Transferências atômicas para o criador e a tesouraria, verificadas pelo backend.</p><span className="phase-tag">INTEGRAÇÃO / DEVNET</span></article>
            <article className="product-panel future-network"><span className="network-symbol">+</span><h3>O próximo capítulo</h3><p>Stablecoins, Sui, Bitcoin, Lightning e pagamentos locais. Sem anunciar suporte antes de validar.</p><span className="phase-tag">ROADMAP</span></article>
          </div>
        </section>

        <section className="faq-section section-wrap" id="faq"><div><p className="eyebrow">ANTES DE ENTRAR AO VIVO</p><h2>Boas perguntas.<br /><span className="muted">Respostas diretas.</span></h2></div><div className="faq-list">{questions.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden>+</span></summary><p>{answer}</p></details>)}</div></section>

        <section className="closing-section section-wrap"><p className="eyebrow">O PRÓXIMO MOMENTO COMEÇA COM VOCÊ</p><h2>Leve sua live<br /><span>mais longe.</span></h2><Link href="/login" className="brand-button primary">Explorar o Creator Studio ↗</Link><p>Prévia do produto · lançamento público em preparação</p></section>
      </main>

      <footer className="site-footer section-wrap"><Link href="/" className="brand-wordmark">LIVE<span>CRYPTO</span><span className="brand-dot" /></Link><p>Feito para quem cria. Construído com transparência.</p><a href="#faq">Dúvidas e disponibilidade ↗</a></footer>
    </div>
  );
}
