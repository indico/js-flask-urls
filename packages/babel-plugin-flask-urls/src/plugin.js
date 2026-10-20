import {
  addDefault as addDefaultImport,
  addNamed as addNamedImport,
} from '@babel/helper-module-imports';

const flaskURLPlugin = ({types: t, template}, opts = {}) => {
  const buildFunc = template.expression(
    'Object.assign(BUILDFUNC.bind(null, RULE, BASE), {match: MATCHFUNC.bind(null, RULE, BASE)})'
  );
  const buildFuncMock = template.expression(
    'Object.assign(BUILDFUNC.bind(null, ENDPOINT), {match: MATCHFUNC.bind(null, ENDPOINT)})'
  );
  const importPrefix = opts.importPrefix || 'flask-url';
  const builderImportLocation = opts.builderImportLocation || 'flask-urls';
  const urlMap = opts.urlMap || {};
  const mock = opts.mock;
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

          let builderFuncId = this.builderFuncId;
          if (builderFuncId) {
            builderFuncId = t.cloneDeep(builderFuncId);
          }

          let matchFuncId = this.matchFuncId;
          if (matchFuncId) {
            matchFuncId = t.cloneDeep(matchFuncId);
          }

          let variable;
          if (mock) {
            if (!builderFuncId) {
              builderFuncId = this.builderFuncId = addNamedImport(
                path,
                'mockFlaskURL',
                builderImportLocation,
                {
                  nameHint: 'mockFlaskURL',
                }
              );
            }
            if (!matchFuncId) {
              matchFuncId = this.matchFuncId = addNamedImport(
                path,
                'matchMockedFlaskURL',
                builderImportLocation,
                {
                  nameHint: 'matchMockedFlaskURL',
                }
              );
            }

            variable = t.variableDeclarator(
              t.identifier(importName),
              buildFuncMock({
                BUILDFUNC: builderFuncId,
                MATCHFUNC: matchFuncId,
                ENDPOINT: t.stringLiteral(endpoint),
              })
            );
          } else {
            const data = urlMap[endpoint];
            if (!data) {
              throw path
                .get('source')
                .buildCodeFrameError(
                  `${importPrefix} imports must reference a valid flask endpoint`
                );
            }

            if (!builderFuncId) {
              builderFuncId = this.builderFuncId = addDefaultImport(path, builderImportLocation, {
                nameHint: 'buildFlaskURL',
              });
            }
            if (!matchFuncId) {
              matchFuncId = this.matchFuncId = addNamedImport(
                path,
                'matchFlaskURL',
                builderImportLocation,
                {
                  nameHint: 'matchFlaskURL',
                }
              );
            }

            variable = t.variableDeclarator(
              t.identifier(importName),
              buildFunc({
                BUILDFUNC: builderFuncId,
                MATCHFUNC: matchFuncId,
                RULE: t.valueToNode(data),
                BASE: t.stringLiteral(basePath),
              })
            );
          }

          path.replaceWith({
            type: 'VariableDeclaration',
            kind: 'const',
            declarations: [variable],
            leadingComments: [
              {
                type: 'CommentBlock',
                value: ` ${mock ? 'mocked ' : ''}flask url builder for '${endpoint}' `,
              },
            ],
          });
        },
      },
    },
  };
};

export default flaskURLPlugin;
