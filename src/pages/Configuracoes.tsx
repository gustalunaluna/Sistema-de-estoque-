import { useState, useEffect } from 'react';
import { Settings, Folder, FolderOpen, ExternalLink } from 'lucide-react';
import { getDataPath, chooseDataDir, isElectron, openInExplorer } from '../lib/storage';
import { useStore } from '../store/useStore';

export default function Configuracoes() {
  const { configuracao, updateConfiguracao } = useStore();
  const [dataPath, setDataPath] = useState('Carregando...');
  const [nomeFabrica, setNomeFabrica] = useState(configuracao.nomeFabrica);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getDataPath().then(setDataPath);
  }, []);

  const handleChooseDir = async () => {
    const newPath = await chooseDataDir();
    if (newPath) {
      setDataPath(newPath);
      updateConfiguracao({ dataPath: newPath });
    }
  };

  const handleSaveInfo = () => {
    updateConfiguracao({ nomeFabrica });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Configurações</h1>
        <p className="text-sm text-slate-500">Gerencie as configurações do sistema</p>
      </div>

      {/* Armazenamento */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2 text-slate-700 font-semibold">
          <Folder size={18} />
          <span>Local de Armazenamento</span>
        </div>

        {!isElectron() ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
            <p className="font-semibold mb-1">Modo navegador</p>
            <p>Os dados estão sendo salvos no <strong>localStorage</strong> do navegador. Para salvar em arquivo local, instale o aplicativo desktop.</p>
          </div>
        ) : (
          <>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-xs text-slate-400 mb-1">Arquivo de dados atual</p>
              <p className="text-sm font-mono text-slate-700 break-all">{dataPath}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleChooseDir}
                className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <FolderOpen size={16} /> Alterar local de salvamento
              </button>
              <button
                onClick={() => openInExplorer(dataPath)}
                className="flex items-center gap-1.5 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
              >
                <ExternalLink size={16} /> Abrir pasta
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Ao alterar o local, os dados existentes são copiados automaticamente para a nova pasta.
            </p>
          </>
        )}
      </div>

      {/* Informações da Fábrica */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2 text-slate-700 font-semibold">
          <Settings size={18} />
          <span>Informações da Fábrica</span>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Fábrica</label>
            <input
              type="text"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={nomeFabrica}
              onChange={e => setNomeFabrica(e.target.value)}
              placeholder="Ex: Fábrica de Bolsas XYZ"
            />
          </div>
        </div>
        <button
          onClick={handleSaveInfo}
          className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          {saved ? '✓ Salvo!' : 'Salvar'}
        </button>
      </div>
    </div>
  );
}
