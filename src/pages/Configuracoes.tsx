import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Settings, Folder, FolderOpen, ExternalLink, Download,
  UploadCloud, RefreshCw, Clock, CheckCircle, AlertCircle,
  HardDrive, Shield, ToggleLeft, ToggleRight, ArrowDownCircle, GitBranch,
} from 'lucide-react';
import {
  getDataPath, getErpRoot, chooseDataDir, isElectron, openInExplorer,
  createBackup, createBackupAuto, listBackups, restoreBackup,
  chooseRestoreFile, openBackupsFolder, getAutoBackup, setAutoBackup,
  type BackupInfo,
} from '../lib/storage';
import { useStore } from '../store/useStore';

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(ms: number) {
  return new Date(ms).toLocaleString('pt-BR');
}

// ── Storage section ───────────────────────────────────────────────────────────
function StorageSection() {
  const { updateConfiguracao } = useStore();
  const [dataPath, setDataPath] = useState('Carregando...');
  const [erpRoot, setErpRoot] = useState('');

  useEffect(() => {
    getDataPath().then(setDataPath);
    getErpRoot().then(setErpRoot);
  }, []);

  const handleChooseDir = async () => {
    const newRoot = await chooseDataDir();
    if (newRoot) {
      setErpRoot(newRoot);
      const newDb = newRoot + '/database/sistema.json';
      setDataPath(newDb);
      updateConfiguracao({ dataPath: newRoot });
    }
  };

  const folderTree = [
    { label: 'database/', desc: 'Banco de dados (sistema.json)', icon: '🗄️' },
    { label: 'backups/', desc: 'Cópias de segurança automáticas e manuais', icon: '💾' },
    { label: 'arquivos/imagens_produtos/', desc: 'Fotos de produtos e modelos', icon: '🖼️' },
    { label: 'arquivos/documentos/', desc: 'PDFs e documentos', icon: '📄' },
    { label: 'configuracoes/', desc: 'Arquivos de configuração', icon: '⚙️' },
  ];

  return (
    <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-5">
      <div className="flex items-center gap-2 text-slate-700 font-semibold text-base">
        <HardDrive size={18} className="text-blue-600" />
        Local de Armazenamento dos Dados
      </div>

      {!isElectron() ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
          <p className="font-semibold mb-1">Modo navegador / servidor web</p>
          <p>Os dados estão sendo salvos no servidor local. Para configurar o local de salvamento e usar backups, instale o aplicativo desktop (.exe).</p>
          <div className="mt-3 bg-slate-50 rounded p-2">
            <p className="text-xs text-slate-500 mb-1">Arquivo atual</p>
            <p className="font-mono text-xs text-slate-700 break-all">{dataPath}</p>
          </div>
        </div>
      ) : (
        <>
          {/* Current paths */}
          <div className="space-y-2">
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-xs text-slate-400 mb-1">Pasta raiz dos dados</p>
              <p className="text-sm font-mono text-slate-700 break-all">{erpRoot || '—'}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-xs text-slate-400 mb-1">Banco de dados</p>
              <p className="text-sm font-mono text-slate-700 break-all">{dataPath}</p>
            </div>
          </div>

          {/* Folder structure */}
          <div>
            <p className="text-xs font-medium text-slate-500 mb-2">Estrutura de pastas criada automaticamente:</p>
            <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
              {folderTree.map(f => (
                <div key={f.label} className="flex items-center gap-3 px-3 py-2">
                  <span className="text-base w-5 text-center">{f.icon}</span>
                  <span className="font-mono text-xs text-blue-700 w-52 shrink-0">{f.label}</span>
                  <span className="text-xs text-slate-500">{f.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleChooseDir}
              className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <FolderOpen size={15} /> Alterar pasta de dados
            </button>
            <button
              onClick={() => erpRoot && openInExplorer(erpRoot)}
              className="flex items-center gap-1.5 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              <ExternalLink size={15} /> Abrir pasta
            </button>
          </div>
          <p className="text-xs text-slate-400">
            Ao alterar a pasta, os dados existentes são copiados automaticamente para o novo local.
            O aplicativo e os dados ficam em pastas separadas — ao atualizar o programa, os dados permanecem intactos.
          </p>
        </>
      )}
    </section>
  );
}

// ── Backup section ────────────────────────────────────────────────────────────
function BackupSection() {
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [autoBackup, setAutoBackupState] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const showMsg = (type: 'ok' | 'err', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const refreshBackups = useCallback(async () => {
    const list = await listBackups();
    setBackups(list);
  }, []);

  useEffect(() => {
    if (!isElectron()) return;
    refreshBackups();
    getAutoBackup().then(setAutoBackupState);
  }, [refreshBackups]);

  const handleCreateBackup = async () => {
    setLoading(true);
    const result = await createBackup();
    setLoading(false);
    if (result.ok) {
      showMsg('ok', `Backup salvo com sucesso!`);
      refreshBackups();
    } else {
      showMsg('err', result.error || 'Erro ao criar backup.');
    }
  };

  const handleCreateBackupAuto = async () => {
    setLoading(true);
    const result = await createBackupAuto();
    setLoading(false);
    if (result.ok) {
      showMsg('ok', `Backup criado: ${result.filename}`);
      refreshBackups();
    } else {
      showMsg('err', result.error || 'Erro ao criar backup.');
    }
  };

  const handleRestore = async (filename: string) => {
    const result = await restoreBackup(filename);
    if (result.ok) {
      showMsg('ok', 'Backup restaurado! Recarregando...');
      setTimeout(() => window.location.reload(), 1500);
    } else if (result.error && result.error !== 'Cancelado.') {
      showMsg('err', result.error);
    }
  };

  const handleRestoreFromFile = async () => {
    const file = await chooseRestoreFile();
    if (!file) return;
    const result = await restoreBackup(file);
    if (result.ok) {
      showMsg('ok', 'Backup restaurado! Recarregando...');
      setTimeout(() => window.location.reload(), 1500);
    } else if (result.error && result.error !== 'Cancelado.') {
      showMsg('err', result.error);
    }
  };

  const handleToggleAutoBackup = async () => {
    const newVal = !autoBackup;
    await setAutoBackup(newVal);
    setAutoBackupState(newVal);
    showMsg('ok', newVal ? 'Backup automático ativado.' : 'Backup automático desativado.');
  };

  if (!isElectron()) {
    return (
      <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-2 text-slate-700 font-semibold text-base mb-3">
          <Download size={18} className="text-green-600" /> Backup
        </div>
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
          Backup manual disponível apenas no aplicativo desktop.
          No modo servidor, faça cópias da pasta de dados manualmente.
        </p>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-5">
      <div className="flex items-center gap-2 text-slate-700 font-semibold text-base">
        <Download size={18} className="text-green-600" /> Backup e Restauração
      </div>

      {/* Status message */}
      {msg && (
        <div className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm ${
          msg.type === 'ok'
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {msg.type === 'ok' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          {msg.text}
        </div>
      )}

      {/* Auto-backup toggle */}
      <div className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3">
        <div>
          <p className="text-sm font-medium text-slate-700">Backup automático diário</p>
          <p className="text-xs text-slate-400 mt-0.5">Cria um backup ao abrir o programa (uma vez por dia)</p>
        </div>
        <button onClick={handleToggleAutoBackup} className="transition-colors">
          {autoBackup
            ? <ToggleRight size={32} className="text-blue-600" />
            : <ToggleLeft size={32} className="text-slate-400" />}
        </button>
      </div>

      {/* Create backup buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleCreateBackup}
          disabled={loading}
          className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {loading ? <RefreshCw size={15} className="animate-spin" /> : <Download size={15} />}
          Criar Backup Agora
        </button>
        <button
          onClick={handleCreateBackupAuto}
          disabled={loading}
          className="flex items-center gap-1.5 bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors disabled:opacity-50"
        >
          <Clock size={15} /> Salvar na pasta de backups
        </button>
        <button
          onClick={openBackupsFolder}
          className="flex items-center gap-1.5 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
        >
          <Folder size={15} /> Abrir pasta de backups
        </button>
      </div>

      {/* Backup list */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-slate-700">Backups disponíveis</p>
          <button onClick={refreshBackups} className="text-slate-400 hover:text-slate-600 transition-colors">
            <RefreshCw size={14} />
          </button>
        </div>

        {backups.length === 0 ? (
          <div className="text-center py-6 text-sm text-slate-400 border border-dashed border-slate-200 rounded-lg">
            Nenhum backup encontrado. Crie o primeiro backup acima.
          </div>
        ) : (
          <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-64 overflow-y-auto">
            {backups.map(b => (
              <div key={b.filename} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{b.filename}</p>
                  <p className="text-xs text-slate-400">{formatDate(b.mtime)} · {formatBytes(b.size)}</p>
                </div>
                <button
                  onClick={() => handleRestore(b.filename)}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors shrink-0"
                >
                  <UploadCloud size={13} /> Restaurar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Restore from external file */}
      <div className="border-t border-slate-100 pt-4">
        <p className="text-xs font-medium text-slate-500 mb-2">Restaurar de outro arquivo</p>
        <button
          onClick={handleRestoreFromFile}
          className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-orange-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-100 transition-colors"
        >
          <UploadCloud size={15} /> Selecionar arquivo de backup...
        </button>
        <p className="text-xs text-slate-400 mt-2">
          Use esta opção para restaurar um backup de outro computador ou de uma pasta diferente.
        </p>
      </div>
    </section>
  );
}

// ── Update section ────────────────────────────────────────────────────────────
type UpdateInfo = {
  hasUpdate: boolean;
  branch: string;
  currentVersion: string;
  latestVersion: string;
  behind: number;
  lastCommitMsg: string;
  lastCommitDate: string;
};

function UpdateSection() {
  const [checking, setChecking] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [info, setInfo] = useState<UpdateInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const checkForUpdates = async () => {
    setChecking(true);
    setError(null);
    setInfo(null);
    setDone(false);
    setLogs([]);
    try {
      const r = await fetch('/api/update/check');
      const data = await r.json();
      if (!data.ok) throw new Error(data.error);
      setInfo(data as UpdateInfo);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao verificar atualizações.');
    } finally {
      setChecking(false);
    }
  };

  const applyUpdate = () => {
    setUpdating(true);
    setLogs([]);
    setDone(false);
    setError(null);

    const es = new EventSource('/api/update/apply');

    es.onmessage = (e) => {
      const msg: string = JSON.parse(e.data);
      if (msg === '__DONE__') {
        es.close();
        setDone(true);
        setUpdating(false);
        setTimeout(() => window.location.reload(), 3000);
      } else if (msg === '__ERROR__') {
        es.close();
        setUpdating(false);
      } else {
        setLogs(prev => [...prev, msg]);
      }
    };

    es.onerror = () => {
      // After server restarts, the SSE connection will close — that's expected
      es.close();
      if (!done) {
        setUpdating(false);
      }
    };
  };

  const lastDate = info?.lastCommitDate
    ? (() => { try { return new Date(info.lastCommitDate).toLocaleString('pt-BR'); } catch { return info.lastCommitDate; } })()
    : '';

  return (
    <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
      <div className="flex items-center gap-2 text-slate-700 font-semibold text-base">
        <ArrowDownCircle size={18} className="text-blue-600" />
        Atualização do Sistema
      </div>

      <p className="text-sm text-slate-500">
        Verifique e instale a versão mais recente do GitHub sem abrir o VS Code — o sistema baixa o código, compila e reinicia automaticamente.
      </p>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          <span className="break-all">{error}</span>
        </div>
      )}

      {/* Update info card */}
      {info && !done && (
        <div className={`rounded-lg border p-4 space-y-3 ${info.hasUpdate ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'}`}>
          <div className="flex items-center gap-2 text-sm font-semibold">
            {info.hasUpdate
              ? <AlertCircle size={15} className="text-blue-600" />
              : <CheckCircle size={15} className="text-green-600" />}
            <span className={info.hasUpdate ? 'text-blue-800' : 'text-green-800'}>
              {info.hasUpdate
                ? `Nova versão disponível! (${info.behind} commit${info.behind !== 1 ? 's' : ''} atrás)`
                : 'O sistema está atualizado!'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <GitBranch size={11} className="text-slate-400" />
              <span className="font-medium">Branch:</span>
              <span className="font-mono">{info.branch}</span>
            </div>
            <div>
              <span className="font-medium">Versão atual:</span>
              <span className="font-mono ml-1">{info.currentVersion}</span>
            </div>
            <div>
              <span className="font-medium">Última atualização:</span>
              <span className="ml-1">{lastDate}</span>
            </div>
            <div>
              <span className="font-medium">Versão remota:</span>
              <span className="font-mono ml-1">{info.latestVersion}</span>
            </div>
          </div>
          {info.hasUpdate && info.lastCommitMsg && (
            <p className="text-xs text-slate-500 italic border-t border-blue-100 pt-2">
              "{info.lastCommitMsg}"
            </p>
          )}
        </div>
      )}

      {/* Done banner */}
      {done && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm font-medium">
          <CheckCircle size={16} />
          Atualização concluída! O sistema vai recarregar em instantes...
        </div>
      )}

      {/* Progress log */}
      {logs.length > 0 && (
        <div className="bg-slate-900 rounded-lg p-3 font-mono text-xs text-green-400 max-h-52 overflow-y-auto">
          {logs.map((l, i) => <div key={i} className="leading-5">{l}</div>)}
          {updating && (
            <div className="flex items-center gap-1 text-slate-500 mt-1">
              <RefreshCw size={10} className="animate-spin" />
              <span>processando...</span>
            </div>
          )}
          <div ref={logsEndRef} />
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={checkForUpdates}
          disabled={checking || updating}
          className="flex items-center gap-1.5 bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw size={14} className={checking ? 'animate-spin' : ''} />
          {checking ? 'Verificando...' : 'Verificar atualizações'}
        </button>

        {info?.hasUpdate && !done && (
          <button
            onClick={applyUpdate}
            disabled={updating}
            className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updating
              ? <><RefreshCw size={14} className="animate-spin" /> Atualizando...</>
              : <><Download size={14} /> Atualizar agora</>}
          </button>
        )}
      </div>

      <p className="text-xs text-slate-400">
        A atualização não apaga seus dados — apenas o código do aplicativo é substituído.
        O servidor reinicia automaticamente após a compilação (~30 segundos).
      </p>
    </section>
  );
}

// ── Factory info section ──────────────────────────────────────────────────────
function FabricaSection() {
  const { configuracao, updateConfiguracao } = useStore();
  const [form, setForm] = useState({
    nomeFabrica: configuracao.nomeFabrica,
    cnpj: configuracao.cnpj ?? '',
    endereco: configuracao.endereco ?? '',
    telefone: configuracao.telefone ?? '',
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateConfiguracao(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
      <div className="flex items-center gap-2 text-slate-700 font-semibold text-base">
        <Settings size={18} className="text-slate-500" /> Informações da Empresa
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { label: 'Nome da Empresa / Fábrica', key: 'nomeFabrica', placeholder: 'Ex: Fábrica de Bolsas XYZ' },
          { label: 'CNPJ', key: 'cnpj', placeholder: '00.000.000/0000-00' },
          { label: 'Endereço', key: 'endereco', placeholder: 'Rua, número, cidade' },
          { label: 'Telefone', key: 'telefone', placeholder: '(11) 99999-9999' },
        ].map(f => (
          <div key={f.key}>
            <label className="block text-sm font-medium text-slate-700 mb-1">{f.label}</label>
            <input
              type="text"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form[f.key as keyof typeof form]}
              onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        {saved ? <><CheckCircle size={15} /> Salvo!</> : 'Salvar informações'}
      </button>
    </section>
  );
}

// ── Security section ──────────────────────────────────────────────────────────
function SegurancaSection() {
  return (
    <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
      <div className="flex items-center gap-2 text-slate-700 font-semibold text-base">
        <Shield size={18} className="text-purple-600" /> Segurança e Usuários
      </div>
      <p className="text-sm text-slate-500">
        Gerencie os usuários do sistema, perfis de acesso e permissões na aba
        <span className="font-semibold text-slate-700"> Usuários</span>.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { perfil: 'Administrador', desc: 'Acesso total ao sistema', color: 'bg-red-50 border-red-200 text-red-700' },
          { perfil: 'Estoque', desc: 'Entrada, saída e ajuste', color: 'bg-blue-50 border-blue-200 text-blue-700' },
          { perfil: 'Produção', desc: 'Ordens e consumo', color: 'bg-green-50 border-green-200 text-green-700' },
          { perfil: 'Gerência', desc: 'Relatórios e análises', color: 'bg-purple-50 border-purple-200 text-purple-700' },
        ].map(p => (
          <div key={p.perfil} className={`border rounded-lg p-3 ${p.color}`}>
            <p className="text-xs font-semibold">{p.perfil}</p>
            <p className="text-xs opacity-75 mt-0.5">{p.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function Configuracoes() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Configurações</h1>
        <p className="text-sm text-slate-500">Armazenamento, backup e informações da empresa</p>
      </div>

      <UpdateSection />
      <StorageSection />
      <BackupSection />
      <FabricaSection />
      <SegurancaSection />
    </div>
  );
}
