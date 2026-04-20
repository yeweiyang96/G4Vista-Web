const workerGlobal = globalThis as unknown as {
  document?: WorkerDocumentStub;
  navigator?: { userAgent: string };
  window?: unknown;
};

interface WorkerDocumentStub {
  body: WorkerElementStub;
  createElement: (tagName: string) => WorkerElementStub;
  createElementNS: (namespace: string, tagName: string) => WorkerElementStub;
  createTextNode: (text: string) => { textContent: string };
  head: WorkerElementStub;
  querySelector: () => null;
  querySelectorAll: () => [];
  styleSheets: unknown[];
}

interface WorkerElementStub {
  addEventListener: () => void;
  append: (...children: unknown[]) => void;
  appendChild: (child: unknown) => unknown;
  childNodes: unknown[];
  children: unknown[];
  getAttribute: () => null;
  getContext?: OffscreenCanvas['getContext'];
  removeEventListener: () => void;
  removeAttribute: () => void;
  removeChild: (child: unknown) => unknown;
  setAttribute: () => void;
  sheet?: { cssRules: unknown[]; insertRule: () => number };
  style: Record<string, string>;
  tagName: string;
  textContent: string;
}

function createElementStub(tagName: string): WorkerElementStub {
  const children: unknown[] = [];
  const element: WorkerElementStub = {
    addEventListener: () => undefined,
    append: (...nodes: unknown[]) => {
      children.push(...nodes);
    },
    appendChild: (child: unknown) => {
      children.push(child);
      return child;
    },
    childNodes: children,
    children,
    getAttribute: () => null,
    removeEventListener: () => undefined,
    removeAttribute: () => undefined,
    removeChild: (child: unknown) => {
      const index = children.indexOf(child);
      if (index >= 0) {
        children.splice(index, 1);
      }
      return child;
    },
    setAttribute: () => undefined,
    style: {},
    tagName: tagName.toUpperCase(),
    textContent: '',
  };

  if (tagName.toLowerCase() === 'canvas' && typeof OffscreenCanvas !== 'undefined') {
    const canvas = new OffscreenCanvas(1, 1);
    element.getContext = canvas.getContext.bind(canvas);
  }

  if (tagName.toLowerCase() === 'style') {
    element.sheet = {
      cssRules: [],
      insertRule: () => 0,
    };
  }

  return element;
}

if (!workerGlobal.window) {
  workerGlobal.window = workerGlobal;
}

if (!workerGlobal.navigator) {
  workerGlobal.navigator = { userAgent: 'webworker' };
}

if (!workerGlobal.document) {
  workerGlobal.document = {
    body: createElementStub('body'),
    createElement: createElementStub,
    createElementNS: (_namespace: string, tagName: string) => createElementStub(tagName),
    createTextNode: (text: string) => ({ textContent: text }),
    head: createElementStub('head'),
    querySelector: () => null,
    querySelectorAll: () => [],
    styleSheets: [],
  };
}
