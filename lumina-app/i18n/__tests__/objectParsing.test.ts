import { describe, expect, it } from '@jest/globals';

import { buildKeysObject, extractTemplateVars, findTemplateParameters, flattenKeys } from '../objectParsing.ts';
import { NestedStringRecord } from '../translation-schema.ts';

describe('objectParsing', () => {
  describe('buildKeysObject', () => {
    it('should build keys object for flat structure', () => {
      const input = {
        welcome: 'Welcome message',
        goodbye: 'Goodbye message',
      };

      const result = buildKeysObject(input);

      expect(result).toEqual({
        welcome: 'welcome',
        goodbye: 'goodbye',
      });
    });

    it('should build keys object for nested structure', () => {
      const input = {
        auth: {
          login: 'Login',
          logout: 'Logout',
        },
        errors: {
          notFound: 'Not found',
        },
      };

      const result = buildKeysObject(input);

      expect(result).toEqual({
        auth: {
          login: 'auth.login',
          logout: 'auth.logout',
        },
        errors: {
          notFound: 'errors.notFound',
        },
      });
    });

    it('should build keys object for deeply nested structure', () => {
      const input = {
        user: {
          profile: {
            settings: {
              privacy: 'Privacy settings',
            },
          },
        },
      };

      const result = buildKeysObject(input);

      expect(result).toEqual({
        user: {
          profile: {
            settings: {
              privacy: 'user.profile.settings.privacy',
            },
          },
        },
      });
    });

    it('should handle empty object', () => {
      const result = buildKeysObject({});
      expect(result).toEqual({});
    });

    it('should respect currentPath parameter', () => {
      const input = {
        name: 'Name',
        age: 'Age',
      };

      const result = buildKeysObject(input, 'user');

      expect(result).toEqual({
        name: 'user.name',
        age: 'user.age',
      });
    });

    it('should handle mixed nesting levels', () => {
      const input = {
        flatKey: 'value',
        nested: {
          deepKey: 'value',
        },
      };

      const result = buildKeysObject(input);

      expect(result).toEqual({
        flatKey: 'flatKey',
        nested: {
          deepKey: 'nested.deepKey',
        },
      });
    });
  });

  describe('extractTemplateVars', () => {
    it('should extract single template variable', () => {
      const result = extractTemplateVars('Hello {{name}}');
      expect(result).toEqual(['name']);
    });

    it('should extract multiple template variables', () => {
      const result = extractTemplateVars('Hello {{name}}, you have {{count}} items');
      expect(result).toEqual(['name', 'count']);
    });

    it('should return empty array when no template variables', () => {
      const result = extractTemplateVars('Hello world');
      expect(result).toEqual([]);
    });

    it('should return empty array for empty string', () => {
      const result = extractTemplateVars('');
      expect(result).toEqual([]);
    });

    it('should trim whitespace from template variables', () => {
      const result = extractTemplateVars('Hello {{ name }}, {{ count }}');
      expect(result).toEqual(['name', 'count']);
    });

    it('should handle template variables with underscores and numbers', () => {
      const result = extractTemplateVars('{{user_name}} {{item_1}}');
      expect(result).toEqual(['user_name', 'item_1']);
    });

    it('should handle multiple occurrences of same variable', () => {
      const result = extractTemplateVars('{{name}} and {{name}} again');
      expect(result).toEqual(['name', 'name']);
    });

    it('should not match malformed templates', () => {
      const result = extractTemplateVars('{name} {{name} {{name');
      expect(result).toEqual([]);
    });

    it('should handle template variables at start and end', () => {
      const result = extractTemplateVars('{{start}} middle {{end}}');
      expect(result).toEqual(['start', 'end']);
    });
  });

  describe('findTemplateParameters', () => {
    describe('Basic functionality', () => {
      it('should handle empty object', () => {
        expect(findTemplateParameters({})).toEqual({});
      });

      it('should find template variable in simple object', () => {
        const input = {
          message: 'Hello {{name}}',
        };
        expect(findTemplateParameters(input)).toEqual({
          message: ['name'],
        });
      });

      it('should find multiple template variables in one string', () => {
        const input = {
          message: 'Hello {{name}}, you have {{count}} messages',
        };
        expect(findTemplateParameters(input)).toEqual({
          message: ['name', 'count'],
        });
      });

      it('should return empty object when no template variables found', () => {
        const input = {
          message: 'Hello world',
          title: 'Welcome',
        };
        expect(findTemplateParameters(input)).toEqual({});
      });
    });

    describe('Nested objects', () => {
      it('should find template variables in nested objects', () => {
        const input = {
          auth: {
            welcome: 'Hello {{name}}',
            logout: 'Goodbye {{user}}',
          },
        };
        expect(findTemplateParameters(input)).toEqual({
          'auth.welcome': ['name'],
          'auth.logout': ['user'],
        });
      });

      it('should handle deeply nested objects', () => {
        const input = {
          app: {
            user: {
              profile: {
                greeting: 'Welcome {{username}}',
              },
            },
          },
        };
        expect(findTemplateParameters(input)).toEqual({
          'app.user.profile.greeting': ['username'],
        });
      });

      it('should handle mixed nested structures', () => {
        const input = {
          auth: {
            title: 'Login',
            message: 'Welcome {{user}}',
          },
          common: {
            error: 'Error: {{message}}',
          },
        };
        expect(findTemplateParameters(input)).toEqual({
          'auth.message': ['user'],
          'common.error': ['message'],
        });
      });
    });
  });

  describe('flattenKeys', () => {
    it('should flatten flat object', () => {
      const input: NestedStringRecord = {
        welcome: 'welcome',
        goodbye: 'goodbye',
      };

      const result = flattenKeys(input);

      expect(result).toEqual({
        welcome: 'welcome',
        goodbye: 'goodbye',
      });
    });

    it('should flatten nested object', () => {
      const input: NestedStringRecord = {
        auth: {
          login: 'auth.login',
          logout: 'auth.logout',
        },
        errors: {
          notFound: 'errors.notFound',
        },
      };

      const result = flattenKeys(input);

      expect(result).toEqual({
        'auth.login': 'auth.login',
        'auth.logout': 'auth.logout',
        'errors.notFound': 'errors.notFound',
      });
    });

    it('should flatten deeply nested object', () => {
      const input: NestedStringRecord = {
        user: {
          profile: {
            settings: {
              privacy: 'user.profile.settings.privacy',
            },
          },
        },
      };

      const result = flattenKeys(input);

      expect(result).toEqual({
        'user.profile.settings.privacy': 'user.profile.settings.privacy',
      });
    });

    it('should handle empty object', () => {
      const result = flattenKeys({});
      expect(result).toEqual({});
    });

    it('should respect prefix parameter', () => {
      const input: NestedStringRecord = {
        name: 'name',
        age: 'age',
      };

      const result = flattenKeys(input, 'user');

      expect(result).toEqual({
        'user.name': 'name',
        'user.age': 'age',
      });
    });

    it('should flatten mixed nesting levels', () => {
      const input: NestedStringRecord = {
        flatKey: 'flatKey',
        nested: {
          deepKey: 'nested.deepKey',
        },
      };

      const result = flattenKeys(input);

      expect(result).toEqual({
        flatKey: 'flatKey',
        'nested.deepKey': 'nested.deepKey',
      });
    });

    it('should handle nested prefix', () => {
      const input: NestedStringRecord = {
        settings: {
          theme: 'settings.theme',
        },
      };

      const result = flattenKeys(input, 'user.profile');

      expect(result).toEqual({
        'user.profile.settings.theme': 'settings.theme',
      });
    });
  });
});
