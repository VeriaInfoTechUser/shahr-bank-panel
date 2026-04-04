import { toPersianDigits } from '@/utils/persianDigits';

/** فقط ناحیهٔ UI پنل (اپ، پورتال PrimeVue، توست) — نه اسکریپت/استایل خام. */
const DIGIT_SCOPE_SELECTOR = [
  '#app',
  '.p-dialog',
  '.p-toast',
  '.p-select-overlay',
  '.p-datepicker-panel',
  '.p-dropdown-panel',
  '.p-popover',
  '.p-confirmpopup',
  '.p-tooltip',
  '.Toastify',
  '.Vue-Toastification',
].join(', ');

function inDigitScope(el: Element | null): boolean {
  if (!el) return false;
  try {
    return el.closest(DIGIT_SCOPE_SELECTOR) != null;
  } catch {
    return false;
  }
}

function shouldSkipElement(el: Element | null): boolean {
  if (!el) return true;
  if (el.closest('[data-persian-digits-ignore]')) return true;
  const tag = el.tagName;
  if (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    tag === 'SCRIPT' ||
    tag === 'STYLE' ||
    tag === 'NOSCRIPT' ||
    tag === 'TEMPLATE'
  ) {
    return true;
  }
  const h = el as HTMLElement;
  if (h.isContentEditable) return true;
  return false;
}

function processTextNodesIn(container: ParentNode): void {
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    (node) => {
      const p = node.parentElement;
      if (!p || shouldSkipElement(p) || !inDigitScope(p))
        return NodeFilter.FILTER_REJECT;
      if (!/[0-9]/.test(node.textContent || ''))
        return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  );

  const batch: Text[] = [];
  let n: Node | null;
  while ((n = walker.nextNode())) {
    batch.push(n as Text);
  }

  for (const textNode of batch) {
    const raw = textNode.textContent ?? '';
    const next = toPersianDigits(raw);
    if (next !== raw) textNode.textContent = next;
  }
}

function elementsInTree(root: ParentNode): Element[] {
  if (root instanceof Element) {
    return [root, ...root.querySelectorAll('*')];
  }
  if (root instanceof DocumentFragment) {
    return [...root.querySelectorAll('*')];
  }
  return [];
}

/**
 * تبدیل ارقام لاتین به فارسی در متن نمایشی (نه مقدار فیلدهای ورودی).
 * روی درخت اصلی و سپس هر ShadowRoot به‌صورت بازگشتی اعمال می‌شود.
 */
export function applyPersianDigitsToSubtree(root: ParentNode | null): void {
  if (!root) return;
  processTextNodesIn(root);

  for (const el of elementsInTree(root)) {
    if (el.shadowRoot) {
      applyPersianDigitsToSubtree(el.shadowRoot);
    }
  }
}

/** برای پوشش کل پنل شامل پورتال‌های body (مثلاً Dialog). */
export function applyPersianDigitsToDocumentBody(): void {
  applyPersianDigitsToSubtree(document.body);
}
