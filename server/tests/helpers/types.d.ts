// Add DOM type definitions for use in Puppeteer evaluate() functions
interface Window {
  document: Document;
}

interface Document {
  querySelector(selectors: string): Element | null;
  querySelectorAll(selectors: string): NodeListOf<Element>;
}

interface Element {
  textContent: string | null;
  value?: string;
}

interface HTMLInputElement extends Element {
  value: string;
}
