/**
 * Print / "Save as PDF" export.
 *
 * The browser's print engine does the PDF conversion — always local, never an
 * external API. The print stylesheet in global.css strips the application
 * chrome and paginates the document at A4.
 */
export function printDocument(): void {
  window.print()
}
