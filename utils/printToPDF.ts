/**
 * Triggers the browser's print dialog to generate a PDF
 * Requires print-specific CSS media queries to be set up in the component
 */
export function printReport(): void {
  window.print();
}

/**
 * Copies text content to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
    return false;
  }
}
