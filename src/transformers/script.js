'use strict';

const babel = require('@babel/core');
const { API_RENAME_MAP, PARAM_RENAME_MAP, CONTEXT_MANAGERS } = require('../rules');

function transformJsToMacle(code, filename) {
  if (typeof code !== 'string') code = '';
  if (!filename) filename = 'unknown.js';

  const calledApis = {};
  const trackedInstances = {}; // e.g., { recorderVarName: 'RecorderManager' }

  try {
    const result = babel.transformSync(code, {
      filename,
      compact: false,
      plugins: [
        function macleAstPlugin({ types: t }) {
          return {
            visitor: {
              // 1. Track manager instances: const mgr = wx.getRecorderManager()
              VariableDeclarator(astPath) {
                const { id, init } = astPath.node;
                if (
                  t.isIdentifier(id) &&
                  t.isCallExpression(init) &&
                  t.isMemberExpression(init.callee) &&
                  t.isIdentifier(init.callee.object, { name: 'wx' }) &&
                  t.isIdentifier(init.callee.property)
                ) {
                  const prefix = CONTEXT_MANAGERS[init.callee.property.name];
                  if (prefix) {
                    trackedInstances[id.name] = prefix;
                  }
                }
              },

              // 2. Inspect wx.xxx(...) and manager.xxx(...) calls
              'CallExpression|OptionalCallExpression'(astPath) {
                const { callee, arguments: args } = astPath.node;
                const isMemberCall =
                  t.isMemberExpression(callee) ||
                  (typeof t.isOptionalMemberExpression === 'function' && t.isOptionalMemberExpression(callee));
                if (!isMemberCall || !t.isIdentifier(callee.object)) {
                  return;
                }

                const objName = callee.object.name;
                let propName;
                if (t.isIdentifier(callee.property) && !callee.computed) {
                  propName = callee.property.name;
                } else if (callee.computed && t.isStringLiteral(callee.property)) {
                  propName = callee.property.value;
                } else if (callee.computed && t.isIdentifier(callee.property)) {
                  propName = undefined;
                }
                if (!propName) return;

                // Track calls on manager instances (e.g., RecorderManager.start)
                let managerPrefix = trackedInstances[objName];
                const binding = astPath.scope.getBinding(objName);
                if (!managerPrefix && binding && t.isVariableDeclarator(binding.path.node)) {
                  const init = binding.path.node.init;
                  if (
                    t.isCallExpression(init) &&
                    t.isMemberExpression(init.callee) &&
                    t.isIdentifier(init.callee.object, { name: 'wx' }) &&
                    t.isIdentifier(init.callee.property)
                  ) {
                    managerPrefix = CONTEXT_MANAGERS[init.callee.property.name];
                    if (managerPrefix) trackedInstances[objName] = managerPrefix;
                  }
                }
                if (!managerPrefix && binding && binding.constantViolations) {
                  for (const violation of binding.constantViolations) {
                    const assignment = violation.node;
                    if (
                      t.isAssignmentExpression(assignment) &&
                      t.isIdentifier(assignment.left, { name: objName }) &&
                      t.isCallExpression(assignment.right) &&
                      t.isMemberExpression(assignment.right.callee) &&
                      t.isIdentifier(assignment.right.callee.object, { name: 'wx' }) &&
                      t.isIdentifier(assignment.right.callee.property)
                    ) {
                      const assignedPrefix = CONTEXT_MANAGERS[assignment.right.callee.property.name];
                      if (assignedPrefix) managerPrefix = assignedPrefix;
                    }
                  }
                  if (managerPrefix) trackedInstances[objName] = managerPrefix;
                }

                if (managerPrefix) {
                  const fullApiName = `${managerPrefix}.${propName}`;
                  calledApis[fullApiName] = calledApis[fullApiName] || { props: [] };
                  return;
                }

                // Handle direct wx.xxx(...) calls
                if (objName === 'wx' && !astPath.scope.hasBinding('wx')) {
                  calledApis[propName] = calledApis[propName] || { props: [] };

                  const paramRules = PARAM_RENAME_MAP[propName];
                  if (args.length > 0 && t.isObjectExpression(args[0])) {
                    for (const prop of args[0].properties) {
                      if (t.isObjectProperty(prop)) {
                        let originalKey;
                        if (!prop.computed && t.isIdentifier(prop.key)) {
                          originalKey = prop.key.name;
                        } else if (t.isStringLiteral(prop.key) || t.isNumericLiteral(prop.key)) {
                          originalKey = String(prop.key.value);
                        }
                        if (!originalKey) continue;
                        calledApis[propName].props.push(originalKey);

                        if (paramRules && paramRules[originalKey]) {
                          if (t.isIdentifier(prop.key)) {
                            prop.key.name = paramRules[originalKey];
                          } else if (t.isStringLiteral(prop.key)) {
                            prop.key.value = paramRules[originalKey];
                          }
                        }
                      }
                    }
                  }

                  // Rename API method if different in Macle
                  if (API_RENAME_MAP[propName]) {
                    const renamedApi = API_RENAME_MAP[propName];
                    if (callee.computed && t.isStringLiteral(callee.property)) {
                      callee.property.value = renamedApi;
                    } else if (t.isIdentifier(callee.property)) {
                      callee.property.name = renamedApi;
                    }
                  }
                }
              },

              // 3. Rewrite global `wx` identifier -> `ma`
              Identifier(astPath) {
                if (
                  astPath.node.name === 'wx' &&
                  !astPath.scope.hasBinding('wx') &&
                  !(t.isMemberExpression(astPath.parent) && astPath.parent.property === astPath.node && !astPath.parent.computed) &&
                  !(t.isObjectProperty(astPath.parent) && astPath.parent.key === astPath.node && !astPath.parent.computed)
                ) {
                  astPath.node.name = 'ma';
                }
              },
            },
          };
        },
      ],
    });

    return { code: result ? result.code : code, calledApis };
  } catch (err) {
    console.warn(`[uni-mp-macle] Babel skip on ${filename}: ${err.message}`);
    return { code, calledApis };
  }
}

module.exports = { transformJsToMacle };
