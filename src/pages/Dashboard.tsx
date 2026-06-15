import { useStore } from '../store/useStore';
import { Package, Layers, FileText, Factory, AlertTriangle, TrendingUp, DollarSign, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function StatCard({ title, value, sub, icon: Icon, color }: {
  title: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-lg ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { insumos, modelos, fichasTecnicas, ordensProducao, movimentacoes, usuarioAtual } = useStore();

  const valorTotal = insumos.reduce((sum, i) => sum + i.quantidade * i.valorUnitario, 0);
  const insumosAbaixo = insumos.filter(i => i.quantidade <= i.estoqueMinimo);
  const emProducao = ordensProducao.filter(o => ['corte', 'costura', 'acabamento'].includes(o.status)).length;
  const finalizadas = ordensProducao.filter(o => o.status === 'finalizada').length;
  const emRevisao = ordensProducao.filter(o => o.status === 'revisao').length;

  const ultimasMovimentacoes = movimentacoes.slice(0, 8);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 text-sm">Bem-vindo, {usuarioAtual?.nome}! Aqui está o resumo da fábrica.</p>
      </div>

      {/* Estoque */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Estoque</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Valor em Estoque"
            value={`R$ ${valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            icon={DollarSign} color="bg-blue-500"
          />
          <StatCard
            title="Materiais Cadastrados"
            value={insumos.length}
            sub="insumos"
            icon={Package} color="bg-indigo-500"
          />
          <StatCard
            title="Abaixo do Mínimo"
            value={insumosAbaixo.length}
            sub="requerem atenção"
            icon={AlertTriangle} color="bg-amber-500"
          />
          <StatCard
            title="Modelos Cadastrados"
            value={modelos.length}
            sub="no portfólio"
            icon={Layers} color="bg-purple-500"
          />
        </div>
      </div>

      {/* Produção */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Produção</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Fichas Técnicas"
            value={fichasTecnicas.length}
            icon={FileText} color="bg-teal-500"
          />
          <StatCard
            title="Em Produção"
            value={emProducao}
            sub="ordens ativas"
            icon={Factory} color="bg-orange-500"
          />
          <StatCard
            title="Em Revisão"
            value={emRevisao}
            icon={Clock} color="bg-yellow-500"
          />
          <StatCard
            title="Finalizadas"
            value={finalizadas}
            sub="ordens concluídas"
            icon={TrendingUp} color="bg-green-500"
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Alertas */}
        {insumosAbaixo.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" />
              Insumos Abaixo do Estoque Mínimo
            </h3>
            <div className="space-y-2">
              {insumosAbaixo.slice(0, 6).map(i => (
                <div key={i.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{i.nome}</p>
                    <p className="text-xs text-slate-400">Mínimo: {i.estoqueMinimo} {i.unidade}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-red-600">{i.quantidade}</span>
                    <p className="text-xs text-slate-400">{i.unidade}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Últimas movimentações */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-800 mb-3">Últimas Movimentações</h3>
          {ultimasMovimentacoes.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">Nenhuma movimentação ainda</p>
          ) : (
            <div className="space-y-2">
              {ultimasMovimentacoes.map(m => {
                const insumo = insumos.find(i => i.id === m.insumoId);
                return (
                  <div key={m.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-slate-700">{insumo?.nome}</p>
                      <p className="text-xs text-slate-400">{m.motivo}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-bold ${m.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                        {m.tipo === 'entrada' ? '+' : '-'}{m.quantidade}
                      </span>
                      <p className="text-xs text-slate-400">
                        {format(new Date(m.data), 'dd/MM HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Status das ordens */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-800 mb-3">Ordens de Produção por Status</h3>
          {ordensProducao.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">Nenhuma ordem de produção</p>
          ) : (
            <div className="space-y-2">
              {[
                { status: 'criada', label: '📝 Criada', color: 'bg-slate-100 text-slate-600' },
                { status: 'revisao', label: '🔍 Revisão', color: 'bg-yellow-100 text-yellow-700' },
                { status: 'aprovada', label: '✅ Aprovada', color: 'bg-blue-100 text-blue-700' },
                { status: 'corte', label: '✂️ Corte', color: 'bg-orange-100 text-orange-700' },
                { status: 'costura', label: '🧵 Costura', color: 'bg-purple-100 text-purple-700' },
                { status: 'acabamento', label: '🔧 Acabamento', color: 'bg-indigo-100 text-indigo-700' },
                { status: 'finalizada', label: '📦 Finalizada', color: 'bg-green-100 text-green-700' },
              ].map(({ status, label, color }) => {
                const count = ordensProducao.filter(o => o.status === status).length;
                if (count === 0) return null;
                return (
                  <div key={status} className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded-full ${color}`}>{label}</span>
                    <span className="font-semibold text-slate-700">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
