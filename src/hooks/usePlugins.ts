'use client';

/**
 * usePlugins Hook
 *
 * Manages plugin state with localStorage persistence and cross-tab sync.
 */

import { useState, useEffect, useCallback } from 'react';
import { pluginRegistry, hydratePlugin } from '../utils/pluginRegistry';
import type { StoredPlugin, HustlePlugin, HydratedPlugin } from '../types';

const STORAGE_KEY = 'hustle-plugins';

/**
 * Return type for usePlugins hook
 */
export interface UsePluginsReturn {
  /** All registered plugins (with enabled state) */
  plugins: StoredPlugin[];
  /** Only enabled plugins (hydrated with executors) */
  enabledPlugins: HydratedPlugin[];
  /** Register a new plugin */
  registerPlugin: (plugin: HustlePlugin) => void;
  /** Unregister a plugin by name */
  unregisterPlugin: (name: string) => void;
  /** Enable a plugin */
  enablePlugin: (name: string) => void;
  /** Disable a plugin */
  disablePlugin: (name: string) => void;
  /** Check if a plugin is registered */
  isRegistered: (name: string) => boolean;
  /** Check if a plugin is enabled */
  isEnabled: (name: string) => boolean;
}

/**
 * Hook for managing plugins
 *
 * @example
 * ```tsx
 * const { plugins, registerPlugin, enabledPlugins } = usePlugins();
 *
 * // Install a plugin
 * registerPlugin(myPlugin);
 *
 * // Check enabled plugins
 * console.log('Active tools:', enabledPlugins.flatMap(p => p.tools));
 * ```
 */
export function usePlugins(): UsePluginsReturn {
  const [plugins, setPlugins] = useState<StoredPlugin[]>([]);

  // Load initial plugins and subscribe to changes
  useEffect(() => {
    // Load initial state
    setPlugins(pluginRegistry.loadFromStorage());

    // Subscribe to registry changes
    const unsubscribe = pluginRegistry.onChange(setPlugins);

    // Listen to storage events for cross-tab sync
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setPlugins(pluginRegistry.loadFromStorage());
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      unsubscribe();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Register a new plugin
  const registerPlugin = useCallback((plugin: HustlePlugin) => {
    pluginRegistry.register(plugin, true);
  }, []);

  // Unregister a plugin
  const unregisterPlugin = useCallback((name: string) => {
    pluginRegistry.unregister(name);
  }, []);

  // Enable a plugin
  const enablePlugin = useCallback((name: string) => {
    pluginRegistry.setEnabled(name, true);
  }, []);

  // Disable a plugin
  const disablePlugin = useCallback((name: string) => {
    pluginRegistry.setEnabled(name, false);
  }, []);

  // Check if plugin is registered
  const isRegistered = useCallback(
    (name: string) => plugins.some(p => p.name === name),
    [plugins]
  );

  // Check if plugin is enabled
  const isEnabled = useCallback(
    (name: string) => plugins.some(p => p.name === name && p.enabled),
    [plugins]
  );

  // Get enabled plugins with hydrated executors
  const enabledPlugins = plugins.filter(p => p.enabled).map(hydratePlugin);

  return {
    plugins,
    enabledPlugins,
    registerPlugin,
    unregisterPlugin,
    enablePlugin,
    disablePlugin,
    isRegistered,
    isEnabled,
  };
}

export default usePlugins;
