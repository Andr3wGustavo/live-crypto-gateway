import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Brand } from '@/components/Brand';
import { DocsCode, DocsFlow, DocsOnThisPage } from '@/components/DocsInteractive';
import { LanguageSwitcher } from '@/i18n/Provider';
import { docs, type DocsBlock } from '@/i18n/docs';
import { dictionaries } from '@/i18n/messages';
import { isLocale, localePath } from '@/i18n/locale';
import styles from './docs.module.css';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const content = docs[locale];
  return {
    title: content.metaTitle,
    description: content.metaDescription,
    alternates: {
      canonical: `/${locale}/docs`,
      languages: { en: '/en/docs', 'pt-BR': '/pt-BR/docs', es: '/es/docs', 'x-default': '/en/docs' },
    },
    openGraph: { title: content.metaTitle, description: content.metaDescription },
  };
}

function NoteIcon({ tone }: { tone: 'info' | 'warn' | 'pending' }) {
  if (tone === 'warn') {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 4 3.5 19h17L12 4Z" /><path d="M12 10v4M12 17h.01" /></svg>;
  }
  if (tone === 'pending') {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" strokeDasharray="3 3" /><path d="M12 7v5l3 2" /></svg>;
  }
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>;
}

function MediaIcon({ aspect }: { aspect: 'video' | 'image' }) {
  return aspect === 'video'
    ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m10 9 5 3-5 3V9Z" /></svg>
    : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="1.5" /><path d="m4 18 5-5 4 4 3-3 4 4" /></svg>;
}

function Block({ block, index, flowLabel }: { block: DocsBlock; index: number; flowLabel: string }) {
  const delay = Math.min(index, 5) * 60;

  if (block.kind === 'body') {
    return <p className={styles.body} data-reveal data-reveal-delay={delay}>{block.text}</p>;
  }

  if (block.kind === 'list') {
    return <ul className={styles.list} data-reveal data-reveal-delay={delay}>
      {block.items.map(item => <li key={item}>{item}</li>)}
    </ul>;
  }

  if (block.kind === 'steps') {
    return <ol className={styles.steps} data-reveal data-reveal-delay={delay}>
      {block.items.map((item, step) => <li key={item.title}>
        <span className={styles.stepNumber} aria-hidden="true">{String(step + 1).padStart(2, '0')}</span>
        <div><strong>{item.title}</strong><p>{item.text}</p></div>
      </li>)}
    </ol>;
  }

  if (block.kind === 'table') {
    return <div className={styles.tableWrap} data-reveal data-reveal-delay={delay}>
      <table>
        <thead><tr>{block.head.map(cell => <th key={cell} scope="col">{cell}</th>)}</tr></thead>
        <tbody>{block.rows.map(row => <tr key={row.join('|')}>{row.map((cell, cellIndex) => cellIndex === 0
          ? <th key={cell} scope="row">{cell}</th>
          : <td key={`${cell}-${cellIndex}`}>{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>;
  }

  if (block.kind === 'flow') {
    return <div data-reveal data-reveal-delay={delay}>
      <DocsFlow items={block.items} ariaLabel={flowLabel} />
    </div>;
  }

  if (block.kind === 'code') {
    return <div data-reveal data-reveal-delay={delay}>
      <DocsCode label={block.label} lines={block.lines} />
    </div>;
  }

  if (block.kind === 'note') {
    return <aside className={`${styles.note} ${styles[block.tone]}`} data-reveal data-reveal-delay={delay}>
      <span className={styles.noteIcon}><NoteIcon tone={block.tone} /></span>
      <div><strong>{block.title}</strong><p>{block.text}</p></div>
    </aside>;
  }

  return <div className={`${styles.media} ${block.aspect === 'video' ? styles.mediaVideo : styles.mediaImage}`} data-reveal data-reveal-delay={delay}>
    <span className={styles.mediaIcon}><MediaIcon aspect={block.aspect} /></span>
    <div>
      <span className={styles.mediaLabel}>{block.label}</span>
      <strong>{block.title}</strong>
      <p>{block.text}</p>
    </div>
  </div>;
}

export default async function DocsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const content = docs[locale];
  const { common: c, home: h } = dictionaries[locale];
  const login = localePath(locale, '/login');
  const byId = new Map(content.sections.map(section => [section.id, section]));

  const nav = <nav aria-label={content.sidebarLabel}>
    {content.groups.map(group => <div className={styles.navGroup} key={group.label}>
      <p className={styles.navGroupLabel}>{group.label}</p>
      <ul>{group.sections.map(id => {
        const section = byId.get(id);
        return section ? <li key={id}><a href={`#${id}`}>{section.nav}</a></li> : null;
      })}</ul>
    </div>)}
  </nav>;

  return <div className={styles.page}>
    <a href="#main" className="skip-link">{h.skip}</a>

    <header className={styles.header}>
      <Brand href={`/${locale}`} label={c.brandHome} />
      <nav className={styles.topNav} aria-label={h.nav}>
        <Link href={`/${locale}`}>{content.back}</Link>
        <span aria-current="page">{content.eyebrow.split(' / ')[1]}</span>
        <Link href={login}>{c.creator}</Link>
      </nav>
      <div className={styles.headerActions}>
        <LanguageSwitcher />
        <Link href={login} className="brand-button primary small">{c.creator}<span aria-hidden="true">↗</span></Link>
      </div>
    </header>

    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <details className={styles.mobileNav}>
          <summary>{content.sidebarLabel}<span aria-hidden="true">+</span></summary>
          {nav}
        </details>
        <div className={styles.desktopNav}>{nav}</div>
      </aside>

      <main id="main" className={styles.main}>
        <article className={styles.article} aria-label={content.articleLabel}>
          <header className={styles.hero} data-reveal>
            <p className={styles.eyebrow}>{content.eyebrow}</p>
            <h1>{content.title}</h1>
            <p className={styles.intro}>{content.intro}</p>
            <div className={styles.meta}>
              <span className={styles.badge}>{content.badge}</span>
              <span>{content.updated}</span>
            </div>
          </header>

          {content.sections.map((section, sectionIndex) => <section
            key={section.id}
            id={section.id}
            className={styles.section}
            aria-labelledby={`${section.id}-title`}
          >
            <header className={styles.sectionHead} data-reveal>
              <span className={styles.sectionIndex} aria-hidden="true">{String(sectionIndex + 1).padStart(2, '0')}</span>
              <div>
                <p className={styles.eyebrow}>{section.eyebrow}</p>
                <h2 id={`${section.id}-title`}>{section.title}</h2>
              </div>
            </header>
            <div className={styles.blocks}>
              {section.blocks.map((block, blockIndex) => <Block key={`${section.id}-${blockIndex}`} block={block} index={blockIndex} flowLabel={content.flowLabel} />)}
            </div>
          </section>)}

          <footer className={styles.articleFooter} data-reveal>
            <div>
              <p className={styles.eyebrow}>{content.eyebrow}</p>
              <h2>{content.footer.title}</h2>
              <p>{content.footer.text}</p>
            </div>
            <Link href={login} className="brand-button primary">{content.footer.cta}<span aria-hidden="true">↗</span></Link>
            <p className={styles.footerNote}>{content.footer.note}</p>
          </footer>
        </article>
      </main>

      <DocsOnThisPage label={content.onThisPage} sections={content.sections.map(section => ({ id: section.id, nav: section.nav }))} />
    </div>

    <footer className={styles.footer}>
      <Brand href={`/${locale}`} label={c.brandHome} />
      <p>{content.badge} · {content.updated}</p>
      <Link href={`/${locale}`}>{content.back} ↗</Link>
    </footer>
  </div>;
}
