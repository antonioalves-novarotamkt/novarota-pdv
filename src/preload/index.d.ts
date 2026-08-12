import { ElectronAPI } from '@electron-toolkit/preload'

interface PdvApi {
  invoke: <T = unknown>(channel: string, payload?: unknown) => Promise<T>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: PdvApi
  }
}
