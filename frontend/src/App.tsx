function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-green-600">🍽️ Menu Manager</h1>
            <p className="text-gray-600">Gerenciador de Cardápios Multi-Tenant</p>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">🎯 Funcionalidades</h2>
            <ul className="space-y-2 text-gray-700">
              <li>✅ Gerenciamento de cardápios por cliente</li>
              <li>✅ Cálculo automático de preços com margem</li>
              <li>✅ Canais de venda personalizados</li>
              <li>✅ Importar/exportar Excel</li>
              <li>✅ Gerenciamento de imagens</li>
              <li>✅ API REST para integração</li>
            </ul>
          </div>

          <div className="bg-white p-8 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">🚀 Próximos Passos</h2>
            <ol className="space-y-2 text-gray-700">
              <li>1. Configurar banco de dados</li>
              <li>2. Implementar autenticação</li>
              <li>3. CRUD de clientes e produtos</li>
              <li>4. Upload de imagens</li>
              <li>5. Importação Excel</li>
              <li>6. Dashboard e relatórios</li>
            </ol>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-2">💡 Status Atual</h3>
          <p className="text-blue-800">
            Projeto estruturado com backend (Express + Prisma) e frontend (React + Vite).
            Próximo passo: Configurar banco de dados e implementar autenticação JWT.
          </p>
        </div>
      </main>
    </div>
  )
}

export default App
