import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Truck, Phone, Mail } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Fornecedor } from '../types';
import Modal from '../components/Modal';

const emptyForm = (): Omit<Fornecedor, 'id' | 'criadoEm'> => ({
  nome: '', empresa: '', telefone: '', email: '', produtosFornecidos: '', observacoes: '',
});

export default function Fornecedores() {
  const { fornecedores, addFornecedor, updateFornecedor, deleteFornecedor, compras } = useStore();
  const [search, setSearch] = useState('');
  const [modalAdd, setModalAdd] = useState(false);
  const [modalEdit, setModalEdit] = useState<Fornecedor | null>(null);
  const [form, setForm] = useState(emptyForm());

  const filtered = fornecedores.filter(f =>
    f.nome.toLowerCase().includes(search.toLowerCase()) ||
    f.empresa.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => { addFornecedor(form); setForm(emptyForm()); setModalAdd(false); };
  const handleEdit = () => { if (!modalEdit) return; updateFornecedor(modalEdit.id, form); setModalEdit(null); };
  const openEdit = (f: Fornecedor) => { setForm({ ...f }); setModalEdit(f); };

  const FornForm = () => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Nome *</label>
          <input className="input" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
        </div>
        <div>
          <label className="label">Empresa</label>
          <input className="input" value={form.empresa} onChange={e => setForm(f => ({ ...f, empresa: e.target.value }))} />
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
        <label className="label">Produtos Fornecidos</label>
        <textarea className="input" rows={2} value={form.produtosFornecidos} onChange={e => setForm(f => ({ ...f, produtosFornecidos: e.target.value }))} placeholder="Ex: Zípers, Cursores, Fivelas..." />
      </div>
      <div>
        <label className="label">Observações</label>
        <textarea className="input" rows={2} value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} />
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Fornecedores</h1>
          <p className="text-sm text-slate-500">{fornecedores.length} fornecedores</p>
        </div>
        <button onClick={() => { setForm(emptyForm()); setModalAdd(true); }} className="btn-primary">
          <Plus size={16} /> Novo Fornecedor
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input placeholder="Buscar fornecedor..." className="input pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(forn => {
          const nCompras = compras.filter(c => c.fornecedorId === forn.id).length;
          return (
            <div key={forn.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                  <Truck size={18} className="text-teal-600" />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(forn)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={14} /></button>
                  <button onClick={() => deleteFornecedor(forn.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                </div>
              </div>
              <h3 className="font-semibold text-slate-800">{forn.nome}</h3>
              {forn.empresa && <p className="text-sm text-slate-500">{forn.empresa}</p>}
              <div className="mt-3 space-y-1">
                {forn.telefone && <div className="flex items-center gap-2 text-xs text-slate-500"><Phone size={12} />{forn.telefone}</div>}
                {forn.email && <div className="flex items-center gap-2 text-xs text-slate-500"><Mail size={12} />{forn.email}</div>}
                {forn.produtosFornecidos && <p className="text-xs text-slate-400 mt-1">{forn.produtosFornecidos}</p>}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-50">
                <span className="text-xs text-slate-400">{nCompras} compra{nCompras !== 1 ? 's' : ''} registrada{nCompras !== 1 ? 's' : ''}</span>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16 text-slate-400">
            <Truck size={40} className="mx-auto mb-2 opacity-30" />
            <p>Nenhum fornecedor cadastrado</p>
          </div>
        )}
      </div>

      {modalAdd && (
        <Modal title="Novo Fornecedor" onClose={() => setModalAdd(false)}>
          <FornForm />
          <div className="flex justify-end gap-2 mt-5">
            <button onClick={() => setModalAdd(false)} className="btn-ghost">Cancelar</button>
            <button onClick={handleAdd} className="btn-primary" disabled={!form.nome}>Salvar</button>
          </div>
        </Modal>
      )}

      {modalEdit && (
        <Modal title="Editar Fornecedor" onClose={() => setModalEdit(null)}>
          <FornForm />
          <div className="flex justify-end gap-2 mt-5">
            <button onClick={() => setModalEdit(null)} className="btn-ghost">Cancelar</button>
            <button onClick={handleEdit} className="btn-primary">Salvar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
