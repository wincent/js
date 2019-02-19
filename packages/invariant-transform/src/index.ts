/**
 * @copyright Copyright (c) 2019-present Greg Hurrell
 * @license MIT
 */

import * as babel from '@babel/core';
import {Node, NodePath} from '@babel/traverse';

import {types, PluginObj, Visitor} from 'babel__core';

type CallExpression = types.CallExpression;

type VisitorState = {
  opts: {
    strip?: boolean,
  },
};

/**
 * In development, pass `{strip: false}` to transform:
 *
 *    invariant(condition, 'Format %s', 'string');
 *
 * into:
 *
 *    if (!condition) {
 *      invariant(false, 'Format %s', 'string');
 *    }
 *
 * to prevent the unnecessary eager evaluation of the format string arguments.
 *
 * In production, pass `{strip: true}` to transform the same into:
 *
 *    if (!condition) {
 *      throw new Error('Invariant failed');
 *    }
 */
export default function transform(): PluginObj<VisitorState> {
  const {types: t} = babel;
  const transformed = new Set<Node>();
  const visitor: Visitor<VisitorState> = {
    CallExpression: {
      exit(path: NodePath<CallExpression>, state: VisitorState) {
        if (transformed.has(path.node)) {
          return;
        }
        if (path.get('callee').isIdentifier({name: 'invariant'})) {
          const argument = path.node.arguments[0];
          if (t.isExpression(argument)) {
            const condition = t.unaryExpression('!', argument);
            const call = t.callExpression(t.identifier('invariant'), [
              t.booleanLiteral(false),
              ...path.node.arguments.slice(1),
            ]);
            transformed.add(call);

            // If we just replace the CallExpression, Babel will wrap our
            // `ifStatement` in an IIFE or turn it into a ternary in order to
            // make it safe to use in expression position; avoid the
            // clutter by replacing parent instead, if it is a statement.
            const replace = path.parentPath.isStatement()
              ? path.parentPath
              : path;

            if (state.opts.strip) {
              // Production-style.
              replace.replaceWith(
                t.ifStatement(
                  condition,
                  t.blockStatement([
                    t.throwStatement(
                      t.newExpression(t.identifier('Error'), [
                        t.stringLiteral('Invariant failed'),
                      ]),
                    ),
                  ]),
                ),
              );
            } else {
              // Development style.
              replace.replaceWith(
                t.ifStatement(
                  condition,
                  t.blockStatement([t.expressionStatement(call)]),
                ),
              );
            }
          }
        }
      },
    },
  };
  return {visitor};
};
