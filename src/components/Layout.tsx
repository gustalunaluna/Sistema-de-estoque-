import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Package, Layers, FileText, Factory,
  Kanban, Users, ShoppingCart, Truck, BarChart3, History,
  UserCog, ChevronLeft, ChevronRight, Menu, LogOut,
  DollarSign, Bell, Settings
} from 'lucide-react';
import { useStore } from '../store/useStore';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/insumos', icon: Package, label: 'Estoque' },
  { to: '/modelos', icon: Layers, label: 'Modelos' },
  { to: '/fichas', icon: FileText, label: 'Fichas Técnicas' },
  { to: '/producao', icon: Factory, label: 'Produção' },
  { to: '/kanban', icon: Kanban, label: 'Kanban' },
  { to: '/clientes', icon: Users, label: 'Clientes' },
  { to: '/orcamentos', icon: DollarSign, label: 'Orçamentos' },
  { to: '/fornecedores', icon: Truck, label: 'Fornecedores' },
  { to: '/compras', icon: ShoppingCart, label: 'Compras' },
  { to: '/relatorios', icon: BarChart3, label: 'Relatórios' },
  { to: '/historico', icon: History, label: 'Histórico' },
  { to: '/usuarios', icon: UserCog, label: 'Usuários' },
  { to: '/configuracoes', icon: Settings, label: 'Configurações' },
];

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { usuarioAtual, insumos } = useStore();

  const insumosAbaixo = insumos.filter(i => i.quantidade <= i.estoqueMinimo).length;

  const Sidebar = ({ mobile = false }) => (
    <aside className={`
      flex flex-col bg-slate-900 text-white h-full
      ${mobile ? 'w-64' : collapsed ? 'w-16' : 'w-60'}
      transition-all duration-200
    `}>
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-slate-700 ${collapsed && !mobile ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Package size={18} />
        </div>
        {(!collapsed || mobile) && (
          <div className="overflow-hidden">
            <p className="font-bold text-sm leading-tight">FabricaERP</p>
            <p className="text-xs text-slate-400">Gestão Industrial</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={() => mobile && setMobileOpen(false)}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm
              transition-colors duration-150
              ${isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
              ${collapsed && !mobile ? 'justify-center px-2' : ''}
            `}
            title={collapsed && !mobile ? label : undefined}
          >
            <Icon size={18} className="flex-shrink-0" />
            {(!collapsed || mobile) && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className={`border-t border-slate-700 p-3 ${collapsed && !mobile ? 'flex justify-center' : ''}`}>
        {(!collapsed || mobile) ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold">{usuarioAtual?.nome[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{usuarioAtual?.nome}</p>
              <p className="text-xs text-slate-400 truncate capitalize">{usuarioAtual?.nivel}</p>
            </div>
            <button className="text-slate-400 hover:text-white" title="Sair">
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold">{usuarioAtual?.nome[0]}</span>
          </div>
        )}
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden w-full">
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-col relative">
        <Sidebar />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 bg-slate-900 border border-slate-700 rounded-full p-0.5 text-slate-400 hover:text-white z-10"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative z-50 h-full">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <button
            className="md:hidden text-slate-600"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          {insumosAbaixo > 0 && (
            <div className="flex items-center gap-1 text-amber-600 text-sm bg-amber-50 px-3 py-1 rounded-full">
              <Bell size={14} />
              <span>{insumosAbaixo} insumo{insumosAbaixo > 1 ? 's' : ''} abaixo do mínimo</span>
            </div>
          )}
          <div className="text-sm text-slate-500">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
