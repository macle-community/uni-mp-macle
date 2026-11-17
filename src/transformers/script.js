'use strict';

const babel = require('@babel/core');
const { API_RENAME_MAP, PARAM_RENAME_MAP, CONTEXT_MANAGERS } = require('../rules');

function transformJsToMacle(code, filename) {
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
              CallExpression(astPath) {
                const { callee, arguments: args } = astPath.node;
                if (!t.isMemberExpression(callee) || !t.isIdentifier(callee.object) || !t.isIdentifier(callee.property)) {
                  return;
                }

                const objName = callee.object.name;
                const propName = callee.property.name;

                // Track calls on manager instances (e.g., RecorderManager.start)
                if (trackedInstances[objName]) {
                  const fullApiName = `${trackedInstances[objName]}.${propName}`;
                  calledApis[fullApiName] = calledApis[fullApiName] || { props: [] };
                  return;
                }

                // Handle direct wx.xxx(...) calls
                if (objName === 'wx') {
                  calledApis[propName] = calledApis[propName] || { props: [] };

                  const paramRules = PARAM_RENAME_MAP[propName];
                  if (args.length > 0 && t.isObjectExpression(args[0])) {
                    for (const prop of args[0].properties) {
                      if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
                        const originalKey = prop.key.name;
                        calledApis[propName].props.push(originalKey);

                        if (paramRules && paramRules[originalKey]) {
                          prop.key.name = paramRules[originalKey];
                        }
                      }
                    }
                  }

                  // Rename API method if different in Macle
                  if (API_RENAME_MAP[propName]) {
                    callee.property.name = API_RENAME_MAP[propName];
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
