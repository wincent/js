/**
 * @copyright Copyright (c) 2019-present Greg Hurrell
 * @license MIT
 */

import * as babel from '@babel/core';
import {default as transform, Options} from '..';

import nullthrows from '@wincent/nullthrows';

describe('babel-plugin-invariant-transform', () => {
  let code: string | null | undefined;

  async function runTransform(source: string, options: Options = {}) {
    const result = await new Promise<babel.BabelFileResult | null>(
      (resolve, reject) => {
        babel.transform(
          source,
          {
            presets: [],
            plugins: [[transform, options]],
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          },
        );
      },
    );
    return nullthrows(result).code;
  }

  describe('when "strip" is true', () => {
    beforeEach(async () => {
      code = await runTransform(`invariant(x, 'message');`, {strip: true});
    });

    it('hoists the conditional into an `if` statement', () => {
      expect(code).toContain('if (!x)');
    });

    it('strips the invariant() call', () => {
      expect(code).not.toContain('invariant(');
    });

    it('throws an error', () => {
      expect(code).toContain(`throw new Error("Invariant failed");`);
    });
  });

  describe('when "strip" is not true', () => {
    beforeEach(async () => {
      code = await runTransform(`invariant(x, 'message');`);
    });

    it('hoists the conditional into an `if` statement', () => {
      expect(code).toContain('if (!x)');
    });

    it('calls the invariant() function with `false`', () => {
      expect(code).toContain(`invariant(false, 'message')`);
    });
  });
});
