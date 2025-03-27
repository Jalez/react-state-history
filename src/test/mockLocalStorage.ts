/**
 * Mock implementation for localStorage to use in tests
 */
class MockLocalStorage implements Storage {
  private store: Record<string, string> = {};
  clear() {
    this.store = {};
  }
  getItem(key: string) {
    return this.store[key] || null;
  }
  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }
  removeItem(key: string) {
    delete this.store[key];
  }
  get length() {
    return Object.keys(this.store).length;
  }
  key(index: number) {
    return Object.keys(this.store)[index] || null;
  }
}

// Define a type for the global context in tests
declare const globalThis: {
  localStorage?: Storage;
};

/**
 * Sets up a mock localStorage for testing
 * @returns Functions to restore original localStorage and get the mock instance
 */
export function setupMockLocalStorage() {
  // Save original localStorage
  const originalLocalStorage = globalThis.localStorage;
  
  // Create mock instance
  const mockLocalStorage = new MockLocalStorage();
  
  // Replace global localStorage with mock
  Object.defineProperty(globalThis, 'localStorage', {
    value: mockLocalStorage,
    writable: true
  });
  
  // Return functions to restore and access the mock
  return {
    restoreLocalStorage: () => {
      Object.defineProperty(globalThis, 'localStorage', {
        value: originalLocalStorage,
        writable: true
      });
    },
    getMockLocalStorage: () => mockLocalStorage
  };
}