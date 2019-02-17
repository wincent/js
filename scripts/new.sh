#!/bin/bash
#
# @copyright Copyright (c) 2019-present Greg Hurrell
# @license MIT

set -e

if [ $# -ne 1 ]; then
  echo "error: expected exactly 1 argument (package name)"
  exit 1
fi

if [[ $1 =~ [A-Z] ]]; then
  echo "error: NPM packages may not contain uppercase letters"
  exit 1
fi

BOOL=true
PACKAGE=$1
PACKAGE_DIR="packages/$PACKAGE"
COPYRIGHT_YEAR=$(date '+%Y')

mkdir -p "$PACKAGE_DIR"/{lib,src}
mkdir -p "$PACKAGE_DIR"/src/__tests__

if [ ! -e "$PACKAGE_DIR"/README.md ]; then
  cat > "$PACKAGE_DIR"/README.md <<-HERE
		# @wincent/$PACKAGE
	HERE
fi

if [ ! -e "$PACKAGE_DIR"/lib/.gitignore ]; then
  cat > "$PACKAGE_DIR"/lib/.gitignore <<-HERE
		*
		!/.gitignore
		!/.npmignore
	HERE
fi

if [ ! -e "$PACKAGE_DIR"/lib/.npmignore ]; then
  touch "$PACKAGE_DIR"/lib/.npmignore
fi

if [ ! -d "$PACKAGE_DIR/bin" ]; then
  read -p 'Add a "bin" executable? (y/n) [n] ' BIN
fi

case "${BIN:-n}" in
  y|ye|yes|Y|YE|YES)
    BIN=true
    ;;
  *)
    BIN=false
    ;;
esac

if [ "$BIN" = "true" ]; then
  set +e
  read -r -d '' BINARIES <<-HERE
	  "bin": {
	    "$PACKAGE": "bin/index.js"
	  },
	HERE
  set -e

  mkdir -p "$PACKAGE_DIR/bin"
  if [ ! -e "$PACKAGE_DIR"/bin/index.js ]; then
    cat > "$PACKAGE_DIR"/bin/index.js <<-HERE
			#!/usr/bin/env node
			
			/**
			 * @copyright Copyright (c) 2019-present Greg Hurrell
			 * @license MIT
			 */
			
			require('../lib').main();
		HERE
  fi

  if [ ! -e "$PACKAGE_DIR"/bin/.eslintrc.js ]; then
    cat > "$PACKAGE_DIR"/bin/.eslintrc.js <<-HERE
			module.exports = {
			  env: {
			    browser: false,
			    commonjs: false,
			    es6: false,
			    node: true,
			  },
			  extends: ['eslint:recommended', 'plugin:node/recommended'],
			  parserOptions: {
			    ecmaVersion: 5,
			    ecmaFeatures: {modules: false},
			    sourceType: 'script',
			  },
			  rules: {
			    'node/no-unsupported-features/es-syntax': [
			      'error',
			      {
			        version: '>=6.0.0',
			        ignores: [],
			      },
			    ],
			  },
			};
		HERE
  fi
else
  set +e
  read -r -d '' BINARIES <<-HERE
	  "bin": {},
	HERE
  set -e
fi

if [ ! -e "$PACKAGE_DIR"/package.json ]; then
  cat > "$PACKAGE_DIR"/package.json <<-HERE
		{
		  "name": "@wincent/$PACKAGE",
		  "version": "0.0.1",
		  "description": "A JavaScript package",
		  $BINARIES
		  "main": "lib/index.js",
		  "module": "lib/index.mjs",
		  "types": "lib/index.d.ts",
		  "files": [
		    "lib/index.js",
		    "lib/index.js.flow",
		    "lib/index.mjs",
		    "lib/index.ts"
		  ],
		  "repository": "https://github.com/wincent/js/tree/master/packages/$PACKAGE",
		  "author": "Greg Hurrell <greg@hurrell.net>",
		  "license": "MIT",
		  "private": false,
		  "scripts": {
		    "prepublishOnly": "echo 'Run \`yarn publish $PACKAGE\` from top-level'; false"
		  }
		}
	HERE
fi

NAME=$(echo "$PACKAGE" | sed -r 's/(-)(\w)/\U\2/g')
if [ ! -e "$PACKAGE_DIR"/src/index.ts ]; then
  cat > "$PACKAGE_DIR"/src/index.ts <<-HERE
		/**
		 * @copyright Copyright (c) $COPYRIGHT_YEAR-present Greg Hurrell
		 * @license MIT
		 */
		
		export default function $NAME() {
		  // ...
		}
	HERE
fi

if [ ! -e "$PACKAGE_DIR"/src/index.js.flow ]; then
  cat > "$PACKAGE_DIR"/src/index.js.flow <<-HERE
		/**
		 * @copyright Copyright (c) $COPYRIGHT_YEAR-present Greg Hurrell
		 * @flow strict
		 * @license MIT
		 */
		
		declare export default function $NAME(t: T): T;
	HERE
fi

if [ ! -e "$PACKAGE_DIR"/src/__tests__/index-test.ts ]; then
  cat > "$PACKAGE_DIR"/src/__tests__/index-test.ts <<-HERE
		/**
		 * @copyright Copyright (c) $COPYRIGHT_YEAR-present Greg Hurrell
		 * @license MIT
		 */
		
		import * as _ from '..';
		
		describe('', () => {
		  it('', () => {
		    expect(!!_).toBe(true);
		  });
		});
	HERE
fi

if [ ! -e "$PACKAGE_DIR"/src/__tests__/.eslintrc.js ]; then
  cat > "$PACKAGE_DIR"/src/__tests__/.eslintrc.js <<-HERE
		module.exports = {
		  env: {
		    jest: true,
		  },
		};
	HERE
fi

if [ ! -e "$PACKAGE_DIR"/CHANGELOG.md ]; then
  cat > "$PACKAGE_DIR"/CHANGELOG.md <<-HERE
		# Changes
		
		## 0.0.1 (master)
		
		- Initial release.
	HERE
fi
