// Minimal type shim for the html-to-docx package, which ships JS only.
// The package's default export is a single function: HTML in, docx Buffer out.
declare module 'html-to-docx' {
  function HTMLtoDOCX(
    html: string,
    header?: string | null,
    options?: Record<string, unknown>,
    footer?: string | null,
  ): Promise<Buffer>
  export default HTMLtoDOCX
}
