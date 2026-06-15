import { useState } from 'react';
import { DndContext, DragOverlay, useDraggable, useDroppable, type DragEndEvent } from '@dnd-kit/core';
import { useStore } from '../store/useStore';
import type { OrdemProducao, StatusProducao } from '../types';

const colunas: { id: StatusProducao; label: string; emoji: string; color: string }[] = [
  { id: 'criada', label: 'Criada', emoji: '📝', color: 'bg-slate-50 border-slate-200' },
  { id: 'revisao', label: 'Revisão', emoji: '🔍', color: 'bg-yellow-50 border-yellow-200' },
  { id: 'aprovada', label: 'Aprovada', emoji: '✅', color: 'bg-blue-50 border-blue-200' },
  { id: 'corte', label: 'Corte', emoji: '✂️', color: 'bg-orange-50 border-orange-200' },
  { id: 'costura', label: 'Costura', emoji: '🧵', color: 'bg-purple-50 border-purple-200' },
  { id: 'acabamento', label: 'Acabamento', emoji: '🔧', color: 'bg-indigo-50 border-indigo-200' },
  { id: 'finalizada', label: 'Finalizada', emoji: '📦', color: 'bg-green-50 border-green-200' },
];

function Card({ ordem }: { ordem: OrdemProducao }) {
  const { modelos, clientes } = useStore();
  const modelo = modelos.find(m => m.id === ordem.modeloId);
  const cliente = clientes.find(c => c.id === ordem.clienteId);

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
      {modelo?.fotoPrincipal && (
        <img src={modelo.fotoPrincipal} alt="" className="w-full h-20 object-cover rounded mb-2" />
      )}
      <p className="font-medium text-sm text-slate-800">{modelo?.nome ?? '—'}</p>
      {cliente && <p className="text-xs text-slate-400">{cliente.nomeEmpresa}</p>}
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-slate-500">Qtd: <strong>{ordem.quantidade}</strong></span>
        {ordem.dataEntrega && (
          <span className="text-xs text-slate-400">
            {new Date(ordem.dataEntrega + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
          </span>
        )}
      </div>
    </div>
  );
}

function DraggableCard({ ordem }: { ordem: OrdemProducao }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: ordem.id });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`kanban-card transition-opacity ${isDragging ? 'opacity-40' : ''}`}
    >
      <Card ordem={ordem} />
    </div>
  );
}

function Coluna({ col, ordens }: { col: typeof colunas[0]; ordens: OrdemProducao[] }) {
  const { isOver, setNodeRef } = useDroppable({ id: col.id });
  return (
    <div className={`flex-shrink-0 w-60 rounded-xl border-2 ${col.color} ${isOver ? 'ring-2 ring-blue-400' : ''} transition-all`}>
      <div className="px-3 py-2.5 font-semibold text-sm text-slate-700 flex items-center justify-between">
        <span>{col.emoji} {col.label}</span>
        <span className="bg-white rounded-full px-2 py-0.5 text-xs text-slate-500 border border-slate-200">{ordens.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className="px-2 pb-2 space-y-2 min-h-24"
      >
        {ordens.map(o => <DraggableCard key={o.id} ordem={o} />)}
      </div>
    </div>
  );
}

export default function Kanban() {
  const { ordensProducao, moverOrdem } = useStore();
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeOrdem = ordensProducao.find(o => o.id === activeId);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const novoStatus = over.id as StatusProducao;
    const ordem = ordensProducao.find(o => o.id === active.id);
    if (ordem && ordem.status !== novoStatus) {
      moverOrdem(String(active.id), novoStatus);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Kanban de Produção</h1>
        <p className="text-sm text-slate-500">Arraste as ordens entre as etapas</p>
      </div>

      <DndContext
        onDragStart={e => setActiveId(String(e.active.id))}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="flex gap-3 overflow-x-auto pb-4">
          {colunas.map(col => (
            <Coluna
              key={col.id}
              col={col}
              ordens={ordensProducao.filter(o => o.status === col.id)}
            />
          ))}
        </div>
        <DragOverlay>
          {activeOrdem && (
            <div className="w-56 rotate-2 shadow-xl">
              <Card ordem={activeOrdem} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {ordensProducao.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <p>Nenhuma ordem de produção. Crie ordens na página de Produção.</p>
        </div>
      )}
    </div>
  );
}
