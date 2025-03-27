/// <reference types="vitest" />
import '@testing-library/jest-dom';

// Extend the Vitest Assertion interface
interface CustomMatchers<R = unknown> {
  toBeInTheDocument(): R;
  toBeVisible(): R;
  toBeChecked(): R;
  toHaveTextContent(text: string | RegExp): R;
  toHaveStyle(css: string): R;
  toBeDisabled(): R;
}

declare module 'vitest' {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}