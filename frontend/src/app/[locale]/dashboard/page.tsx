"use client";

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Brand } from '@/components/Brand';
import { CreatorGuide, ObsInstructions, ReceivingGuide, SecurityGuide } from '@/components/CreatorGuide';
import { LanguageSwitcher, useI18n } from '@/i18n/Provider';
import { localePath } from '@/i18n/locale';
import { playSynthesizedSound, SOUND_PRESETS, type SoundPresetId } from '@/services/soundEffects';
import { speakWithNeuralOrFallback, VOICE_PROFILES, type VoiceProfileId } from '@/services/voiceSynthesis';

type Position = 'top-left' | 'top-right' | 'center' | 'bottom-center' | 'bottom-right';
type Theme = 'cyberpunk' | 'matrix' | 'fire' | 'minimal';
type Wallet = { chain_id: string; public_address: string };
type Network = { chainId: string; name: string; currency: string; testnet: boolean; enabled: boolean };
type Settings = {
  min_amount: string; active_theme: Theme; goal_amount: string; goal_current: string; goal_title: string;
  media_url: string | null; audio_url: string | null; position: Position;
  sound_preset: SoundPresetId; voice_profile: VoiceProfileId; show_leaderboard: boolean;
};
type Profile = {
  streamer: { id: number; public_address: string; obs_token: string }; wallets: Wallet[];
  alertConfig: Partial<Settings> | null; paymentConfig: { networks: Network[] };
};
type Transaction = { tx_hash: string; sender_address: string; amount: string; currency: string; status: string; timestamp: string };
type Analytics = { totalTransactions: number; estimatedTotalUSD: string | null };
const positions: Position[] = ['top-left', 'top-right', 'center', 'bottom-center', 'bottom-right'];
const themes: Theme[] = ['cyberpunk', 'matrix', 'fire', 'minimal'];
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="studio-field"><span>{label}</span>{children}</label>;
}

export default function Dashboard() {
  const { locale, messages: { dashboard: d, common: c, guide: g }, path, number, decimal, date } = useI18n();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({ totalTransactions: 0, estimatedTotalUSD: null });
  const [settings, setSettings] = useState<Settings>({ min_amount: '0', active_theme: 'cyberpunk', goal_amount: '100', goal_current: '0', goal_title: d.defaultGoal, media_url: null, audio_url: null, position: 'bottom-center', sound_preset: 'arcade_coin', voice_profile: 'cyber_announcer', show_leaderboard: true });
  const [selectedChain, setSelectedChain] = useState('');
  const [address, setAddress] = useState('');
  const [walletError, setWalletError] = useState('');
  const [busy, setBusy] = useState('');
  const [uploadType, setUploadType] = useState<'media' | 'audio'>('media');
  const [muted, setMuted] = useState(false);
  const [origin, setOrigin] = useState('');

  const request = useCallback(async <T,>(url: string, options: RequestInit = {}): Promise<T> => {
    const headers = new Headers(options.headers);
    const response = await fetch(url, { ...options, headers, credentials: 'same-origin' });
    if (response.status === 401) {
      localStorage.removeItem('jwt');
      router.replace(localePath(locale, '/login'));
      throw new Error(c.session);
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json() as Promise<T>;
  }, [locale, c.session, router]);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const [data, ledger, metrics] = await Promise.all([
          request<Profile>('/api/dashboard', { signal: controller.signal }),
          request<Transaction[]>('/api/dashboard/transactions', { signal: controller.signal }),
          request<Analytics>('/api/dashboard/analytics', { signal: controller.signal }),
        ]);
        if (controller.signal.aborted) return;
        setOrigin(window.location.origin);
        setProfile(data);
        setSettings(previous => ({ ...previous, ...data.alertConfig }));
        setSelectedChain(data.paymentConfig.networks[0]?.chainId || '');
        setTransactions(ledger);
        setAnalytics(metrics);
      } catch (error) {
        if (!controller.signal.aborted) { console.error(error); setError(d.loadError); }
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    return () => controller.abort();
  }, [request, d.loadError]);

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => setSettings(previous => ({ ...previous, [key]: value }));
  async function action(id: string, url: string, body: unknown, success: string) {
    if (busy) return;
    setBusy(id); setError(''); setNotice('');
    try {
      await request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (id === 'mute') setMuted(previous => !previous);
      setNotice(success);
    } catch (error) { console.error(error); setError(c.error); }
    finally { setBusy(''); }
  }
  async function saveWallet(event: React.FormEvent) {
    event.preventDefault();
    if (busy || !selectedChain || !address.trim()) return;
    setBusy('wallet'); setWalletError(''); setNotice('');
    try {
      const result = await request<{ wallet: Wallet }>('/api/dashboard/wallet', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chain_id: selectedChain, public_address: address.trim() }) });
      setProfile(previous => previous && ({ ...previous, wallets: [...previous.wallets.filter(wallet => wallet.chain_id !== result.wallet.chain_id), result.wallet] }));
      setAddress(''); setNotice(d.walletSaved);
    } catch (error) { console.error(error); setWalletError(d.walletError); }
    finally { setBusy(''); }
  }
  async function upload(file?: File) {
    if (!file || busy) return;
    if (file.size > 5 * 1024 * 1024) { setError(d.assetsIntro); return; }
    setBusy('upload'); setNotice(''); setError('');
    try {
      const body = new FormData(); body.append('file', file); body.append('type', uploadType);
      const result = await request<{ url: string }>('/api/dashboard/upload', { method: 'POST', body });
      update(uploadType === 'media' ? 'media_url' : 'audio_url', result.url);
      setNotice(d.uploaded);
    } catch (error) { console.error(error); setError(d.uploadError); }
    finally { setBusy(''); }
  }
  async function copy(value: string) {
    try { await navigator.clipboard.writeText(value); setNotice(c.copied); }
    catch { setError(c.error); }
  }
  const obsUrl = profile ? `${origin}${path(`/overlay/${profile.streamer.obs_token}`)}` : '';
  // Donors choose their own language; OBS stays pinned to the creator's locale.
  const payUrl = profile ? `${origin}/pay/${profile.streamer.id}` : '';
  const currentWallets = profile?.wallets.filter(wallet => profile.paymentConfig.networks.some(network => network.chainId === wallet.chain_id)) || [];
  const canReceive = currentWallets.some(wallet => profile?.paymentConfig.networks.some(network => network.chainId === wallet.chain_id && network.enabled));
  const anyNetworkEnabled = profile?.paymentConfig.networks.some(network => network.enabled);
  const goal = Math.min(100, Math.max(0, Number(settings.goal_current) / (Number(settings.goal_amount) || 1) * 100));
  const currency = (value: number | string) => number(Number(value) || 0, { style: 'currency', currency: 'USD' });

  return <main className="product-shell">
    <header className="product-toolbar"><Brand href={path()} label={`LiveCrypto · ${c.home}`} /><div className="header-actions"><LanguageSwitcher /><button className="brand-button secondary small" disabled={!!busy} onClick={() => { if (busy) return; setBusy('logout'); void request('/api/auth/logout', { method:'POST' }).then(() => { localStorage.removeItem('jwt'); router.replace(path('/login')); }).catch(() => { setError(c.error); setBusy(''); }); }}>{c.logout}</button></div></header>
    <div className="studio-heading" id="studio-account"><div><p className="eyebrow">LIVECRYPTO / COMMAND_CENTER</p><h1>{d.title}</h1><p className="muted">{d.subtitle}</p></div>{profile && <a href={payUrl} target="_blank" rel="noreferrer" className="brand-button secondary">{d.public} ↗</a>}</div>
    {error && <p className="error-notice" role="alert">{error}</p>}
    {notice && <p className="notice" role="status">{notice}</p>}
    {loading && <p className="notice" role="status">{c.loading}</p>}
    {!loading && !profile && <button className="brand-button secondary" onClick={() => window.location.reload()}>{c.retry}</button>}
    {profile && <>
      <nav className="studio-nav" aria-label={d.title}><a href="#studio-setup">{g.openGuide}</a><a href="#studio-wallets">{d.wallets}</a><a href="#studio-obs">OBS Studio</a><a href="#studio-ledger">{d.ledger}</a></nav>
      <p className="notice environment-notice">{!anyNetworkEnabled ? g.environmentOff : canReceive ? g.environmentOn : g.environmentMissing}</p>
      <div id="studio-setup"><CreatorGuide studio walletReady={currentWallets.length > 0} /></div>
      <section className="studio-metrics" aria-label={d.title}>
        <article className="product-panel"><h2>{d.revenue}</h2><strong>{analytics.estimatedTotalUSD == null ? c.unavailable : currency(analytics.estimatedTotalUSD)}</strong><p className="field-hint">{d.estimate}</p></article>
        <article className="product-panel"><h2>{d.donations}</h2><strong>{number(analytics.totalTransactions)}</strong></article>
        <article className="product-panel"><h2>{d.goal}</h2><strong>{number(goal / 100, { style: 'percent', maximumFractionDigits: 0 })}</strong><p className="field-hint">{currency(settings.goal_current)} / {currency(settings.goal_amount)}</p></article>
      </section>
      <section className="product-panel studio-share" id="studio-share"><h2>{g.publicLink}</h2><p className="field-hint">{g.setupSteps[3][2]}</p><label><span className="sr-only">{g.publicLink}</span><input className="glass-input field-control" readOnly dir="ltr" value={payUrl} /></label><div className="button-row"><button className="brand-button primary" onClick={() => void copy(payUrl)}>{c.copy}</button><a className="brand-button secondary" href={payUrl} target="_blank" rel="noreferrer">{d.public} ↗</a></div></section>
      <section className="product-panel studio-controls" id="studio-test"><h2>{d.controls}</h2><div className="button-row">
        <button disabled={!!busy} className="brand-button primary" onClick={() => void action('test', '/api/dashboard/test-alert', { amount: 25, currency: 'SOL', sender: 'LiveCryptoTester.sol', message: d.testMessage }, d.sent)}>{busy === 'test' ? d.sending : d.test}</button>
        <button disabled={!!busy} className="brand-button secondary" onClick={() => void action('skip', '/api/dashboard/skip-alert', {}, d.skipped)}>{d.skip}</button>
        <button disabled={!!busy} aria-pressed={muted} className="brand-button secondary" onClick={() => void action('mute', '/api/dashboard/mute-tts', {}, muted ? d.unmuted : d.muted)}>{muted ? d.muted : d.unmuted}</button>
      </div><p className="field-hint">{g.obsSteps[3]}</p></section>
      <div className="studio-grid">
        <div className="studio-column">
          <section className="product-panel studio-panel" id="studio-obs"><h2>{d.obs}</h2><p className="muted">{d.obsIntro}</p><Field label={d.obsUrl}><input className="glass-input field-control" readOnly dir="ltr" value={obsUrl} /></Field><div className="button-row"><button className="brand-button primary" onClick={() => void copy(obsUrl)}>{d.copyObs}</button><a className="brand-button secondary" href={obsUrl} target="_blank" rel="noreferrer">{c.preview} ↗</a></div><ObsInstructions /><a className="field-hint obs-test-link" href="#studio-test">{d.test} ↑</a></section>
          <section className="product-panel studio-panel" id="studio-wallets"><h2>{d.wallets}</h2><p className="muted">{d.walletsIntro}</p>
            <ul className="wallet-list">{profile.wallets.map(wallet => <li key={wallet.chain_id}><span>{profile.paymentConfig.networks.find(network => network.chainId === wallet.chain_id)?.name || `${wallet.chain_id} · ${d.outside}`}</span><bdi dir="ltr">{wallet.public_address}</bdi><button className="brand-button secondary small" onClick={() => void copy(wallet.public_address)} aria-label={`${c.copy} ${wallet.public_address}`}>{c.copy}</button></li>)}</ul>
            <form onSubmit={event => void saveWallet(event)}>
              <Field label={d.network}><select className="glass-input field-control" value={selectedChain} disabled={!!busy} onChange={event => setSelectedChain(event.target.value)}>{!profile.paymentConfig.networks.length && <option value="">{c.unavailable}</option>}{profile.paymentConfig.networks.map(network => <option key={network.chainId} value={network.chainId}>{network.name} · {network.currency}{network.testnet ? ` · ${c.testnet}` : ''}</option>)}</select></Field>
              <Field label={d.address}><input className="glass-input field-control" dir="ltr" value={address} disabled={!!busy} required placeholder={d.placeholder} onChange={event => setAddress(event.target.value)} /></Field>
              {selectedChain && !profile.paymentConfig.networks.find(network => network.chainId === selectedChain)?.enabled && <p className="field-hint">{d.disabled}</p>}
              {walletError && <p className="error-notice" role="alert">{walletError}</p>}
              <button disabled={!!busy || !selectedChain || !address.trim()} className="brand-button primary full-width" type="submit">{busy === 'wallet' ? c.saving : c.save}</button>
            </form>
          </section>
          <ReceivingGuide />
          <SecurityGuide />
          <section className="product-panel studio-panel"><h2>{d.assets}</h2><p className="muted">{d.assetsIntro}</p><div className="button-row">{(['media', 'audio'] as const).map(type => <button key={type} className={`brand-button ${type === uploadType ? 'primary' : 'secondary'}`} aria-pressed={type === uploadType} disabled={!!busy} onClick={() => setUploadType(type)}>{d[type]}</button>)}</div>
            <Field label={busy === 'upload' ? d.uploading : d.upload}><input type="file" disabled={!!busy} accept={uploadType === 'media' ? 'image/gif,image/png,image/jpeg,image/webp,video/mp4' : 'audio/*'} onChange={event => { void upload(event.target.files?.[0]); event.target.value = ''; }} /></Field>
            <p className="field-hint break-all">{d.currentMedia}: {settings.media_url || d.defaultAsset}</p><p className="field-hint break-all">{d.currentAudio}: {settings.audio_url || d.defaultAsset}</p>
          </section>
        </div>
        <div className="studio-column">
          <section className="product-panel studio-panel"><h2>{d.studio}</h2><p className="muted">{d.studioIntro}</p>
            <div className={`studio-canvas position-${settings.position} visual-${settings.active_theme}`}><small>{d.demo}</small><div className="studio-sample"><strong>alex.sol <span>+25 SOL</span></strong><p>{d.sample}</p></div></div>
            <Field label={d.position}><select className="glass-input field-control" value={settings.position} onChange={event => update('position', event.target.value as Position)}>{positions.map(position => <option key={position} value={position}>{d.positions[position]}</option>)}</select></Field>
            <div className="studio-form-grid"><Field label={d.sound}><select className="glass-input field-control" value={settings.sound_preset} onChange={event => update('sound_preset', event.target.value as SoundPresetId)}>{SOUND_PRESETS.map(preset => <option key={preset.id} value={preset.id}>{d.sounds[preset.id]}</option>)}</select></Field><button className="brand-button secondary" onClick={() => playSynthesizedSound(settings.sound_preset, 0.5)}>{d.listen} ♪</button></div>
            <div className="studio-form-grid"><Field label={d.voice}><select className="glass-input field-control" value={settings.voice_profile} onChange={event => update('voice_profile', event.target.value as VoiceProfileId)}>{VOICE_PROFILES.map(voice => <option key={voice.id} value={voice.id}>{d.voices[voice.id]}</option>)}</select></Field><button className="brand-button secondary" onClick={() => void speakWithNeuralOrFallback(d.voicePreview, settings.voice_profile, 1, locale)}>{d.listen} ▷</button></div>
            <label className="sound-toggle"><input type="checkbox" checked={settings.show_leaderboard} onChange={event => update('show_leaderboard', event.target.checked)} />{d.leaderboard}</label>
            <p className="field-hint">{d.settingsNote}</p>
          </section>
          <section className="product-panel studio-panel"><h2>{d.settings}</h2><form onSubmit={event => { event.preventDefault(); void action('config', '/api/dashboard/config', settings, c.saved); }}>
            <div className="studio-form-grid"><Field label={d.theme}><select className="glass-input field-control" value={settings.active_theme} onChange={event => update('active_theme', event.target.value as Theme)}>{themes.map(theme => <option key={theme} value={theme}>{d.themes[theme]}</option>)}</select></Field><Field label={d.minimum}><input className="glass-input field-control" type="number" min="0" step="any" required value={settings.min_amount} onChange={event => update('min_amount', event.target.value)} /></Field></div>
            <Field label={d.goalTitle}><input className="glass-input field-control" maxLength={255} value={settings.goal_title} onChange={event => update('goal_title', event.target.value)} /></Field>
            <div className="studio-form-grid"><Field label={d.target}><input className="glass-input field-control" type="number" min="0" step="any" required value={settings.goal_amount} onChange={event => update('goal_amount', event.target.value)} /></Field><Field label={d.current}><input className="glass-input field-control" type="number" min="0" step="any" required value={settings.goal_current} onChange={event => update('goal_current', event.target.value)} /></Field></div>
            <button className="brand-button primary full-width" disabled={!!busy} type="submit">{busy === 'config' ? c.saving : d.save}</button>
          </form></section>
          <section className="product-panel studio-panel" id="studio-ledger"><h2>{d.ledger}</h2>{!transactions.length ? <p className="field-hint">{c.empty}</p> : <div className="ledger-scroll"><table className="studio-ledger"><thead><tr>{[d.sender, d.amount, d.status, d.timestamp].map(label => <th key={label}>{label}</th>)}</tr></thead><tbody>{transactions.map(tx => <tr key={tx.tx_hash}><td><bdi dir="ltr">{tx.sender_address}</bdi></td><td>{decimal(tx.amount)} {tx.currency}</td><td>{d.statuses[tx.status as keyof typeof d.statuses] || c.unavailable}</td><td>{date(tx.timestamp)}</td></tr>)}</tbody></table></div>}</section>
        </div>
      </div>
    </>}
  </main>;
}
