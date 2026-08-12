import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Peça pelo delivery',
  description: 'Faça seu pedido online e acompanhe a entrega.'
}

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
