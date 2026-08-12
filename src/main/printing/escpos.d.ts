declare module 'escpos' {
  export class Printer {
    constructor(device: unknown, options?: Record<string, unknown>)
    font(font: string): this
    align(alignment: string): this
    style(style: string): this
    size(width: number, height: number): this
    text(content: string): this
    drawLine(): this
    feed(lines?: number): this
    cut(): this
    close(callback?: () => void): void
  }
  const escpos: {
    Printer: typeof Printer
    USB: new (...args: unknown[]) => unknown
    Network: new (address: string, port?: number) => unknown
  }
  export default escpos
}

declare module 'escpos-usb' {
  const USB: new (...args: unknown[]) => unknown
  export default USB
}

declare module 'escpos-network' {
  const Network: new (address: string, port?: number) => unknown
  export default Network
}
