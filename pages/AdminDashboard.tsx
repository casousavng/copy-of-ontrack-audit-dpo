import React, { useMemo, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { db } from '../services/dbAdapter';
import { Store, User, UserRole } from '../types';
import { Download, Upload, Users as UsersIcon, Store as StoreIcon, Settings, PlusCircle, CheckCircle, AlertCircle } from 'lucide-react';
import { Trash2 } from 'lucide-react';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

const useQuery = () => new URLSearchParams(useLocation().search);

export const AdminDashboard: React.FC = () => {
  const query = useQuery();
  const initialTab = query.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState<'overview'|'users'|'stores'|'import'>(
    initialTab === 'users' || initialTab === 'stores' || initialTab === 'import' ? (initialTab as any) : 'overview'
  );

  const [users, setUsers] = useState<User[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [feedback, setFeedback] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      const usersData = await db.getUsers();
      const storesData = await db.getStores();
      setUsers(usersData);
      setStores(storesData);
    };
    loadData();
  }, []);

  const refresh = async () => {
    const usersData = await db.getUsers();
    const storesData = await db.getStores();
    setUsers(usersData);
    setStores(storesData);
  };

  const amonts = useMemo(() => users.filter(u => u.roles.includes(UserRole.AMONT)), [users]);
  const dots = useMemo(() => users.filter(u => u.roles.includes(UserRole.DOT)), [users]);
  const aderentes = useMemo(() => users.filter(u => u.roles.includes(UserRole.ADERENTE)), [users]);

  // --- Create forms state ---
  const [amontForm, setAmontForm] = useState({ email: '', fullname: '' });
  const [dotForm, setDotForm] = useState({ email: '', fullname: '', amontId: '' as string });
  const [aderenteForm, setAderenteForm] = useState({ email: '', fullname: '', storeId: '' as string });
  const [storeForm, setStoreForm] = useState({ codehex: '', brand: 'Intermarché', size: 'Super', city: '', gpslat: '', gpslong: '', dotUserId: '' as string, aderenteId: '' as string });

  const clearFeedback = () => { setFeedback(''); setErrorMsg(''); };

  const handleCreateAmont = async () => {
    clearFeedback();
    try {
      await db.createUser({ email: amontForm.email.trim(), fullname: amontForm.fullname.trim(), roles: [UserRole.AMONT] });
      setAmontForm({ email: '', fullname: '' });
      setFeedback('AMONT criado com sucesso');
      await refresh();
    } catch (e: any) {
      setErrorMsg(e.message || 'Erro ao criar AMONT');
    }
  };

  const handleCreateDOT = async () => {
    clearFeedback();
    try {
      const amontId = Number(dotForm.amontId);
      if (!amontId) throw new Error('Selecione o supervisor AMONT');
      await db.createUser({ email: dotForm.email.trim(), fullname: dotForm.fullname.trim(), roles: [UserRole.DOT], amontId, assignedStores: [] });
      setDotForm({ email: '', fullname: '', amontId: '' });
      setFeedback('DOT criado com sucesso');
      await refresh();
    } catch (e: any) {
      setErrorMsg(e.message || 'Erro ao criar DOT');
    }
  };

  const handleCreateAderente = async () => {
    clearFeedback();
    try {
      const created = await db.createUser({ email: aderenteForm.email.trim(), fullname: aderenteForm.fullname.trim(), roles: [UserRole.ADERENTE] });
      const storeId = Number(aderenteForm.storeId);
      if (storeId) {
        await db.assignAderenteToStore(storeId, created.id);
      }
      setAderenteForm({ email: '', fullname: '', storeId: '' });
      setFeedback('Aderente criado com sucesso');
      await refresh();
    } catch (e: any) {
      setErrorMsg(e.message || 'Erro ao criar Aderente');
    }
  };

  const handleCreateStore = async () => {
    clearFeedback();
    try {
      const payload: any = {
        codehex: storeForm.codehex.trim(),
        brand: storeForm.brand,
        size: storeForm.size,
        city: storeForm.city.trim(),
        gpslat: Number(storeForm.gpslat) || 0,
        gpslong: Number(storeForm.gpslong) || 0,
      };
      if (storeForm.dotUserId) payload.dotUserId = Number(storeForm.dotUserId);
      if (storeForm.aderenteId) payload.aderenteId = Number(storeForm.aderenteId);
      await db.createStore(payload);
      setStoreForm({ codehex: '', brand: 'Intermarché', size: 'Super', city: '', gpslat: '', gpslong: '', dotUserId: '', aderenteId: '' });
      setFeedback('Loja criada com sucesso');
      await refresh();
    } catch (e: any) {
      setErrorMsg(e.message || 'Erro ao criar Loja');
    }
  };

  // --- Assignments in table ---
  const handleChangeStoreDot = async (storeId: number, dotUserId: number) => {
    clearFeedback();
    try { await db.assignDOTToStore(storeId, dotUserId); setFeedback('DOT atribuído à loja'); await refresh(); } catch (e: any) { setErrorMsg(e.message || 'Erro na atribuição'); }
  };
  const handleChangeStoreAderente = async (storeId: number, aderenteId: number) => {
    clearFeedback();
    try { await db.assignAderenteToStore(storeId, aderenteId); setFeedback('Aderente atribuído à loja'); await refresh(); } catch (e: any) { setErrorMsg(e.message || 'Erro na atribuição'); }
  };

    // --- Delete handlers ---
    const [confirmState, setConfirmState] = useState<{open:boolean; message:string; onConfirm:()=>void}>({open:false, message:'', onConfirm: ()=>{}});

    const openConfirm = (message: string, onConfirm: () => void) => {
      setConfirmState({ open: true, message, onConfirm });
    };
    const closeConfirm = () => setConfirmState(s => ({...s, open:false}));

    const handleDeleteAmont = (userId: number) => {
      openConfirm('Tem certeza que deseja eliminar este AMONT?', async () => {
        clearFeedback();
        try { await db.deleteUser(userId); setFeedback('AMONT eliminado com sucesso'); await refresh(); } catch (e: any) { setErrorMsg(e.message || 'Erro ao eliminar AMONT'); }
      });
    };

    const handleDeleteDOT = (userId: number) => {
      openConfirm('Tem certeza que deseja eliminar este DOT?', async () => {
        clearFeedback();
        try { await db.deleteUser(userId); setFeedback('DOT eliminado com sucesso'); await refresh(); } catch (e: any) { setErrorMsg(e.message || 'Erro ao eliminar DOT'); }
      });
    };

    const handleDeleteAderente = (userId: number) => {
      openConfirm('Tem certeza que deseja eliminar este Aderente?', async () => {
        clearFeedback();
        try { await db.deleteUser(userId); setFeedback('Aderente eliminado com sucesso'); await refresh(); } catch (e: any) { setErrorMsg(e.message || 'Erro ao eliminar Aderente'); }
      });
    };

    const handleDeleteStore = (storeId: number) => {
      openConfirm('Tem certeza que deseja eliminar esta Loja?', async () => {
        clearFeedback();
        try { await db.deleteStore(storeId); setFeedback('Loja eliminada com sucesso'); await refresh(); } catch (e: any) { setErrorMsg(e.message || 'Erro ao eliminar Loja'); }
      });
    };

  // --- CSV Import DOTs & Aderentes ---
  const [dotCsv, setDotCsv] = useState<File | null>(null);
  const [aderenteCsv, setAderenteCsv] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<{created:number;errors:number}|null>(null);
  const [importBusy, setImportBusy] = useState(false);

  const parseCsvText = (text: string) => text.split('\n').filter(l => l.trim());

  const downloadDotTemplate = () => {
    const template = `email;fullname;amont_email\n`+
      `dot1@mousquetaires.com;João Silva;amont1@mousquetaires.com\n`+
      `dot2@mousquetaires.com;Pedro Martins;amont1@mousquetaires.com`;
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template_dots.csv';
    link.click();
  };

  const downloadAderenteTemplate = () => {
    const template = `email;fullname;store_codehex\n`+
      `aderente100@intermarche.pt;Joana Lopes;LOJ018\n`+
      `aderente101@intermarche.pt;Paulo Reis;`;
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template_aderentes.csv';
    link.click();
  };

  const importDOTs = async () => {
    if (!dotCsv) return;
    clearFeedback(); setImportBusy(true); setImportResult(null);
    try {
      const text = await dotCsv.text();
      const lines = parseCsvText(text);
      const rows = lines.slice(1); // skip header
      let created = 0, errors = 0;
      const usersNow = await db.getUsers();
      for (const line of rows) {
        const cols = line.split(';').map(c => c.trim());
        if (cols.length < 3) { errors++; continue; }
        const [email, fullname, amont_email] = cols;
        const amont = usersNow.find(u => u.email === amont_email && u.roles.includes(UserRole.AMONT));
        if (!amont) { errors++; continue; }
        try {
          await db.createUser({ email, fullname, roles: [UserRole.DOT], amontId: amont.id, assignedStores: [] });
          created++;
        } catch { errors++; }
      }
      setImportResult({ created, errors });
      await refresh();
    } finally { setImportBusy(false); }
  };

  const importAderentes = async () => {
    if (!aderenteCsv) return;
    clearFeedback(); setImportBusy(true); setImportResult(null);
    try {
      const text = await aderenteCsv.text();
      const lines = parseCsvText(text);
      const rows = lines.slice(1);
      let created = 0, errors = 0;
      const storesNow = await db.getStores();
      for (const line of rows) {
        const cols = line.split(';').map(c => c.trim());
        if (cols.length < 2) { errors++; continue; }
        const [email, fullname, store_codehex] = cols;
        try {
          const user = await db.createUser({ email, fullname, roles: [UserRole.ADERENTE] });
          if (store_codehex) {
            const store = storesNow.find(s => s.codehex === store_codehex);
            if (store) {
              await db.assignAderenteToStore(store.id, user.id);
            }
          }
          created++;
        } catch { errors++; }
      }
      setImportResult({ created, errors });
      await refresh();
    } finally { setImportBusy(false); }
  };

  const SectionHeader: React.FC<{title:string; icon?: React.ReactNode}> = ({ title, icon }) => (
    <div className="flex items-center gap-2 mb-3"><span>{icon}</span><h3 className="font-semibold text-gray-900">{title}</h3></div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard do Administrador</h1>
          <p className="text-sm text-gray-500">Crie AMONT, DOT, Lojas e Aderentes; e importe CSVs em massa.</p>
        </div>

        <div className="flex gap-2 mb-6">
          <Button variant={activeTab==='overview'?'primary':'outline'} onClick={() => setActiveTab('overview')}>Visão Geral</Button>
          <Button variant={activeTab==='users'?'primary':'outline'} onClick={() => setActiveTab('users')}>Utilizadores</Button>
          <Button variant={activeTab==='stores'?'primary':'outline'} onClick={() => setActiveTab('stores')}>Lojas</Button>
          <Button variant={activeTab==='import'?'primary':'outline'} onClick={() => setActiveTab('import')}>Importar CSV</Button>
        </div>

        {feedback && (
          <div className="bg-green-50 border border-green-200 rounded p-3 mb-4 flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div className="text-green-800 text-sm">{feedback}</div>
          </div>
        )}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div className="text-red-800 text-sm">{errorMsg}</div>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded shadow p-4">
              <SectionHeader title="AMONT" icon={<UsersIcon className="w-4 h-4" />} />
              <div className="text-3xl font-bold">{amonts.length}</div>
              <div className="text-sm text-gray-500">Supervisores</div>
            </div>
            <div className="bg-white rounded shadow p-4">
              <SectionHeader title="DOTs" icon={<UsersIcon className="w-4 h-4" />} />
              <div className="text-3xl font-bold">{dots.length}</div>
              <div className="text-sm text-gray-500">Auditores</div>
            </div>
            <div className="bg-white rounded shadow p-4">
              <SectionHeader title="Lojas" icon={<StoreIcon className="w-4 h-4" />} />
              <div className="text-3xl font-bold">{stores.length}</div>
              <div className="text-sm text-gray-500">Ativas no sistema</div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded shadow p-4">
              <SectionHeader title="Criar AMONT" icon={<PlusCircle className="w-4 h-4" />} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input label="Email" value={amontForm.email} onChange={e=>setAmontForm({...amontForm,email:e.target.value})} />
                <Input label="Nome" value={amontForm.fullname} onChange={e=>setAmontForm({...amontForm,fullname:e.target.value})} />
              </div>
              <div className="mt-3"><Button onClick={handleCreateAmont}>Criar AMONT</Button></div>
              <div className="mt-4">
                <h4 className="text-sm font-semibold mb-2">AMONT existentes</h4>
                  <ul className="text-sm text-gray-700 space-y-2 max-h-40 overflow-auto">
                    {amonts.map(a => (
                      <li key={a.id} className="flex items-center justify-between">
                        <span>{a.fullname} — {a.email}</span>
                        <button onClick={() => handleDeleteAmont(a.id)} className="text-red-600 hover:text-red-800 ml-2" title="Eliminar">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                </ul>
              </div>
            </div>

            <div className="bg-white rounded shadow p-4">
              <SectionHeader title="Criar DOT" icon={<PlusCircle className="w-4 h-4" />} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input label="Email" value={dotForm.email} onChange={e=>setDotForm({...dotForm,email:e.target.value})} />
                <Input label="Nome" value={dotForm.fullname} onChange={e=>setDotForm({...dotForm,fullname:e.target.value})} />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supervisor AMONT</label>
                  <select className="w-full border rounded px-3 py-2 text-sm" value={dotForm.amontId} onChange={e=>setDotForm({...dotForm,amontId:e.target.value})}>
                    <option value="">Selecione</option>
                    {amonts.map(a => (<option key={a.id} value={a.id}>{a.fullname}</option>))}
                  </select>
                </div>
              </div>
              <div className="mt-3"><Button onClick={handleCreateDOT}>Criar DOT</Button></div>
              <div className="mt-4">
                <h4 className="text-sm font-semibold mb-2">DOT existentes</h4>
                  <ul className="text-sm text-gray-700 space-y-2 max-h-40 overflow-auto">
                  {dots.map(d => {
                    const am = amonts.find(a=>a.id===d.amontId);
                      return (
                        <li key={d.id} className="flex items-center justify-between">
                          <span>{d.fullname} — {d.email} {am?`(AMONT: ${am.fullname})`:''}</span>
                          <button onClick={() => handleDeleteDOT(d.id)} className="text-red-600 hover:text-red-800 ml-2" title="Eliminar">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </li>
                      );
                  })}
                </ul>
              </div>
            </div>

            <div className="bg-white rounded shadow p-4 lg:col-span-2">
              <SectionHeader title="Criar Aderente" icon={<PlusCircle className="w-4 h-4" />} />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Input label="Email" value={aderenteForm.email} onChange={e=>setAderenteForm({...aderenteForm,email:e.target.value})} />
                <Input label="Nome" value={aderenteForm.fullname} onChange={e=>setAderenteForm({...aderenteForm,fullname:e.target.value})} />
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vincular à Loja (opcional)</label>
                  <select className="w-full border rounded px-3 py-2 text-sm" value={aderenteForm.storeId} onChange={e=>setAderenteForm({...aderenteForm,storeId:e.target.value})}>
                    <option value="">Sem vínculo</option>
                    {stores.map(s => (<option key={s.id} value={s.id}>{s.codehex} — {s.city}</option>))}
                  </select>
                </div>
              </div>
              <div className="mt-3"><Button onClick={handleCreateAderente}>Criar Aderente</Button></div>
              <div className="mt-4">
                <h4 className="text-sm font-semibold mb-2">Aderentes</h4>
                  <ul className="text-sm text-gray-700 space-y-2 max-h-40 overflow-auto">
                  {aderentes.map(a => {
                    const store = stores.find(s=>s.aderenteId===a.id);
                      return (
                        <li key={a.id} className="flex items-center justify-between">
                          <span>{a.fullname} — {a.email} {store?`(Loja: ${store.codehex})`:''}</span>
                          <button onClick={() => handleDeleteAderente(a.id)} className="text-red-600 hover:text-red-800 ml-2" title="Eliminar">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </li>
                      );
                  })}
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stores' && (
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-white rounded shadow p-4">
              <SectionHeader title="Criar Loja" icon={<PlusCircle className="w-4 h-4" />} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input label="Código (codehex)" value={storeForm.codehex} onChange={e=>setStoreForm({...storeForm,codehex:e.target.value})} />
                <Input label="Marca" value={storeForm.brand} onChange={e=>setStoreForm({...storeForm,brand:e.target.value})} />
                <Input label="Tamanho" value={storeForm.size} onChange={e=>setStoreForm({...storeForm,size:e.target.value})} />
                <Input label="Cidade" value={storeForm.city} onChange={e=>setStoreForm({...storeForm,city:e.target.value})} />
                <Input label="GPS Lat" value={storeForm.gpslat} onChange={e=>setStoreForm({...storeForm,gpslat:e.target.value})} />
                <Input label="GPS Long" value={storeForm.gpslong} onChange={e=>setStoreForm({...storeForm,gpslong:e.target.value})} />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">DOT (opcional)</label>
                  <select className="w-full border rounded px-3 py-2 text-sm" value={storeForm.dotUserId} onChange={e=>setStoreForm({...storeForm,dotUserId:e.target.value})}>
                    <option value="">—</option>
                    {dots.map(d => (<option key={d.id} value={d.id}>{d.fullname}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Aderente (opcional)</label>
                  <select className="w-full border rounded px-3 py-2 text-sm" value={storeForm.aderenteId} onChange={e=>setStoreForm({...storeForm,aderenteId:e.target.value})}>
                    <option value="">—</option>
                    {aderentes.map(a => (<option key={a.id} value={a.id}>{a.fullname}</option>))}
                  </select>
                </div>
              </div>
              <div className="mt-3"><Button onClick={handleCreateStore}>Criar Loja</Button></div>
            </div>

            <div className="bg-white rounded shadow p-4">
              <SectionHeader title="Lojas existentes" icon={<StoreIcon className="w-4 h-4" />} />
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Código</th>
                      <th className="px-3 py-2 text-left">Marca</th>
                      <th className="px-3 py-2 text-left">Cidade</th>
                      <th className="px-3 py-2 text-left">DOT</th>
                      <th className="px-3 py-2 text-left">Aderente</th>
                        <th className="px-3 py-2 text-left">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {stores.map(s => {
                      const dot = dots.find(d=>d.id===s.dotUserId);
                      const ad = aderentes.find(a=>a.id===s.aderenteId);
                      return (
                        <tr key={s.id}>
                          <td className="px-3 py-2 whitespace-nowrap">{s.codehex}</td>
                          <td className="px-3 py-2 whitespace-nowrap">{s.brand}</td>
                          <td className="px-3 py-2 whitespace-nowrap">{s.city}</td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <select className="border rounded px-2 py-1 text-sm" value={s.dotUserId || ''} onChange={e=>handleChangeStoreDot(s.id, Number(e.target.value))}>
                              <option value="">—</option>
                              {dots.map(d => (<option key={d.id} value={d.id}>{d.fullname}</option>))}
                            </select>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <select className="border rounded px-2 py-1 text-sm" value={s.aderenteId || ''} onChange={e=>handleChangeStoreAderente(s.id, Number(e.target.value))}>
                              <option value="">—</option>
                              {aderentes.map(a => (<option key={a.id} value={a.id}>{a.fullname}</option>))}
                            </select>
                          </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <button onClick={() => handleDeleteStore(s.id)} className="text-red-600 hover:text-red-800" title="Eliminar loja">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'import' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded shadow p-4">
              <SectionHeader title="Importar DOTs (CSV)" icon={<Upload className="w-4 h-4" />} />
              <p className="text-sm text-gray-600 mb-3">Formato: <code>email;fullname;amont_email</code>. AMONT deve existir.</p>
              <div className="flex items-center gap-3 mb-3">
                <input type="file" accept=".csv" onChange={e=>setDotCsv(e.target.files?.[0]||null)} />
                <Button size="sm" onClick={downloadDotTemplate}><Download className="w-4 h-4 mr-2"/>Template</Button>
              </div>
              <Button onClick={importDOTs} disabled={!dotCsv || importBusy}>Importar DOTs</Button>
            </div>

            <div className="bg-white rounded shadow p-4">
              <SectionHeader title="Importar Aderentes (CSV)" icon={<Upload className="w-4 h-4" />} />
              <p className="text-sm text-gray-600 mb-3">Formato: <code>email;fullname;store_codehex</code> (loja opcional).</p>
              <div className="flex items-center gap-3 mb-3">
                <input type="file" accept=".csv" onChange={e=>setAderenteCsv(e.target.files?.[0]||null)} />
                <Button size="sm" onClick={downloadAderenteTemplate}><Download className="w-4 h-4 mr-2"/>Template</Button>
              </div>
              <Button onClick={importAderentes} disabled={!aderenteCsv || importBusy}>Importar Aderentes</Button>
            </div>

            {importResult && (
              <div className="lg:col-span-2 bg-gray-50 border border-gray-200 rounded p-3">
                <div className="text-sm text-gray-800">Importação concluída: {importResult.created} criados, {importResult.errors} erros.</div>
              </div>
            )}
          </div>
        )}
        <ConfirmDialog
          open={confirmState.open}
          message={confirmState.message}
          onCancel={closeConfirm}
          onConfirm={() => { confirmState.onConfirm(); closeConfirm(); }}
          title="Confirmar eliminação"
          confirmText="Eliminar"
        />
      </main>
    </div>
  );
};
