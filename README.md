# js

> An exploration of using a monorepo for developing a collection of (at most loosely) related NPM packages.

This is an experiment aimed at exploring the trade-offs involved in moving a bunch of small NPM modules into a single repo to reduce the overhead of managing many individual repos. Unlike some well-known monorepo examples (Babel, Jest, React and so on) which all form cohesive projects, the only thing the packages in this repo have in common is their authorship.

## Advantages

* No need to create mirrors at git.wincent.com, github.com, gitlab.com and bitbucket.org every time I want to extract a tiny package containing a handful of lines of functionalitly.
* Shared development dependencies provide a single place to keep Babel, Flow, Prettier, ESLint, Jest etc configured and up-to-date.
* Using scoped package names makes it easy to allocate names that are both unique and descriptive.
* Colocation of packages makes some types of cross-package verification easy (a couple of early examples: [missing dependency check](https://github.com/wincent/js/commit/02e2eb280db050e523d2a3e065a93f0ef221fb82), [mismatched version check, unwanted dev dependency check](https://github.com/wincent/js/commit/c7147c86b055ab1ecc57a24b29cb7ef274dc69de)).

## Disadvantages

* No separate issue tracker per package (will use labels instead).
* Packages don't have a strong connection that ties them together into a cohesive whole.
* May be some kinks to iron out with respect to using Flow, Jest, and other tools that may not expect to be in monorepo (example: [module resolution tweaks](https://github.com/wincent/js/commit/fe2d7318dc94354306331eb9f5b0d191a831fd9a)).

## Package listing

| Package       | Description |
| ------------- | ------------- |
| [@wincent/debounce](https://github.com/wincent/js/tree/master/packages/debounce) | Simple debounce implementation |
| [@wincent/dedent](https://github.com/wincent/js/tree/master/packages/dedent) | Dedenting utility |
| [@wincent/delay](https://github.com/wincent/js/tree/master/packages/delay) | A function that returns a promise that resolves after a delay |
| [@wincent/escapeHTML](https://github.com/wincent/js/tree/master/packages/escapeHTML) | Escapes unsafe characters in HTML |
| [@wincent/indent](https://github.com/wincent/js/tree/master/packages/indent) | Indenting utility |
| [@wincent/isObject](https://github.com/wincent/js/tree/master/packages/isObject) | Determines whether a value is an object |
| [@wincent/nullthrows](https://github.com/wincent/js/tree/master/packages/nullthrows) | Fail fast in the face of an unexpected null value |
| [@wincent/stableStringify](https://github.com/wincent/js/tree/master/packages/stableStringify) | Like JSON.stringify but produces stable output regardless of insertion order |

This table may not necessarily stay up to date, so please check [the packages directory](https://github.com/wincent/js/tree/master/packages).

## License

Copyright (c) 2019-present Greg Hurrell

### MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.