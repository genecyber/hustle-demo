import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  pluginRegistry,
  hydratePlugin,
} from '../src/utils/pluginRegistry';
import type { HustlePlugin, StoredPlugin, SerializedToolDefinition } from '../src/types';

// Mock localStorage for Node environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

// Set up localStorage mock
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Sample plugin for testing
const samplePlugin: HustlePlugin = {
  name: 'test-plugin',
  version: '1.0.0',
  description: 'A test plugin',
  tools: [
    {
      name: 'test_tool',
      description: 'A test tool',
      parameters: {
        type: 'object',
        properties: {
          input: { type: 'string', description: 'Test input' },
        },
      },
    },
  ],
  executors: {
    test_tool: async (args) => ({ result: `processed: ${args.input}` }),
  },
  hooks: {
    onRegister: () => console.log('Plugin registered'),
  },
};

describe('pluginRegistry', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('register', () => {
    it('registers a plugin to storage', () => {
      pluginRegistry.register(samplePlugin, true, 'test-instance');

      const plugins = pluginRegistry.loadFromStorage('test-instance');
      expect(plugins).toHaveLength(1);
      expect(plugins[0].name).toBe('test-plugin');
      expect(plugins[0].version).toBe('1.0.0');
      expect(plugins[0].enabled).toBe(true);
    });

    it('updates existing plugin when re-registered', () => {
      pluginRegistry.register(samplePlugin, true, 'test-instance');

      const updatedPlugin = { ...samplePlugin, version: '2.0.0' };
      pluginRegistry.register(updatedPlugin, false, 'test-instance');

      const plugins = pluginRegistry.loadFromStorage('test-instance');
      expect(plugins).toHaveLength(1);
      expect(plugins[0].version).toBe('2.0.0');
      expect(plugins[0].enabled).toBe(false);
    });

    it('uses default instanceId when not provided', () => {
      pluginRegistry.register(samplePlugin);

      const plugins = pluginRegistry.loadFromStorage('default');
      expect(plugins).toHaveLength(1);
    });
  });

  describe('unregister', () => {
    it('removes a plugin from storage', () => {
      pluginRegistry.register(samplePlugin, true, 'test-instance');
      expect(pluginRegistry.loadFromStorage('test-instance')).toHaveLength(1);

      pluginRegistry.unregister('test-plugin', 'test-instance');
      expect(pluginRegistry.loadFromStorage('test-instance')).toHaveLength(0);
    });

    it('does nothing if plugin not found', () => {
      pluginRegistry.register(samplePlugin, true, 'test-instance');
      pluginRegistry.unregister('non-existent', 'test-instance');

      expect(pluginRegistry.loadFromStorage('test-instance')).toHaveLength(1);
    });
  });

  describe('setEnabled', () => {
    it('enables a disabled plugin', () => {
      pluginRegistry.register(samplePlugin, false, 'test-instance');
      expect(pluginRegistry.loadFromStorage('test-instance')[0].enabled).toBe(false);

      pluginRegistry.setEnabled('test-plugin', true, 'test-instance');
      expect(pluginRegistry.loadFromStorage('test-instance')[0].enabled).toBe(true);
    });

    it('disables an enabled plugin', () => {
      pluginRegistry.register(samplePlugin, true, 'test-instance');
      expect(pluginRegistry.loadFromStorage('test-instance')[0].enabled).toBe(true);

      pluginRegistry.setEnabled('test-plugin', false, 'test-instance');
      expect(pluginRegistry.loadFromStorage('test-instance')[0].enabled).toBe(false);
    });
  });

  describe('isRegistered', () => {
    it('returns true for registered plugin', () => {
      pluginRegistry.register(samplePlugin, true, 'test-instance');
      expect(pluginRegistry.isRegistered('test-plugin', 'test-instance')).toBe(true);
    });

    it('returns false for unregistered plugin', () => {
      expect(pluginRegistry.isRegistered('non-existent', 'test-instance')).toBe(false);
    });
  });

  describe('getPlugin', () => {
    it('returns the plugin if found', () => {
      pluginRegistry.register(samplePlugin, true, 'test-instance');
      const plugin = pluginRegistry.getPlugin('test-plugin', 'test-instance');

      expect(plugin).toBeDefined();
      expect(plugin?.name).toBe('test-plugin');
    });

    it('returns undefined if not found', () => {
      const plugin = pluginRegistry.getPlugin('non-existent', 'test-instance');
      expect(plugin).toBeUndefined();
    });
  });

  describe('getEnabledPlugins', () => {
    it('returns only enabled plugins', () => {
      const plugin2: HustlePlugin = { ...samplePlugin, name: 'test-plugin-2' };

      pluginRegistry.register(samplePlugin, true, 'test-instance');
      pluginRegistry.register(plugin2, false, 'test-instance');

      const enabled = pluginRegistry.getEnabledPlugins('test-instance');
      expect(enabled).toHaveLength(1);
      expect(enabled[0].name).toBe('test-plugin');
    });
  });

  describe('global plugins with instance-scoped enabled state', () => {
    it('plugins are globally shared across instances', () => {
      pluginRegistry.register(samplePlugin, true, 'instance-a');

      const plugin2: HustlePlugin = { ...samplePlugin, name: 'plugin-b' };
      pluginRegistry.register(plugin2, true, 'instance-b');

      // Both instances see both plugins (global install)
      expect(pluginRegistry.loadFromStorage('instance-a')).toHaveLength(2);
      expect(pluginRegistry.loadFromStorage('instance-b')).toHaveLength(2);
    });

    it('enabled state is instance-scoped', () => {
      pluginRegistry.register(samplePlugin, true, 'instance-a');

      // Disable in instance-b
      pluginRegistry.setEnabled('test-plugin', false, 'instance-b');

      // instance-a still has it enabled
      expect(pluginRegistry.loadFromStorage('instance-a')[0].enabled).toBe(true);

      // instance-b has it disabled
      expect(pluginRegistry.loadFromStorage('instance-b')[0].enabled).toBe(false);
    });

    it('clear only affects enabled state, not global plugins', () => {
      pluginRegistry.register(samplePlugin, true, 'instance-a');
      pluginRegistry.setEnabled('test-plugin', false, 'instance-a');

      // Clear instance-a's enabled state
      pluginRegistry.clear('instance-a');

      // Plugin still exists (global), enabled state reset to default (true)
      const plugins = pluginRegistry.loadFromStorage('instance-a');
      expect(plugins).toHaveLength(1);
      expect(plugins[0].enabled).toBe(true);
    });

    it('unregister removes plugin globally', () => {
      pluginRegistry.register(samplePlugin, true, 'instance-a');

      // Both instances see it
      expect(pluginRegistry.loadFromStorage('instance-a')).toHaveLength(1);
      expect(pluginRegistry.loadFromStorage('instance-b')).toHaveLength(1);

      // Unregister from instance-a (removes globally)
      pluginRegistry.unregister('test-plugin', 'instance-a');

      // Gone from both instances
      expect(pluginRegistry.loadFromStorage('instance-a')).toHaveLength(0);
      expect(pluginRegistry.loadFromStorage('instance-b')).toHaveLength(0);
    });
  });

  describe('onChange', () => {
    it('notifies listeners when plugins change', () => {
      const callback = vi.fn();
      const unsubscribe = pluginRegistry.onChange(callback, 'test-instance');

      pluginRegistry.register(samplePlugin, true, 'test-instance');

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ name: 'test-plugin' }),
      ]));

      unsubscribe();
    });

    it('unsubscribe stops notifications', () => {
      const callback = vi.fn();
      const unsubscribe = pluginRegistry.onChange(callback, 'test-instance');

      unsubscribe();
      pluginRegistry.register(samplePlugin, true, 'test-instance');

      expect(callback).not.toHaveBeenCalled();
    });

    it('only notifies listeners for matching instanceId', () => {
      const callbackA = vi.fn();
      const callbackB = vi.fn();

      pluginRegistry.onChange(callbackA, 'instance-a');
      pluginRegistry.onChange(callbackB, 'instance-b');

      pluginRegistry.register(samplePlugin, true, 'instance-a');

      expect(callbackA).toHaveBeenCalledTimes(1);
      expect(callbackB).not.toHaveBeenCalled();
    });
  });
});

describe('hydratePlugin', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('restores executors from executorCode strings', () => {
    // Create a stored plugin with serialized executorCode
    const toolsWithCode: SerializedToolDefinition[] = [
      {
        name: 'test_tool',
        description: 'A test tool',
        parameters: { type: 'object', properties: {} },
        executorCode: 'async (args) => ({ result: args.input })',
      },
    ];

    const stored: StoredPlugin = {
      name: 'test-plugin',
      version: '1.0.0',
      tools: toolsWithCode,
      enabled: true,
    };

    const hydrated = hydratePlugin(stored);

    expect(hydrated.executors).toBeDefined();
    expect(hydrated.executors?.test_tool).toBeDefined();
    expect(typeof hydrated.executors?.test_tool).toBe('function');
  });

  it('restores hooks from hooksCode strings', () => {
    const stored: StoredPlugin = {
      name: 'hook-plugin',
      version: '1.0.0',
      tools: [],
      enabled: true,
      hooksCode: {
        onRegisterCode: '() => console.log("registered")',
        beforeRequestCode: '(req) => req',
      },
    };

    const hydrated = hydratePlugin(stored);

    expect(hydrated.hooks).toBeDefined();
    expect(hydrated.hooks?.onRegister).toBeDefined();
    expect(hydrated.hooks?.beforeRequest).toBeDefined();
    expect(typeof hydrated.hooks?.onRegister).toBe('function');
    expect(typeof hydrated.hooks?.beforeRequest).toBe('function');
  });

  it('executes reconstituted executor correctly', async () => {
    const toolsWithCode: SerializedToolDefinition[] = [
      {
        name: 'echo_tool',
        description: 'Echoes input',
        parameters: { type: 'object', properties: {} },
        executorCode: 'async (args) => ({ echoed: args.message })',
      },
    ];

    const stored: StoredPlugin = {
      name: 'echo-plugin',
      version: '1.0.0',
      tools: toolsWithCode,
      enabled: true,
    };

    const hydrated = hydratePlugin(stored);
    const result = await hydrated.executors?.echo_tool({ message: 'hello' });

    expect(result).toEqual({ echoed: 'hello' });
  });

  it('returns plugin without executors when no executorCode present', () => {
    const stored: StoredPlugin = {
      name: 'no-code-plugin',
      version: '1.0.0',
      tools: [
        {
          name: 'empty_tool',
          description: 'No executor',
          parameters: { type: 'object', properties: {} },
          // No executorCode
        },
      ],
      enabled: true,
    };

    const hydrated = hydratePlugin(stored);

    // Should not have executors for tools without executorCode
    expect(hydrated.executors).toBeUndefined();
    expect(hydrated.hooks).toBeUndefined();
  });

  it('handles invalid executorCode gracefully', () => {
    const toolsWithBadCode: SerializedToolDefinition[] = [
      {
        name: 'bad_tool',
        description: 'Invalid code',
        parameters: { type: 'object', properties: {} },
        executorCode: 'this is not valid javascript {{{{',
      },
    ];

    const stored: StoredPlugin = {
      name: 'bad-plugin',
      version: '1.0.0',
      tools: toolsWithBadCode,
      enabled: true,
    };

    // Should not throw, returns error executor
    const hydrated = hydratePlugin(stored);
    expect(hydrated.executors).toBeDefined();
    expect(hydrated.executors?.bad_tool).toBeDefined();
  });
});

describe('plugin serialization roundtrip', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('serializes and deserializes plugin executors correctly', async () => {
    // Register a plugin with actual executor functions
    pluginRegistry.register(samplePlugin, true, 'roundtrip-test');

    // Load it back from storage
    const loaded = pluginRegistry.getPlugin('test-plugin', 'roundtrip-test');
    expect(loaded).toBeDefined();

    // Hydrate to get executable functions back
    const hydrated = hydratePlugin(loaded!);

    expect(hydrated.executors).toBeDefined();
    expect(hydrated.executors?.test_tool).toBeDefined();

    // Execute the reconstituted function
    const result = await hydrated.executors?.test_tool({ input: 'hello' });
    expect(result).toEqual({ result: 'processed: hello' });
  });

  it('serializes and deserializes plugin hooks correctly', async () => {
    // Register a plugin with hooks
    pluginRegistry.register(samplePlugin, true, 'hook-roundtrip-test');

    // Load and hydrate
    const loaded = pluginRegistry.getPlugin('test-plugin', 'hook-roundtrip-test');
    const hydrated = hydratePlugin(loaded!);

    expect(hydrated.hooks).toBeDefined();
    expect(hydrated.hooks?.onRegister).toBeDefined();

    // Should be able to call the hook without error
    expect(() => hydrated.hooks?.onRegister?.()).not.toThrow();
  });
});
