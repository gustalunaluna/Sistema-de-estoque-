import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Users, Phone, Mail } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Cliente } from '../types';
import Modal from '../components/Modal';

const emptyForm = (): Omit<Cliente, 'id' | 'criadoEm'> => ({
  nomeEmpresa: '', nomeContato: '', telefone: '', email: '', instagram: '', observacoes: '',
});

export default function Clientes() {
  const { clientes, addCliente, updateCliente, deleteCliente, ordensProducao, modelos } = useStore();
  const [search, setSearch] = useState('');
  const [modalAdd, setModalAdd] = useState(false);
  const [modalEdit, setModalEdit] = useState<Cliente | null>(null);
  const [modalView, setModalView] = useState<Cliente | null>(null);
  const [form, setForm] = useState(emptyForm());

  const filtered = clientes.filter(c =>
    c.nomeEmpresa.toLowerCase().includes(search.toLowerCase()) ||
    c.nomeContato.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => { addCliente(form); setForm(emptyForm()); setModalAdd(false); };
  const handleEdit = () => { if (!modalEdit) return; updateCliente(modalEdit.id, form); setModalEdit(null); };
  const openEdit = (c: Cliente) => { setForm({ ...c }); setModalEdit(c); };

  const ClienteForm = () => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Nome da Empresa *</label>
          <input className="input" value={form.nomeEmpresa} onChange={e => setForm(f => ({ ...f, nomeEmpresa: e.target.value }))} />
        </div>
        <div>
          <label className="label">Nome do Contato</label>
          <input className="input" value={form.nomeContato} onChange={e => setForm(f => ({ ...f, nomeContato: e.target.value }))} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Telefone</label>
          <input className="input" value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} />
        </div>
        <div>
          <label className="label">Email</label>
          <input type="email" className="input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
        </div>
      </div>
      <div>
        <label className="label">Instagram</label>
        <input className="input" placeholder="@" value={form.instagram} onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))} />
      </div>
      <div>
        <label className="label">Observações</label>
        <textarea className="input" rows={3} value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} />
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Clientes</h1>
          <p className="text-sm text-slate-500">{clientes.length} clientes cadastrados</p>
        </div>
        <button onClick={() => { setForm(emptyForm()); setModalAdd(true); }} className="btn-primary">
          <Plus size={16} /> Novo Cliente
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input placeholder="Buscar cliente..." className="input pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(cliente => {
          const ordens = ordensProducao.filter(o => o.clienteId === cliente.id);
          return (
            <div key={cliente.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="font-bold text-blue-600">{cliente.nomeEmpresa[0]}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(cliente)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => deleteCliente(cliente.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <h3 className="font-semibold text-slate-800">{cliente.nomeEmpresa}</h3>
              {cliente.nomeContato && <p className="text-sm text-slate-500">{cliente.nomeContato}</p>}
              <div className="mt-3 space-y-1">
                {cliente.telefone && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Phone size={12} /> {cliente.telefone}
                  </div>
                )}
                {cliente.email && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Mail size={12} /> {cliente.email}
                  </div>
                )}
                {cliente.instagram && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>@</span> {cliente.instagram}
                  </div>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between">
                <span className="text-xs text-slate-400">{ordens.length} ordens de produção</span>
                <button onClick={() => setModalView(cliente)} className="text-xs text-blue-600 hover:underline">Ver histórico</button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16 text-slate-400">
            <Users size={40} className="mx-auto mb-2 opacity-30" />
            <p>Nenhum cliente encontrado</p>
          </div>
        )}
      </div>

      {modalAdd && (
        <Modal title="Novo Cliente" onClose={() => setModalAdd(false)}>
          <ClienteForm />
          <div className="flex justify-end gap-2 mt-5">
            <button onClick={() => setModalAdd(false)} className="btn-ghost">Cancelar</button>
            <button onClick={handleAdd} className="btn-primary" disabled={!form.nomeEmpresa}>Salvar</button>
          </div>
        </Modal>
      )}

      {modalEdit && (
        <Modal title="Editar Cliente" onClose={() => setModalEdit(null)}>
          <ClienteForm />
          <div className="flex justify-end gap-2 mt-5">
            <button onClick={() => setModalEdit(null)} className="btn-ghost">Cancelar</button>
            <button onClick={handleEdit} className="btn-primary">Salvar</button>
          </div>
        </Modal>
      )}

      {modalView && (
        <Modal title={`Histórico — ${modalView.nomeEmpresa}`} onClose={() => setModalView(null)}>
          <div className="space-y-2">
            {ordensProducao.filter(o => o.clienteId === modalView.id).map(o => {
              const modelo = modelos.find(m => m.id === o.modeloId);
              return (
                <div key={o.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{modelo?.nome}</p>
                    <p className="text-xs text-slate-400">Qtd: {o.quantidade}</p>
                  </div>
                  <span className="text-xs text-slate-500 capitalize">{o.status}</span>
                </div>
              );
            })}
            {ordensProducao.filter(o => o.clienteId === modalView.id).length === 0 && (
              <p className="text-center text-slate-400 py-6">Nenhum histórico</p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
