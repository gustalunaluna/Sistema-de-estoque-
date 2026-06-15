import { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Usuario, NivelUsuario } from '../types';
import Modal from '../components/Modal';
import Badge from '../components/Badge';

const niveis: { value: NivelUsuario; label: string }[] = [
  { value: 'administrador', label: 'Administrador' },
  { value: 'estoque', label: 'Estoque' },
  { value: 'producao', label: 'Produção' },
  { value: 'comercial', label: 'Comercial' },
];

const nivelVariant: Record<NivelUsuario, 'purple' | 'blue' | 'orange' | 'green'> = {
  administrador: 'purple',
  estoque: 'blue',
  producao: 'orange',
  comercial: 'green',
};

const emptyForm = (): Omit<Usuario, 'id' | 'criadoEm'> => ({
  nome: '', email: '', nivel: 'estoque', ativo: true,
});

export default function Usuarios() {
  const { usuarios, addUsuario, updateUsuario, deleteUsuario, usuarioAtual } = useStore();
  const [modalAdd, setModalAdd] = useState(false);
  const [modalEdit, setModalEdit] = useState<Usuario | null>(null);
  const [form, setForm] = useState(emptyForm());

  const handleAdd = () => { addUsuario(form); setForm(emptyForm()); setModalAdd(false); };
  const handleEdit = () => { if (!modalEdit) return; updateUsuario(modalEdit.id, form); setModalEdit(null); };
  const openEdit = (u: Usuario) => { setForm({ ...u }); setModalEdit(u); };

  const UserForm = () => (
    <div className="space-y-3">
      <div>
        <label className="label">Nome *</label>
        <input className="input" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
      </div>
      <div>
        <label className="label">Email *</label>
        <input type="email" className="input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
      </div>
      <div>
        <label className="label">Nível de Acesso</label>
        <select className="input" value={form.nivel} onChange={e => setForm(f => ({ ...f, nivel: e.target.value as NivelUsuario }))}>
          {niveis.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="ativo" checked={form.ativo} onChange={e => setForm(f => ({ ...f, ativo: e.target.checked }))} />
        <label htmlFor="ativo" className="text-sm text-slate-700">Usuário ativo</label>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Usuários</h1>
          <p className="text-sm text-slate-500">{usuarios.length} usuário{usuarios.length !== 1 ? 's' : ''}</p>
        </div>
        {usuarioAtual?.nivel === 'administrador' && (
          <button onClick={() => { setForm(emptyForm()); setModalAdd(true); }} className="btn-primary">
            <Plus size={16} /> Novo Usuário
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="p-4 border-b border-slate-50">
          <h3 className="text-sm font-semibold text-slate-600">Permissões por Nível</h3>
        </div>
        <div className="p-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { nivel: 'Administrador', desc: 'Acesso total ao sistema', color: 'bg-purple-50 border-purple-200' },
            { nivel: 'Estoque', desc: 'Somente módulo de estoque', color: 'bg-blue-50 border-blue-200' },
            { nivel: 'Produção', desc: 'Fichas técnicas e produção', color: 'bg-orange-50 border-orange-200' },
            { nivel: 'Comercial', desc: 'Clientes e orçamentos', color: 'bg-green-50 border-green-200' },
          ].map(p => (
            <div key={p.nivel} className={`border rounded-lg p-3 ${p.color}`}>
              <p className="font-medium text-sm text-slate-800">{p.nivel}</p>
              <p className="text-xs text-slate-500 mt-0.5">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 divide-y divide-slate-50">
        {usuarios.map(u => (
          <div key={u.id} className="flex items-center gap-4 px-5 py-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="font-bold text-blue-600">{u.nome[0]}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-slate-800">{u.nome}</p>
                {!u.ativo && <span className="text-xs text-red-500">(inativo)</span>}
                {u.id === usuarioAtual?.id && <span className="text-xs text-green-500">(você)</span>}
              </div>
              <p className="text-xs text-slate-400">{u.email}</p>
            </div>
            <Badge label={niveis.find(n => n.value === u.nivel)?.label ?? u.nivel} variant={nivelVariant[u.nivel]} />
            {usuarioAtual?.nivel === 'administrador' && u.id !== usuarioAtual.id && (
              <div className="flex gap-1">
                <button onClick={() => openEdit(u)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={14} /></button>
                <button onClick={() => deleteUsuario(u.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
              </div>
            )}
          </div>
        ))}
      </div>

      {modalAdd && (
        <Modal title="Novo Usuário" onClose={() => setModalAdd(false)}>
          <UserForm />
          <div className="flex justify-end gap-2 mt-5">
            <button onClick={() => setModalAdd(false)} className="btn-ghost">Cancelar</button>
            <button onClick={handleAdd} className="btn-primary" disabled={!form.nome || !form.email}>Salvar</button>
          </div>
        </Modal>
      )}

      {modalEdit && (
        <Modal title="Editar Usuário" onClose={() => setModalEdit(null)}>
          <UserForm />
          <div className="flex justify-end gap-2 mt-5">
            <button onClick={() => setModalEdit(null)} className="btn-ghost">Cancelar</button>
            <button onClick={handleEdit} className="btn-primary">Salvar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
