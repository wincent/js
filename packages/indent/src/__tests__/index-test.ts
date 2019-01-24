/**
 * @copyright Copyright (c) 2019-present Greg Hurrell
 * @license MIT
 */

import indent from '..';

describe('indent()', () => {
  it('indents two spaces by default', () => {
    expect(indent('{\n  foo\n}')).toBe('  {\n    foo\n  }');
  });

  it('indents by a custom width', () => {
    expect(indent('{\n  foo\n}', 4)).toBe('    {\n      foo\n    }');
  });
});
