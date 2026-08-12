import { NavLink, Route, Routes } from 'react-router-dom'
import CaixaPage from './pages/Caixa/CaixaPage'
import ComandasPage from './pages/Comandas/ComandasPage'
import ProdutosPage from './pages/Produtos/ProdutosPage'
import EstoquePage from './pages/Estoque/EstoquePage'
import VendasPage from './pages/Vendas/VendasPage'
import ConfiguracoesPage from './pages/Configuracoes/ConfiguracoesPage'

const NAV_ITEMS = [
  { to: '/', label: 'Caixa', end: true },
  { to: '/comandas', label: 'Comandas' },
  { to: '/produtos', label: 'Produtos' },
  { to: '/estoque', label: 'Estoque' },
  { to: '/vendas', label: 'Vendas' },
  { to: '/configuracoes', label: 'Configuracoes' }
]

function App(): JSX.Element {
  return (
    <div className="flex h-full">
      <aside className="flex w-56 shrink-0 flex-col bg-slate-900 text-slate-100">
        <div className="px-5 py-6">
          <h1 className="text-lg font-bold leading-tight">NovaRota</h1>
          <p className="text-xs text-slate-400">PDV</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<CaixaPage />} />
          <Route path="/comandas" element={<ComandasPage />} />
          <Route path="/produtos" element={<ProdutosPage />} />
          <Route path="/estoque" element={<EstoquePage />} />
          <Route path="/vendas" element={<VendasPage />} />
          <Route path="/configuracoes" element={<ConfiguracoesPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
