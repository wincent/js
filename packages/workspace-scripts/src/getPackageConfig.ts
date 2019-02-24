/**
 * @copyright Copyright (c) 2019-present Greg Hurrell
 * @license MIT
 */

import {join, resolve} from 'path';

export interface Config {
  dependencies?: {
    [name: string]: string;
  };
  devDependencies?: {
    [name: string]: string;
  };
  peerDependencies?: {
    [name: string]: string;
  };
  version: string;
}

export default function getPackageConfig(name: string): Config {
  return require(resolve(join('packages', name, 'package.json')));
}
