/**
 * Plugin Registry
 *
 * Manages plugin storage and state in localStorage.
 * Executors are not stored (they're functions) - they must be
 * hydrated from known plugins when loading.
 */

import type { StoredPlugin, HustlePlugin, HydratedPlugin, ToolExecutor, PluginHooks } from '../types';

const STORAGE_KEY = 'hustle-plugins';

type PluginChangeCallback = (plugins: StoredPlugin[]) => void;

/**
 * Registry of known plugins (for hydrating executors)
 */
const knownPlugins: Map<string, HustlePlugin> = new Map();

/**
 * Register a plugin definition (for hydration)
 */
export function registerKnownPlugin(plugin: HustlePlugin): void {
  knownPlugins.set(plugin.name, plugin);
}

/**
 * Get all known plugin definitions
 */
export function getKnownPlugins(): HustlePlugin[] {
  return Array.from(knownPlugins.values());
}

/**
 * Hydrate a stored plugin with its executors and hooks
 */
export function hydratePlugin(stored: StoredPlugin): HydratedPlugin {
  const known = knownPlugins.get(stored.name);
  return {
    ...stored,
    executors: known?.executors,
    hooks: known?.hooks,
  };
}

/**
 * Plugin Registry class
 * Manages plugin persistence and change notifications
 */
class PluginRegistry {
  private listeners: Set<PluginChangeCallback> = new Set();

  /**
   * Load plugins from localStorage
   */
  loadFromStorage(): StoredPlugin[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Save plugins to localStorage
   */
  private saveToStorage(plugins: StoredPlugin[]): void {
    if (typeof window === 'undefined') return;
    // Store only serializable parts (not executors/hooks)
    const serializable = plugins.map(p => ({
      name: p.name,
      version: p.version,
      description: p.description,
      tools: p.tools,
      enabled: p.enabled,
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
    this.notifyListeners();
  }

  /**
   * Register a new plugin (or update existing)
   */
  register(plugin: HustlePlugin, enabled = true): void {
    // Also register as known plugin for hydration
    registerKnownPlugin(plugin);

    const plugins = this.loadFromStorage();
    const existing = plugins.findIndex(p => p.name === plugin.name);

    const storedPlugin: StoredPlugin = {
      name: plugin.name,
      version: plugin.version,
      description: plugin.description,
      tools: plugin.tools,
      enabled,
    };

    if (existing >= 0) {
      plugins[existing] = storedPlugin;
    } else {
      plugins.push(storedPlugin);
    }

    this.saveToStorage(plugins);
  }

  /**
   * Unregister a plugin
   */
  unregister(pluginName: string): void {
    const plugins = this.loadFromStorage().filter(p => p.name !== pluginName);
    this.saveToStorage(plugins);
  }

  /**
   * Enable or disable a plugin
   */
  setEnabled(pluginName: string, enabled: boolean): void {
    const plugins = this.loadFromStorage();
    const plugin = plugins.find(p => p.name === pluginName);
    if (plugin) {
      plugin.enabled = enabled;
      this.saveToStorage(plugins);
    }
  }

  /**
   * Check if a plugin is registered
   */
  isRegistered(pluginName: string): boolean {
    return this.loadFromStorage().some(p => p.name === pluginName);
  }

  /**
   * Get a specific plugin
   */
  getPlugin(pluginName: string): StoredPlugin | undefined {
    return this.loadFromStorage().find(p => p.name === pluginName);
  }

  /**
   * Get all enabled plugins (hydrated with executors)
   */
  getEnabledPlugins(): HydratedPlugin[] {
    return this.loadFromStorage()
      .filter(p => p.enabled)
      .map(hydratePlugin);
  }

  /**
   * Subscribe to plugin changes
   */
  onChange(callback: PluginChangeCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of changes
   */
  private notifyListeners(): void {
    const plugins = this.loadFromStorage();
    this.listeners.forEach(cb => cb(plugins));
  }

  /**
   * Clear all plugins
   */
  clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
    this.notifyListeners();
  }
}

// Singleton instance
export const pluginRegistry = new PluginRegistry();

export default pluginRegistry;
