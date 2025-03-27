/// <reference types="vitest" />
import '@testing-library/jest-dom';
import { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

declare module 'vitest' {
  interface Assertion extends TestingLibraryMatchers<typeof expect.stringContaining, void> {
    // This property is needed to make TypeScript happy with interface extension
    readonly __brand: 'vitest.assertion';
  }
}