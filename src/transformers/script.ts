import { parseSync, transformSync } from '@babel/core';
import type { NodePath, PluginObj, types as BabelTypes } from '@babel/core';
import { API_RENAME_MAP, CONTEXT_MANAGERS, PARAM_RENAME_MAP } from '../rules';
import type { CalledApis } from '../types';

type CallNode = BabelTypes.CallExpression | BabelTypes.OptionalCallExpression;
type MemberExpression = BabelTypes.MemberExpression | BabelTypes.OptionalMemberExpression;

function isMemberExpression(node: BabelTypes.Node): node is MemberExpression {
  return node.type === 'MemberExpression' || node.type === 'OptionalMemberExpression';
}

function isIdentifier(node: BabelTypes.Node | undefined | null): node is BabelTypes.Identifier {
  return node?.type === 'Identifier';
}

function findAssignedTargetName(node: BabelTypes.Node): string | undefined {
  let targetName: string | undefined;
  const visit = (current: BabelTypes.Node | null | undefined): void => {
    if (!current || targetName) return;
    if (
      current.type === 'AssignmentExpression' &&
      isMemberExpression(current.left) &&
      isIdentifier(current.left.object)
    ) {
      targetName = current.left.object.name;
      return;
    }
    if (current.type === 'BlockStatement') {
      for (const stmt of current.body) visit(stmt);
    } else if (current.type === 'ExpressionStatement') {
      visit(current.expression);
    } else if (current.type === 'IfStatement') {
      visit(current.consequent);
      visit(current.alternate);
    } else if (current.type === 'LogicalExpression') {
      visit(current.left);
      visit(current.right);
    }
  };
  visit(node);
  return targetName;
}
function patchPageComponentOptions(opts: Record<string, any>): Record<string, any> {
  return opts;
}

const MACLE_PAGE_PATCH_FN = `(function(opts) {
  if (opts && (!opts.data || typeof opts.data !== "object")) {
    opts.data = {};
  }
  if (opts && opts.methods && typeof opts.methods.onLoad === "function" && opts.lifetimes && typeof opts.lifetimes.attached === "function") {
    var origOnLoad = opts.methods.onLoad;
    var origOnReady = opts.methods.onReady;
    var origOnUnload = opts.methods.onUnload;
    var attached = opts.lifetimes.attached;
    var ready = opts.lifetimes.ready;
    var detached = opts.lifetimes.detached;
    opts.methods.onLoad = function(options) {
      if (!this.$vm) {
        this.properties = {};
        this.triggerEvent = function() {};
        this.selectAllComponents = this.selectAllComponents || function() { return []; };
        attached.call(this);
      }
      return origOnLoad.call(this, options);
    };
    if (typeof ready === "function") {
      opts.methods.onReady = function() {
        if (this.$vm && !this.__macleReadyCalled) {
          this.__macleReadyCalled = true;
          ready.call(this);
        }
        return origOnReady ? origOnReady.call(this) : undefined;
      };
    }
    if (typeof detached === "function") {
      opts.methods.onUnload = function() {
        if (this.$vm && !this.__macleDetachedCalled) {
          this.__macleDetachedCalled = true;
          detached.call(this);
        }
        return origOnUnload ? origOnUnload.call(this) : undefined;
      };
    }
    opts.onLoad = opts.methods.onLoad;
    if (typeof opts.methods.onReady === "function") opts.onReady = opts.methods.onReady;
    if (typeof opts.methods.onUnload === "function") opts.onUnload = opts.methods.onUnload;
    for (var k in opts.methods) {
      if (typeof opts.methods[k] === "function" && typeof opts[k] !== "function") {
        opts[k] = opts.methods[k];
      }
    }
    return Page(opts);
  }
  return Component(opts);
})`;

function getManagerPrefix(node: BabelTypes.Node | undefined | null): string | undefined {
  if (!node || node.type !== 'CallExpression' || !isMemberExpression(node.callee)) return undefined;
  if (!isIdentifier(node.callee.object) || node.callee.object.name !== 'wx') return undefined;
  if (!isIdentifier(node.callee.property)) return undefined;
  return CONTEXT_MANAGERS[node.callee.property.name];
}

function transformJsToMacle(code: unknown, filename = 'unknown.js'): { code: string; calledApis: CalledApis } {
  const source = typeof code === 'string' ? code : '';
  const calledApis: CalledApis = Object.create(null) as CalledApis;
  const trackedInstances: Record<string, string> = Object.create(null) as Record<string, string>;

  try {
    const result = transformSync(source, {
      filename,
      compact: false,
      plugins: [
        (): PluginObj => {
          const inspectCall = (astPath: NodePath<CallNode>): void => {
            const { callee, arguments: args } = astPath.node;
            const member = callee;
            if (!isMemberExpression(member) || !isIdentifier(member.object)) return;

            const objName = member.object.name;
            const sourceLine = astPath.node.loc?.start.line;
            let propName: string | undefined;
            if (isIdentifier(member.property) && !member.computed) {
              propName = member.property.name;
            } else if (member.computed && member.property.type === 'StringLiteral') {
              propName = member.property.value;
            }
            if (!propName) return;

            if (objName === 'wx' && propName === 'createPage') return;

            let managerPrefix = trackedInstances[objName];
            const binding = astPath.scope.getBinding(objName);
            if (!managerPrefix && binding) {
              const bindingNode = binding.path.node;
              if (bindingNode.type === 'VariableDeclarator') {
                const prefix = getManagerPrefix(bindingNode.init);
                if (prefix) managerPrefix = prefix;
              }
              if (managerPrefix) trackedInstances[objName] = managerPrefix;
            }
            if (!managerPrefix && binding) {
              for (const violation of binding.constantViolations) {
                const violationNode = violation.node;
                if (
                  violationNode.type !== 'AssignmentExpression' ||
                  !isIdentifier(violationNode.left) ||
                  violationNode.left.name !== objName
                ) {
                  continue;
                }
                const prefix = getManagerPrefix(violationNode.right);
                if (prefix) {
                  managerPrefix = prefix;
                  break;
                }
              }
              if (managerPrefix) trackedInstances[objName] = managerPrefix;
            }

            if (managerPrefix) {
              const fullApiName = `${managerPrefix}.${propName}`;
              calledApis[fullApiName] = calledApis[fullApiName] || { props: [], lines: [] };
              if (sourceLine && !calledApis[fullApiName].lines?.includes(sourceLine)) {
                calledApis[fullApiName].lines?.push(sourceLine);
              }
              return;
            }

            if (objName !== 'wx' || astPath.scope.hasBinding('wx')) return;
            calledApis[propName] = calledApis[propName] || { props: [], lines: [] };
            if (sourceLine && !calledApis[propName].lines?.includes(sourceLine)) {
              calledApis[propName].lines?.push(sourceLine);
            }

            const paramRules = PARAM_RENAME_MAP[propName];
            const options = args[0];
            if (options?.type === 'ObjectExpression') {
              for (const prop of options.properties) {
                if (prop.type !== 'ObjectProperty') continue;

                let originalKey: string | undefined;
                if (!prop.computed && isIdentifier(prop.key)) {
                  originalKey = prop.key.name;
                } else if (prop.key.type === 'StringLiteral' || prop.key.type === 'NumericLiteral') {
                  originalKey = String(prop.key.value);
                }
                if (!originalKey) continue;

                calledApis[propName].props.push(originalKey);
                const replacement = paramRules?.[originalKey];
                if (!replacement) continue;
                if (isIdentifier(prop.key)) prop.key.name = replacement;
                else if (prop.key.type === 'StringLiteral') prop.key.value = replacement;
              }
            }

            const renamedApi = API_RENAME_MAP[propName];
            if (!renamedApi) return;
            if (member.computed && member.property.type === 'StringLiteral') {
              member.property.value = renamedApi;
            } else if (isIdentifier(member.property)) {
              member.property.name = renamedApi;
            }
          };

          return {
            visitor: {
              ForInStatement(astPath: NodePath<BabelTypes.ForInStatement>) {
                const { right, body } = astPath.node;
                if (!isIdentifier(right) || right.name !== 'wx' || astPath.scope.hasBinding('wx')) {
                  return;
                }
                const targetName = findAssignedTargetName(body);
                if (!targetName) return;
                const replacementAst = parseSync(
                  `Object.setPrototypeOf(${targetName}, new Proxy({}, { get(_, prop) { return ma[prop]; }, has(_, prop) { return prop in ma; } }));`
                );
                const stmt = replacementAst?.program.body[0];
                if (stmt) {
                  astPath.replaceWith(stmt);
                  astPath.skip();
                }
              },
              MemberExpression(astPath: NodePath<BabelTypes.MemberExpression>) {
                const { object, property, computed } = astPath.node;
                if (
                  !computed &&
                  isIdentifier(object) &&
                  object.name === 'wx' &&
                  !astPath.scope.hasBinding('wx') &&
                  isIdentifier(property) &&
                  property.name.startsWith('$')
                ) {
                  const cacheAst = parseSync('(globalThis.__macleUniCache || (globalThis.__macleUniCache = {}))');
                  const exprStmt = cacheAst?.program.body[0];
                  if (exprStmt?.type === 'ExpressionStatement') {
                    astPath.node.object = exprStmt.expression;
                  }
                }
              },
              VariableDeclarator(astPath: NodePath<BabelTypes.VariableDeclarator>) {
                const { id, init } = astPath.node;
                if (isIdentifier(id) && !astPath.scope.hasBinding('wx')) {
                  const prefix = getManagerPrefix(init);
                  if (prefix) trackedInstances[id.name] = prefix;
                }
              },
              CallExpression(astPath: NodePath<BabelTypes.CallExpression>) {
                if (
                  isIdentifier(astPath.node.callee) &&
                  astPath.node.callee.name === 'Component' &&
                  astPath.node.arguments.length === 1 &&
                  !(astPath.node as unknown as { __macleWrapped?: boolean }).__macleWrapped
                ) {
                  const patchAst = parseSync(MACLE_PAGE_PATCH_FN);
                  const exprStmt = patchAst?.program.body[0];
                  if (exprStmt?.type === 'ExpressionStatement') {
                    const arg = astPath.node.arguments[0];
                    const wrappedCall: BabelTypes.CallExpression = {
                      type: 'CallExpression',
                      callee: exprStmt.expression,
                      arguments: [arg],
                    };
                    (wrappedCall as unknown as { __macleWrapped?: boolean }).__macleWrapped = true;
                    astPath.replaceWith(wrappedCall);
                    astPath.skip();
                    return;
                  }
                }
                inspectCall(astPath);
              },
              OptionalCallExpression: inspectCall,
              Identifier(astPath: NodePath<BabelTypes.Identifier>) {
                const parent = astPath.parent;
                const parentMember = isMemberExpression(parent) ? parent : undefined;
                const isMemberProperty =
                  parentMember !== undefined &&
                  parentMember.property === astPath.node &&
                  !parentMember.computed;
                const isObjectKey =
                  parent.type === 'ObjectProperty' && parent.key === astPath.node && !parent.computed;

                if (
                  astPath.node.name === 'wx' &&
                  !astPath.scope.hasBinding('wx') &&
                  !isMemberProperty &&
                  !isObjectKey
                ) {
                  astPath.node.name = 'ma';
                }
              },
            },
          };
        },
      ],
    });

    return { code: result?.code ?? source, calledApis };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[uni-mp-macle] Babel skip on ${filename}: ${message}`);
    return { code: source, calledApis };
  }
}

export { transformJsToMacle };
