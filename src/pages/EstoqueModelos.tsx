import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Image } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Modelo, CategoriaModelo, StatusModelo } from '../types';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import ImageUpload from '../components/ImageUpload';

const categorias: { value: CategoriaModelo; label: string }[] = [
  { value: 'mochilas', label: 'Mochilas' },
  { value: 'bolsas', label: 'Bolsas' },
  { value: 'pochetes', label: 'Pochetes' },
  { value: 'necessaires', label: 'Necessaires' },
  { value: 'carteiras', label: 'Carteiras' },
  { value: 'acessorios', label: 'Acessórios' },
];

const statusConfig: Record<StatusModelo, { label: string; variant: 'blue' | 'yellow' | 'green' | 'gray' }> = {
  desenvolvimento: { label: 'Desenvolvimento', variant: 'blue' },
  revisao: { label: 'Revisão', variant: 'yellow' },
  aprovado: { label: 'Aprovado', variant: 'green' },
  finalizado: { label: 'Finalizado', variant: 'gray' },
};

const catVariant: Record<CategoriaModelo, 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray' | 'orange'> = {
  mochilas: 'blue', bolsas: 'purple', pochetes: 'orange',
  necessaires: 'green', carteiras: 'yellow', acessorios: 'gray',
};

const emptyForm = (): Omit<Modelo, 'id' | 'criadoEm' | 'atualizadoEm'> => ({
  nome: '', codigo: '', categoria: 'mochilas', status: 'desenvolvimento',
  descricao: '', observacoes: '', galeria: [],
});

export default function EstoqueModelos() {
  const { modelos, addModelo, updateModelo, deleteModelo, clientes } = useStore();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalAdd, setModalAdd] = useState(false);
  const [modalEdit, setModalEdit] = useState<Modelo | null>(null);
  const [modalView, setModalView] = useState<Modelo | null>(null);
  const [form, setForm] = useState(emptyForm());

  const filtered = modelos.filter(m =>
    (m.nome.toLowerCase().includes(search.toLowerCase()) || m.codigo.toLowerCase().includes(search.toLowerCase())) &&
    (!catFilter || m.categoria === catFilter) &&
    (!statusFilter || m.status === statusFilter)
  );

  const handleAdd = () => {
    addModelo(form);
    setForm(emptyForm());
    setModalAdd(false);
  };

  const handleEdit = () => {
    if (!modalEdit) return;
    updateModelo(modalEdit.id, form);
    setModalEdit(null);
  };

  const openEdit = (m: Modelo) => {
    setForm({ ...m });
    setModalEdit(m);
  };

  const FormModelo = () => (
    <div className="space-y-4">
      <div className="flex gap-4">
        <ImageUpload value={form.fotoPrincipal} onChange={v => setForm(f => ({ ...f, fotoPrincipal: v }))} label="Foto Principal" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nome *</label>
          <input className="input" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Código</label>
          <input className="input" value={form.codigo} onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
          <select className="input" value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value as CategoriaModelo }))}>
            {categorias.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
          <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as StatusModelo }))}>
            {Object.entries(statusConfig).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Cliente</label>
        <select className="input" value={form.clienteId ?? ''} onChange={e => setForm(f => ({ ...f, clienteId: e.target.value || undefined }))}>
          <option value="">Nenhum</option>
          {clientes.map(c => <option key={c.id} value={c.id}>{c.nomeEmpresa}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
        <textarea className="input" rows={2} value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Observações</label>
        <textarea className="input" rows={2} value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} />
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Estoque de Pilotagem</h1>
          <p className="text-sm text-slate-500">{modelos.length} modelos cadastrados</p>
        </div>
        <button onClick={() => { setForm(emptyForm()); setModalAdd(true); }} className="btn-primary">
          <Plus size={16} /> Novo Modelo
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input placeholder="Buscar modelo..." className="input pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-40" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="">Todas categorias</option>
          {categorias.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select className="input w-40" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Todos status</option>
          {Object.entries(statusConfig).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
        </select>
      </div>

      {/* Grid de modelos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(modelo => {
          const cliente = clientes.find(c => c.id === modelo.clienteId);
          return (
            <div key={modelo.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
              {/* Imagem */}
              <div
                className="h-44 bg-slate-100 flex items-center justify-center cursor-pointer"
                onClick={() => setModalView(modelo)}
              >
                {modelo.fotoPrincipal ? (
                  <img src={modelo.fotoPrincipal} alt={modelo.nome} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-slate-300">
                    <Image size={40} />
                    <p className="text-xs mt-1">Sem foto</p>
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{modelo.nome}</p>
                    <p className="text-xs text-slate-400">{modelo.codigo}</p>
                  </div>
                  <Badge label={statusConfig[modelo.status].label} variant={statusConfig[modelo.status].variant} />
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Badge label={categorias.find(c => c.value === modelo.categoria)?.label ?? ''} variant={catVariant[modelo.categoria]} />
                  {cliente && <span className="text-xs text-slate-400">{cliente.nomeEmpresa}</span>}
                </div>
                {modelo.descricao && <p className="text-xs text-slate-500 mt-2 line-clamp-2">{modelo.descricao}</p>}
                <div className="flex items-center gap-1 mt-3 pt-3 border-t border-slate-50">
                  <button onClick={() => setModalView(modelo)} className="flex-1 text-xs text-blue-600 hover:underline">Ver detalhes</button>
                  <button onClick={() => openEdit(modelo)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => deleteModelo(modelo.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16 text-slate-400">
            <Image size={40} className="mx-auto mb-2 opacity-30" />
            <p>Nenhum modelo encontrado</p>
          </div>
        )}
      </div>

      {modalAdd && (
        <Modal title="Novo Modelo" onClose={() => setModalAdd(false)} size="lg">
          <FormModelo />
          <div className="flex justify-end gap-2 mt-5">
            <button onClick={() => setModalAdd(false)} className="btn-ghost">Cancelar</button>
            <button onClick={handleAdd} className="btn-primary" disabled={!form.nome}>Salvar</button>
          </div>
        </Modal>
      )}

      {modalEdit && (
        <Modal title="Editar Modelo" onClose={() => setModalEdit(null)} size="lg">
          <FormModelo />
          <div className="flex justify-end gap-2 mt-5">
            <button onClick={() => setModalEdit(null)} className="btn-ghost">Cancelar</button>
            <button onClick={handleEdit} className="btn-primary">Salvar</button>
          </div>
        </Modal>
      )}

      {modalView && (
        <Modal title={modalView.nome} onClose={() => setModalView(null)} size="lg">
          <div className="space-y-4">
            {modalView.fotoPrincipal && (
              <img src={modalView.fotoPrincipal} alt={modalView.nome} className="w-full h-64 object-cover rounded-lg" />
            )}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-slate-400">Código:</span> <span className="font-medium">{modalView.codigo}</span></div>
              <div><span className="text-slate-400">Status:</span> <Badge label={statusConfig[modalView.status].label} variant={statusConfig[modalView.status].variant} /></div>
              <div><span className="text-slate-400">Categoria:</span> <Badge label={categorias.find(c => c.value === modalView.categoria)?.label ?? ''} variant={catVariant[modalView.categoria]} /></div>
              <div><span className="text-slate-400">Cliente:</span> <span className="font-medium">{clientes.find(c => c.id === modalView.clienteId)?.nomeEmpresa ?? '-'}</span></div>
            </div>
            {modalView.descricao && <div><p className="text-xs text-slate-400 mb-1">Descrição</p><p className="text-sm">{modalView.descricao}</p></div>}
            {modalView.observacoes && <div><p className="text-xs text-slate-400 mb-1">Observações</p><p className="text-sm">{modalView.observacoes}</p></div>}
          </div>
        </Modal>
      )}
    </div>
  );
}
