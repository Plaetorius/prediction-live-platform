// Polyfills for Web3Auth
import { Buffer } from 'buffer';

// Make Buffer available globally
if (typeof window !== 'undefined') {
  (window as any).Buffer = Buffer;
}

// Process polyfill
if (typeof window !== 'undefined' && !window.process) {
  (window as any).process = {
    env: {},
    version: '',
    versions: {},
    platform: 'browser',
    nextTick: (fn: Function) => setTimeout(fn, 0),
  };
}
