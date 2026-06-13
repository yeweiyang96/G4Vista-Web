interface WorkerWindowPolyfill {
  addEventListener: () => void;
  fetch: typeof fetch;
  location: Location;
  Date: DateConstructor;
  requestIdleCallback: (callback: () => void) => void;
  cancelIdleCallback: () => void;
  requestAnimationFrame: (callback: () => void) => void;
  cancelAnimationFrame: () => void;
  navigator: object;
}

interface WorkerDocumentPolyfill {
  createTextNode: () => void;
  querySelector: () => { appendChild: () => void };
  documentElement: object;
  head: { appendChild: () => void };
  querySelectorAll: () => [];
  createElement: () => {
    style: object;
    setAttribute: () => void;
    removeAttribute: () => void;
    appendChild: () => void;
  };
}

const noop = (): undefined => undefined;

const workerGlobal = self as unknown as {
  window: WorkerWindowPolyfill;
  document: WorkerDocumentPolyfill;
};

workerGlobal.window = {
  addEventListener: noop,
  fetch: self.fetch.bind(self),
  location: self.location,
  Date: self.Date,
  requestIdleCallback: (callback: () => void) => {
    callback();
  },
  cancelIdleCallback: noop,
  requestAnimationFrame: (callback: () => void) => {
    callback();
  },
  cancelAnimationFrame: noop,
  navigator: {},
};

workerGlobal.document = {
  createTextNode: noop,
  querySelector: () => ({ appendChild: noop }),
  documentElement: {},
  head: { appendChild: noop },
  querySelectorAll: () => [],
  createElement: () => ({
    style: {},
    setAttribute: noop,
    removeAttribute: noop,
    appendChild: noop,
  }),
};
