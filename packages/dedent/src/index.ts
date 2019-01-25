/**
 * @copyright Copyright (c) 2019-present Greg Hurrell
 * @license MIT
 */

/**
 * Trims leading and trailing whitespace from the `input` string and
 * reduces the indent level back to column 0.
 *
 * @overload
 */
export default function dedent(input: string): string;

/**
 * Tagged template literal function that trims leading and trailing whitespace
 * and reduces the indent level back to column 0.
 *
 * @overload
 */
export default function dedent(
  strings: TemplateStringsArray,
  ...interpolations: unknown[]
): string;

export default function dedent(
  stringOrStrings: any,
  ...maybeInterpolations: any
) {
  let input;

  if (Array.isArray(stringOrStrings)) {
    // Insert interpolations in template.
    input = stringOrStrings.reduce((acc, string, i) => {
      if (i < maybeInterpolations.length) {
        return acc + string + String(maybeInterpolations[i]);
      } else {
        return acc + string;
      }
    }, '');
  } else {
    input = stringOrStrings;
  }

  // Collapse totally blank lines to empty strings.
  const lines = input.split('\n').map((line: string) => {
    if (line.match(/^\s+$/)) {
      return '';
    } else {
      return line;
    }
  });

  // Find minimum indent (ignoring empty lines).
  const minimum = lines.reduce((acc: number, line: string) => {
    const indent = line.match(/^\s+/);
    if (indent) {
      const length = indent[0].length;
      return Math.min(acc, length);
    }
    return acc;
  }, Infinity);

  // Strip out minimum indent from every line.
  const dedented = isFinite(minimum)
    ? lines.map((line: string) =>
        line.replace(new RegExp(`^${' '.repeat(minimum)}`, 'g'), ''),
      )
    : lines;

  // Trim first and last line if empty.
  if (dedented[0] === '') {
    dedented.shift();
  }
  if (dedented[dedented.length - 1] === '') {
    dedented.pop();
  }
  return dedented.join('\n');
}
