/**
 * @copyright Copyright (c) 2019-present Greg Hurrell
 * @license MIT
 */

// Prepared regular expressions to maybe eek out a couple % more perf:
const ampersandRegExp = /&/g;
const lessThanRegExp = /</g;
const greaterThanRegExp = />/g;
const doubleQuoteRegExp = /"/g;
const singleQuoteRegExp = /'/g;

export default function escapeHTML(html: string): string {
  return html
    .replace(ampersandRegExp, '&amp;')
    .replace(lessThanRegExp, '&lt;')
    .replace(greaterThanRegExp, '&gt;')
    .replace(doubleQuoteRegExp, '&quot;')
    .replace(singleQuoteRegExp, '&#39;');
}
