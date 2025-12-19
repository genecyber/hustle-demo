/**
 * Plugin Registry
 *
 * Manages plugin storage and state in localStorage.
 *
 * Storage model:
 * - Installed plugins are GLOBAL (hustle-plugins) - install once, available everywhere
 * - Enabled/disabled state is INSTANCE-SCOPED (hustle-plugin-state-{instanceId})
 *
 * Executor functions are serialized as strings (executorCode) and
 * reconstituted at runtime via new Function().
 *
 * SECURITY TODO: Add signature verification before executing stored code.
 * Plugins should be signed by trusted publishers and verified before
 * any eval/Function execution occurs.
 */

import type {
  StoredPlugin,
  HustlePlugin,
  HydratedPlugin,
  ToolExecutor,
  PluginHooks,
  SerializedToolDefinition,
  SerializedHooks,
} from '../types';

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
 * Serialize a function to a string for storage
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeFunction(fn: (...args: any[]) => any): string {
  return fn.toString();
}

/**
 * Deserialize a function string back to executable function
 *
 * FIXME: Add signature verification before execution
 * This is a security-sensitive operation that executes stored code.
 */
function deserializeExecutor(code: string): ToolExecutor {
  // Extract function body - handles arrow functions and regular functions
  // The stored code is the full function: "(args) => { ... }" or "async (args) => { ... }"
  // We wrap it in parentheses and eval to get the function reference
  try {
    // eslint-disable-next-line no-eval
    return eval(`(${code})`) as ToolExecutor;
  } catch (err) {
    console.error('[Hustle] Failed to deserialize executor:', err);
    // Return a no-op executor that reports the error
    return async () => ({ error: 'Failed to deserialize executor', code });
  }
}

/**
 * Deserialize a hook function string
 *
 * FIXME: Add signature verification before execution
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deserializeHook<T extends (...args: any[]) => any>(code: string): T {
  try {
    // eslint-disable-next-line no-eval
    return eval(`(${code})`) as T;
  } catch (err) {
    console.error('[Hustle] Failed to deserialize hook:', err);
    return (() => {}) as T;
  }
}

/**
 * Serialize a plugin's executors to executorCode strings
 */
function serializePluginTools(
  tools: HustlePlugin['tools'],
  executors: HustlePlugin['executors']
): SerializedToolDefinition[] {
  if (!tools) return [];

  return tools.map((tool) => ({
    ...tool,
    executorCode: executors?.[tool.name]
      ? serializeFunction(executors[tool.name])
      : undefined,
  }));
}

/**
 * Serialize plugin hooks to code strings
 */
function serializeHooks(hooks: PluginHooks | undefined): SerializedHooks | undefined {
  if (!hooks) return undefined;

  const serialized: SerializedHooks = {};

  if (hooks.onRegister) {
    serialized.onRegisterCode = serializeFunction(hooks.onRegister);
  }
  if (hooks.beforeRequest) {
    serialized.beforeRequestCode = serializeFunction(hooks.beforeRequest);
  }
  if (hooks.afterResponse) {
    serialized.afterResponseCode = serializeFunction(hooks.afterResponse);
  }
  if (hooks.onError) {
    serialized.onErrorCode = serializeFunction(hooks.onError);
  }

  return Object.keys(serialized).length > 0 ? serialized : undefined;
}

/**
 * Hydrate a stored plugin - reconstitute executors from executorCode
 *
 * FIXME: Add signature verification before execution
 */
export function hydratePlugin(stored: StoredPlugin): HydratedPlugin {
  // Reconstitute executors from executorCode strings
  const executors: Record<string, ToolExecutor> = {};

  if (stored.tools) {
    for (const tool of stored.tools) {
      if (tool.executorCode) {
        executors[tool.name] = deserializeExecutor(tool.executorCode);
      }
    }
  }

  // Reconstitute hooks from hooksCode strings
  let hooks: PluginHooks | undefined;

  if (stored.hooksCode) {
    hooks = {};
    if (stored.hooksCode.onRegisterCode) {
      hooks.onRegister = deserializeHook(stored.hooksCode.onRegisterCode);
    }
    if (stored.hooksCode.beforeRequestCode) {
      hooks.beforeRequest = deserializeHook(stored.hooksCode.beforeRequestCode);
    }
    if (stored.hooksCode.afterResponseCode) {
      hooks.afterResponse = deserializeHook(stored.hooksCode.afterResponseCode);
    }
    if (stored.hooksCode.onErrorCode) {
      hooks.onError = deserializeHook(stored.hooksCode.onErrorCode);
    }
  }

  return {
    ...stored,
    executors: Object.keys(executors).length > 0 ? executors : undefined,
    hooks,
  };
}

/**
 * Plugin Registry class
 *
 * Manages plugin persistence with:
 * - Global plugin installations (with serialized executorCode)
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
   * Serializes executors as executorCode strings
   */
  private saveInstalledPlugins(plugins: Omit<StoredPlugin, 'enabled'>[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(PLUGINS_KEY, JSON.stringify(plugins));
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

    return installed.map((plugin) => ({
      ...plugin,
      // Default to enabled if no state exists for this instance
      enabled: enabledState[plugin.name] ?? true,
    }));
  }

  /**
   * Register a new plugin (global - available to all instances)
   * Serializes executors as executorCode for persistence
   *
   * @param plugin The plugin to install
   * @param enabled Initial enabled state for this instance (default: true)
   * @param instanceId Instance to set initial enabled state for
   */
  register(plugin: HustlePlugin, enabled = true, instanceId: string = 'default'): void {
    // Add to global installed list with serialized executors
    const installed = this.loadInstalledPlugins();
    const existing = installed.findIndex((p) => p.name === plugin.name);

    const storedPlugin: Omit<StoredPlugin, 'enabled'> = {
      name: plugin.name,
      version: plugin.version,
      description: plugin.description,
      tools: serializePluginTools(plugin.tools, plugin.executors),
      hooksCode: serializeHooks(plugin.hooks),
      installedAt: new Date().toISOString(),
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
    const installed = this.loadInstalledPlugins().filter((p) => p.name !== pluginName);
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
  isRegistered(pluginName: string): boolean {
    return this.loadInstalledPlugins().some((p) => p.name === pluginName);
  }

  /**
   * Get a specific plugin with instance-specific enabled state
   */
  getPlugin(pluginName: string, instanceId: string = 'default'): StoredPlugin | undefined {
    return this.loadFromStorage(instanceId).find((p) => p.name === pluginName);
  }

  /**
   * Get all enabled plugins for an instance (hydrated with executors)
   */
  getEnabledPlugins(instanceId: string = 'default'): HydratedPlugin[] {
    return this.loadFromStorage(instanceId).filter((p) => p.enabled).map(hydratePlugin);
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
    listeners.forEach((cb) => cb(plugins));
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
