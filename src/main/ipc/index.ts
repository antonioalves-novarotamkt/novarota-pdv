import { registrarIpcProdutos } from './produtos'
import { registrarIpcCategorias } from './categorias'
import { registrarIpcMesas } from './mesas'
import { registrarIpcComandas } from './comandas'
import { registrarIpcEstoque } from './estoque'
import { registrarIpcConfig } from './config'
import { registrarIpcVendas } from './vendas'

export function registerIpcHandlers(): void {
  registrarIpcProdutos()
  registrarIpcCategorias()
  registrarIpcMesas()
  registrarIpcComandas()
  registrarIpcEstoque()
  registrarIpcConfig()
  registrarIpcVendas()
}
