/**
 * Plugin Registry
 *
 * Manages plugin storage and state in localStorage.
 *
 * Storage model:
 * - Installed plugins are GLOBAL (hustle-plugins) - install once, available everywhere
 * - Enabled/disabled state is INSTANCE-SCOPED (hustle-plugin-state-{instanceId})
 *
 * Executors are not stored (they're functions) - they must be
 * hydrated from known plugins when loading.
 */

import type { StoredPlugin, HustlePlugin, HydratedPlugin, ToolExecutor, PluginHooks } from '../types';

/**
 * Storage keys:
 * - PLUGINS_KEY: Global list of installed plugins (not instance-scoped)
 * - getEnabledStateKey: Per-instance enabled/disabled states
 */
const PLUGINS_KEY = 'hustle-plugins';

function getEnabledStateKey(instanceId: string): string {
  return `hustle-plugin-state-${instanceId}`;
}

type PluginChangeCallback = (plugins: StoredPlugin[]) => void;

/** Stored enabled state per instance */
type EnabledState = Record<string, boolean>;

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
 *
 * Manages plugin persistence with:
 * - Global plugin installations
 * - Instance-scoped enabled/disabled state
 */
class PluginRegistry {
  private listeners: Map<string, Set<PluginChangeCallback>> = new Map();

  /**
   * Get listeners for a specific instance
   */
  private getListeners(instanceId: string): Set<PluginChangeCallback> {
    if (!this.listeners.has(instanceId)) {
      this.listeners.set(instanceId, new Set());
    }
    return this.listeners.get(instanceId)!;
  }

  /**
   * Load installed plugins (global)
   */
  private loadInstalledPlugins(): Omit<StoredPlugin, 'enabled'>[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(PLUGINS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Save installed plugins (global)
   */
  private saveInstalledPlugins(plugins: Omit<StoredPlugin, 'enabled'>[]): void {
    if (typeof window === 'undefined') return;
    const serializable = plugins.map(p => ({
      name: p.name,
      version: p.version,
      description: p.description,
      tools: p.tools,
    }));
    localStorage.setItem(PLUGINS_KEY, JSON.stringify(serializable));
  }

  /**
   * Load enabled state for an instance
   */
  private loadEnabledState(instanceId: string): EnabledState {
    if (typeof window === 'undefined') return {};
    try {
      const stored = localStorage.getItem(getEnabledStateKey(instanceId));
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  /**
   * Save enabled state for an instance
   */
  private saveEnabledState(state: EnabledState, instanceId: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(getEnabledStateKey(instanceId), JSON.stringify(state));
  }

  /**
   * Load plugins with instance-specific enabled state
   * Combines global plugin list with per-instance enabled state
   */
  loadFromStorage(instanceId: string = 'default'): StoredPlugin[] {
    const installed = this.loadInstalledPlugins();
    const enabledState = this.loadEnabledState(instanceId);

    return installed.map(plugin => ({
      ...plugin,
      // Default to enabled if no state exists for this instance
      enabled: enabledState[plugin.name] ?? true,
    }));
  }

  /**
   * Register a new plugin (global - available to all instances)
   * @param plugin The plugin to install
   * @param enabled Initial enabled state for this instance (default: true)
   * @param instanceId Instance to set initial enabled state for
   */
  register(plugin: HustlePlugin, enabled = true, instanceId: string = 'default'): void {
    // Register as known plugin for hydration
    registerKnownPlugin(plugin);

    // Add to global installed list
    const installed = this.loadInstalledPlugins();
    const existing = installed.findIndex(p => p.name === plugin.name);

    const storedPlugin = {
      name: plugin.name,
      version: plugin.version,
      description: plugin.description,
      tools: plugin.tools,
    };

    if (existing >= 0) {
      installed[existing] = storedPlugin;
    } else {
      installed.push(storedPlugin);
    }

    this.saveInstalledPlugins(installed);

    // Set initial enabled state for this instance
    const enabledState = this.loadEnabledState(instanceId);
    enabledState[plugin.name] = enabled;
    this.saveEnabledState(enabledState, instanceId);

    this.notifyListeners(instanceId);
  }

  /**
   * Unregister a plugin (global - removes from all instances)
   */
  unregister(pluginName: string, instanceId: string = 'default'): void {
    // Remove from global list
    const installed = this.loadInstalledPlugins().filter(p => p.name !== pluginName);
    this.saveInstalledPlugins(installed);

    // Clean up enabled state for this instance
    const enabledState = this.loadEnabledState(instanceId);
    delete enabledState[pluginName];
    this.saveEnabledState(enabledState, instanceId);

    this.notifyListeners(instanceId);
  }

  /**
   * Enable or disable a plugin (instance-scoped)
   */
  setEnabled(pluginName: string, enabled: boolean, instanceId: string = 'default'): void {
    const enabledState = this.loadEnabledState(instanceId);
    enabledState[pluginName] = enabled;
    this.saveEnabledState(enabledState, instanceId);
    this.notifyListeners(instanceId);
  }

  /**
   * Check if a plugin is installed (global)
   */
  isRegistered(pluginName: string, instanceId: string = 'default'): boolean {
    return this.loadInstalledPlugins().some(p => p.name === pluginName);
  }

  /**
   * Get a specific plugin with instance-specific enabled state
   */
  getPlugin(pluginName: string, instanceId: string = 'default'): StoredPlugin | undefined {
    return this.loadFromStorage(instanceId).find(p => p.name === pluginName);
  }

  /**
   * Get all enabled plugins for an instance (hydrated with executors)
   */
  getEnabledPlugins(instanceId: string = 'default'): HydratedPlugin[] {
    return this.loadFromStorage(instanceId)
      .filter(p => p.enabled)
      .map(hydratePlugin);
  }

  /**
   * Subscribe to plugin changes for a specific instance
   */
  onChange(callback: PluginChangeCallback, instanceId: string = 'default'): () => void {
    const listeners = this.getListeners(instanceId);
    listeners.add(callback);
    return () => listeners.delete(callback);
  }

  /**
   * Notify all listeners for a specific instance
   */
  private notifyListeners(instanceId: string = 'default'): void {
    const plugins = this.loadFromStorage(instanceId);
    const listeners = this.getListeners(instanceId);
    listeners.forEach(cb => cb(plugins));
  }

  /**
   * Clear enabled state for an instance (plugins remain installed globally)
   */
  clear(instanceId: string = 'default'): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(getEnabledStateKey(instanceId));
    this.notifyListeners(instanceId);
  }

  /**
   * Clear all installed plugins globally
   */
  clearAll(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(PLUGINS_KEY);
    // Note: This doesn't clear instance-specific enabled states
  }
}

// Singleton instance
export const pluginRegistry = new PluginRegistry();

export default pluginRegistry;
