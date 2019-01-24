/**
 * @copyright Copyright (c) 2019-present Greg Hurrell
 * @license MIT
 */

/**
 * Indent every line (except for empty lines) by `count` spaces.
 */
export default function indent(text: string, count: number = 2) {
  return text
    .split('\n')
    .map(line => {
      if (line.length) {
        return `${' '.repeat(count)}${line}`;
      } else {
        return line;
      }
    })
    .join('\n');
}
