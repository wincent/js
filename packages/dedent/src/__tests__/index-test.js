/**
 * @flow strict
 */

import dedent from '..';

describe('dedent()', () => {
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
