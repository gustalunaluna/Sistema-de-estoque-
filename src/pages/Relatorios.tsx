import { useStore } from '../store/useStore';
import { BarChart3, TrendingUp, Package, Factory } from 'lucide-react';

export default function Relatorios() {
  const { insumos, movimentacoes, ordensProducao, modelos, orcamentos, compras } = useStore();

  const valorTotalEstoque = insumos.reduce((s, i) => s + i.quantidade * i.valorUnitario, 0);
  const insumosAbaixo = insumos.filter(i => i.quantidade <= i.estoqueMinimo).length;

  // Materiais mais consumidos
  const consumoPorInsumo: Record<string, number> = {};
  movimentacoes.filter(m => m.tipo === 'saida').forEach(m => {
    consumoPorInsumo[m.insumoId] = (consumoPorInsumo[m.insumoId] ?? 0) + m.quantidade;
  });
  const topConsumo = Object.entries(consumoPorInsumo)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, qtd]) => ({ insumo: insumos.find(i => i.id === id), qtd }));

  // Produção
  const totalOrdens = ordensProducao.length;
  const ordensFin = ordensProducao.filter(o => o.status === 'finalizada').length;
  const ordensAtivas = ordensProducao.filter(o => !['finalizada', 'criada'].includes(o.status)).length;

  // Financeiro
  const totalVendas = orcamentos.filter(o => o.status === 'aprovado').reduce((s, o) => s + o.valorTotal, 0);
  const totalCompras = compras.filter(c => c.status === 'recebida').reduce((s, c) => s + c.valorTotal, 0);

  // Entradas e saídas
  const totalEntradas = movimentacoes.filter(m => m.tipo === 'entrada').reduce((s, m) => s + m.quantidade, 0);
  const totalSaidas = movimentacoes.filter(m => m.tipo === 'saida').reduce((s, m) => s + m.quantidade, 0);

  const Card = ({ title, value, sub, icon: Icon, color }: { title: string; value: string; sub?: string; icon: React.ElementType; color: string }) => (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="text-xl font-bold text-slate-800 mt-1">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-lg ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Relatórios</h1>
        <p className="text-sm text-slate-500">Visão geral do desempenho da fábrica</p>
      </div>

      {/* Estoque */}
      <section>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Package size={14} /> Estoque
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card title="Valor Total em Estoque" value={`R$ ${valorTotalEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={Package} color="bg-blue-500" />
          <Card title="Materiais Cadastrados" value={String(insumos.length)} sub="tipos de insumo" icon={Package} color="bg-indigo-500" />
          <Card title="Abaixo do Mínimo" value={String(insumosAbaixo)} sub="precisam de reposição" icon={Package} color="bg-red-500" />
          <Card title="Total de Entradas" value={String(totalEntradas)} sub="unidades recebidas" icon={TrendingUp} color="bg-green-500" />
        </div>
      </section>

      {/* Produção */}
      <section>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Factory size={14} /> Produção
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card title="Total de Ordens" value={String(totalOrdens)} icon={Factory} color="bg-orange-500" />
          <Card title="Em Produção" value={String(ordensAtivas)} sub="ordens ativas" icon={Factory} color="bg-purple-500" />
          <Card title="Finalizadas" value={String(ordensFin)} sub="ordens concluídas" icon={Factory} color="bg-teal-500" />
          <Card title="Modelos no Portfólio" value={String(modelos.length)} icon={BarChart3} color="bg-cyan-500" />
        </div>
      </section>

      {/* Financeiro */}
      <section>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <TrendingUp size={14} /> Financeiro
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Card title="Vendas Aprovadas" value={`R$ ${totalVendas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} sub="orçamentos aprovados" icon={TrendingUp} color="bg-green-600" />
          <Card title="Compras Realizadas" value={`R$ ${totalCompras.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} sub="compras recebidas" icon={TrendingUp} color="bg-blue-600" />
          <Card title="Saídas de Estoque" value={String(totalSaidas)} sub="unidades consumidas" icon={TrendingUp} color="bg-amber-500" />
        </div>
      </section>

      {/* Top consumo */}
      <section>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Materiais Mais Consumidos</h3>
          {topConsumo.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">Nenhuma movimentação de saída registrada</p>
          ) : (
            <div className="space-y-3">
              {topConsumo.map(({ insumo, qtd }, i) => {
                const maxQtd = topConsumo[0].qtd;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 w-4">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-slate-700">{insumo?.nome ?? '—'}</span>
                        <span className="text-slate-500">{qtd.toLocaleString('pt-BR')} {insumo?.unidade}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(qtd / maxQtd) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Movimentações por mês - simples */}
      <section>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Movimentações</h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{totalEntradas.toLocaleString('pt-BR')}</div>
              <p className="text-sm text-slate-500 mt-1">Total de Entradas</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{totalSaidas.toLocaleString('pt-BR')}</div>
              <p className="text-sm text-slate-500 mt-1">Total de Saídas</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-50 text-center">
            <p className="text-sm text-slate-500">Total de movimentações: <strong className="text-slate-800">{movimentacoes.length}</strong></p>
          </div>
        </div>
      </section>
    </div>
  );
}
