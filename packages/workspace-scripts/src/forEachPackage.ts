/**
 * @copyright Copyright (c) 2019-present Greg Hurrell
 * @license MIT
 */

import {readdir} from 'fs';
import {promisify} from 'util';
import getPackageConfig, {Config} from './getPackageConfig';
//import {default as getPackageConfig, Config} from './getPackageConfig';

const readdirAsync = promisify(readdir);

type Callback = (name: string, config: Config) => void;

/**
 * Execute `callback` in the context of each package in the monorepo.
 *
 * `callback` will be invoked with the package name and its config (as read from
 * the "package.json" file).
 */
export default async function forEachPackage(callback: Callback) {
  const packages = await readdirAsync('packages', {withFileTypes: true});
  for (const pkg of packages) {
    if (pkg.isDirectory()) {
      const name = pkg.name.toString();
      const config = getPackageConfig(name);
      await callback(name, config);
    }
  }
}
