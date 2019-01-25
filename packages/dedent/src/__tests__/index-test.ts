/**
 * @copyright Copyright (c) 2019-present Greg Hurrell
 * @license MIT
 */

import dedent from '..';

describe('dedent()', () => {
  describe('called in the context of a tagged template literal', () => {
    it('dedents based on the smallest existing indent', () => {
      expect(dedent`
        {
          foo
        }
      `).toBe('{\n  foo\n}');
    });

    it('ignores empty lines', () => {
      expect(dedent`
        {
          foo
        }

        {
          bar
        }
      `).toBe('{\n  foo\n}\n\n{\n  bar\n}');
    });
  });

  describe('called as a regular function', () => {
    it('dedents based on the smallest existing indent', () => {
      expect(dedent('  def foo\n    1\n  end')).toBe('def foo\n  1\nend');
    });
  });
});
