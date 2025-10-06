// Polyfills for Web3Auth
import { Buffer } from 'buffer';

// Make Buffer available globally
if (typeof window !== 'undefined') {
  (window as unknown as { Buffer: typeof Buffer }).Buffer = Buffer;
}

// Process polyfill
if (typeof window !== 'undefined' && !window.process) {
  (window as unknown as { process: unknown }).process = {
    env: {},
    version: '',
    versions: {},
    platform: 'browser',
    nextTick: (fn: Function) => setTimeout(fn, 0),
  };
}
