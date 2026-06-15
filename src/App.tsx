import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import EstoqueInsumos from './pages/EstoqueInsumos';
import EstoqueModelos from './pages/EstoqueModelos';
import FichasTecnicas from './pages/FichasTecnicas';
import Producao from './pages/Producao';
import Kanban from './pages/Kanban';
import Clientes from './pages/Clientes';
import Orcamentos from './pages/Orcamentos';
import Fornecedores from './pages/Fornecedores';
import Compras from './pages/Compras';
import Relatorios from './pages/Relatorios';
import Historico from './pages/Historico';
import Usuarios from './pages/Usuarios';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/insumos" element={<EstoqueInsumos />} />
          <Route path="/modelos" element={<EstoqueModelos />} />
          <Route path="/fichas" element={<FichasTecnicas />} />
          <Route path="/producao" element={<Producao />} />
          <Route path="/kanban" element={<Kanban />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/orcamentos" element={<Orcamentos />} />
          <Route path="/fornecedores" element={<Fornecedores />} />
          <Route path="/compras" element={<Compras />} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="/historico" element={<Historico />} />
          <Route path="/usuarios" element={<Usuarios />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
