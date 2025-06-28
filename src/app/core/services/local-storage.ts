import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalStorage {

  constructor() { }
  /**
   * Get an item from localStorage by key
   * @param key The key to retrieve
   * @returns The stored value or null if not found
   */
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error getting item from localStorage with key "${key}":`, error);
      return null;
    }
  }

  /**
   * Set an item in localStorage
   * @param key The key to store under
   * @param value The value to store
   */
  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting item in localStorage with key "${key}":`, error);
    }
  }

  /**
   * Remove an item from localStorage
   * @param key The key to remove
   */
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item from localStorage with key "${key}":`, error);
    }
  }

  /**
   * Clear all items from localStorage
   */
  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }

  /**
   * Check if a key exists in localStorage
   * @param key The key to check
   * @returns True if the key exists
   */
  has(key: string): boolean {
    try {
      return localStorage.getItem(key) !== null;
    } catch (error) {
      console.error(`Error checking for key "${key}" in localStorage:`, error);
      return false;
    }
  }

  /**
   * Get all keys from localStorage
   * @returns Array of keys
   */
  keys(): string[] {
    try {
      return Object.keys(localStorage);
    } catch (error) {
      console.error('Error getting keys from localStorage:', error);
      return [];
    }
  }

  /**
   * Get the number of items in localStorage
   * @returns Number of items
   */
  length(): number {
    try {
      return localStorage.length;
    } catch (error) {
      console.error('Error getting length of localStorage:', error);
      return 0;
    }
  }
}
