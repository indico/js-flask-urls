import {addDefault as addDefaultImport} from '@babel/helper-module-imports';

const flaskURLPlugin = ({types: t, template}, opts = {}) => {
  const buildFunc = template.expression('FUNC.bind(null, RULE, BASE)');
  const importPrefix = opts.importPrefix || 'flask-url';
  const builderImportLocation = opts.builderImportLocation || 'flask-urls';
  const urlMap = opts.urlMap || {};
  const basePath = opts.basePath || '';
  const importRegex = new RegExp(`^${importPrefix}:(.+)$`);

  return {
    name: 'flask-urls',
    visitor: {
      ImportDeclaration: {
        exit(path) {
          const importTarget = path.node.source.value;
          const match = importTarget.match(importRegex);
          if (!match) {
            return;
          }
          const endpoint = match[1];
          if (path.node.specifiers.length === 0) {
            throw path.buildCodeFrameError(`${importPrefix} imports must use a default import`);
          } else if (path.node.specifiers.length > 1) {
            throw path
              .get('specifiers.1')
              .buildCodeFrameError(`${importPrefix} imports must use exactly one import`);
          } else if (!t.isImportDefaultSpecifier(path.node.specifiers[0])) {
            throw path
              .get('specifiers.0')
              .buildCodeFrameError(`${importPrefix} imports must use a default import`);
          }
          const importName = path.node.specifiers[0].local.name;
          const data = urlMap[endpoint];
          if (!data) {
            throw path
              .get('source')
              .buildCodeFrameError(`${importPrefix} imports must reference a valid flask endpoint`);
          }

          let builderFuncId = this.builderFuncId;
          if (builderFuncId) {
            builderFuncId = t.cloneDeep(builderFuncId);
          } else {
            builderFuncId = this.builderFuncId = addDefaultImport(path, builderImportLocation, {
              nameHint: 'buildFlaskURL',
            });
          }

          const variable = t.variableDeclarator(
            t.identifier(importName),
            buildFunc({
              FUNC: builderFuncId,
              RULE: t.valueToNode(data),
              BASE: t.stringLiteral(basePath),
            })
          );
          path.replaceWith({
            type: 'VariableDeclaration',
            kind: 'const',
            declarations: [variable],
            leadingComments: [
              {
                type: 'CommentBlock',
                value: ` flask url builder for '${endpoint}' `,
              },
            ],
          });
        },
      },
    },
  };
};

export default flaskURLPlugin;
