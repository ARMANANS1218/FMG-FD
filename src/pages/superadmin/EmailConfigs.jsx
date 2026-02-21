import { useEffect, useMemo, useState } from 'react';

const apiBase = import.meta.env.VITE_API_BASE || '';
const basePath = '/api/v1/email-ticketing';

async function apiGet(path){
  const res = await fetch(apiBase + basePath + path, { credentials: 'include' });
  if(!res.ok) throw new Error('Request failed');
  return res.json();
}
async function apiSend(path, method, body){
  const res = await fetch(apiBase + basePath + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body)
  });
  if(!res.ok) throw new Error('Request failed');
  return res.json();
}

export default function EmailConfigs(){
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [envInfo, setEnvInfo] = useState(null);
  const [err, setErr] = useState('');
  const [form, setForm] = useState({
    organization: '',
    emailAddress: 'support@bitmaxtest.com',
    imap: { host: 'mail.bitmaxtest.com', port: 993, secure: true, username: 'support@bitmaxtest.com', password: '' },
    smtp: { host: 'mail.bitmaxtest.com', port: 465, secure: true, username: 'support@bitmaxtest.com', password: '', fromName: 'Support' },
    isEnabled: true,
  });

  const load = async ()=>{
    setLoading(true); setErr('');
    try{
      const data = await apiGet('/admin/configs');
      setItems(data.configs || []);
      setEnvInfo(data.env || null);
    }catch(e){ setErr(e.message); }
    setLoading(false);
  };

  useEffect(()=>{ load(); }, []);

  const onCreate = async ()=>{
    setErr('');
    try{
      await apiSend('/admin/configs', 'POST', form);
      await load();
      alert('Config created and listener started (if enabled).');
    }catch(e){ setErr(e.message); }
  };
  const onUpdate = async (id, patch)=>{
    setErr('');
    try{
      await apiSend(`/admin/configs/${id}`, 'PUT', patch);
      await load();
    }catch(e){ setErr(e.message); }
  };
  const onReload = async ()=>{
    setErr('');
    try{
      await apiSend('/admin/reload', 'POST', {});
      await load();
      alert('Reload triggered.');
    }catch(e){ setErr(e.message); }
  };

  const table = useMemo(()=> (
    <div className="overflow-x-auto rounded border border-border">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-surface text-muted-foreground">
            <th className="px-3 py-2 text-left">Org</th>
            <th className="px-3 py-2 text-left">Email</th>
            <th className="px-3 py-2 text-left">IMAP</th>
            <th className="px-3 py-2 text-left">SMTP</th>
            <th className="px-3 py-2 text-left">Enabled</th>
            <th className="px-3 py-2 text-left">Status</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody className="bg-card">
          {items.map(it => (
            <tr key={it._id} className="border-b border-border hover:bg-card-hover transition-colors">
              <td className="px-3 py-2 text-foreground">{it.organization}</td>
              <td className="px-3 py-2 text-foreground">{it.emailAddress}</td>
              <td className="px-3 py-2 text-muted-foreground">{it.imap.host}:{it.imap.port}</td>
              <td className="px-3 py-2 text-muted-foreground">{it.smtp.host}:{it.smtp.port}</td>
              <td className="px-3 py-2">
                <span className={"px-2 py-1 rounded text-xs font-medium " + (it.isEnabled ? 'bg-success text-white' : 'bg-surface text-muted-foreground')}>{it.isEnabled ? 'Enabled' : 'Disabled'}</span>
              </td>
              <td className="px-3 py-2">
                <span className={"px-2 py-1 rounded text-xs font-semibold text-white " + (it.status==='connected' ? 'bg-success' : it.status==='error' ? 'bg-error' : 'bg-surface')}>{it.status}</span>
              </td>
              <td className="px-3 py-2 text-right">
                <button className="px-2 py-1 text-xs rounded bg-primary hover:bg-primary/80 text-white transition" onClick={()=>onUpdate(it._id, { isEnabled: !it.isEnabled })}>
                  {it.isEnabled ? 'Disable' : 'Enable'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ), [items]);

  return (
    <div className="p-6 space-y-6 min-h-screen bg-background text-foreground">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Email Ticketing — Org Mail Configs</h1>
        <div className="space-x-2">
          <button className="px-3 py-2 rounded bg-success hover:bg-success/80 text-white text-sm transition" onClick={onReload}>Reload IMAP Listeners</button>
          <button className="px-3 py-2 rounded bg-surface hover:bg-card-hover text-foreground text-sm transition" onClick={load}>Refresh</button>
        </div>
      </div>
      {envInfo && (
        <div className="p-2 bg-card border border-primary/30 rounded">
          <div className="font-medium mb-1">ENV Listener</div>
          <div className="text-sm text-muted-foreground">{envInfo.emailAddress} — {envInfo.imap?.host}:{envInfo.imap?.port} — <span className="font-semibold">{envInfo.status}</span></div>
        </div>
      )}
      {err && <div className="text-error text-sm">{err}</div>}
      {loading ? <div className="animate-pulse text-sm text-foreground">Loading…</div> : table}

      <div className="border-t border-border pt-6">
        <h2 className="font-semibold mb-4 text-foreground">Create Config</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input className="border p-2 rounded bg-surface border-border text-foreground" placeholder="Organization ObjectId" value={form.organization} onChange={e=>setForm({...form, organization: e.target.value})} />
          <span className="sr-only">Organization ObjectId</span>
          <input className="border p-2 rounded bg-surface border-border text-foreground" placeholder="Email Address" value={form.emailAddress} onChange={e=>setForm({...form, emailAddress: e.target.value})} />
          <input className="border p-2 rounded bg-surface border-border text-foreground" placeholder="IMAP Username" value={form.imap.username} onChange={e=>setForm({...form, imap:{...form.imap, username:e.target.value}})} />
          <input className="border p-2 rounded bg-surface border-border text-foreground" placeholder="IMAP Password" type="password" value={form.imap.password} onChange={e=>setForm({...form, imap:{...form.imap, password:e.target.value}})} />
          <input className="border p-2 rounded bg-surface border-border text-foreground" placeholder="IMAP Host" value={form.imap.host} onChange={e=>setForm({...form, imap:{...form.imap, host:e.target.value}})} />
          <input className="border p-2 rounded bg-surface border-border text-foreground" placeholder="IMAP Port" value={form.imap.port} onChange={e=>setForm({...form, imap:{...form.imap, port:Number(e.target.value)}})} />
          <input className="border p-2 rounded bg-surface border-border text-foreground" placeholder="SMTP Username (optional)" value={form.smtp.username || ''} onChange={e=>setForm({...form, smtp:{...form.smtp, username:e.target.value}})} />
          <input className="border p-2 rounded bg-surface border-border text-foreground" placeholder="SMTP Password (optional)" type="password" value={form.smtp.password || ''} onChange={e=>setForm({...form, smtp:{...form.smtp, password:e.target.value}})} />
          <input className="border p-2 rounded bg-surface border-border text-foreground" placeholder="SMTP Host" value={form.smtp.host} onChange={e=>setForm({...form, smtp:{...form.smtp, host:e.target.value}})} />
          <input className="border p-2 rounded bg-surface border-border text-foreground" placeholder="SMTP Port" value={form.smtp.port} onChange={e=>setForm({...form, smtp:{...form.smtp, port:Number(e.target.value)}})} />
          <input className="border p-2 rounded bg-surface border-border text-foreground" placeholder="From Name" value={form.smtp.fromName || ''} onChange={e=>setForm({...form, smtp:{...form.smtp, fromName:e.target.value}})} />
          <label className="inline-flex items-center gap-2 text-sm text-muted-foreground"><input type="checkbox" checked={form.isEnabled} onChange={e=>setForm({...form, isEnabled: e.target.checked})} /> Enabled</label>
        </div>
        <div className="mt-4">
          <button className="px-5 py-2 rounded bg-primary hover:bg-primary/80 text-white text-sm transition" onClick={onCreate}>Create</button>
        </div>
      </div>
    </div>
  );
}
