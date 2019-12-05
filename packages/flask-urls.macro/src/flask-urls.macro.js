import {createMacro, MacroError} from 'babel-plugin-macros';
import {
  addDefault as addDefaultImport,
  addNamed as addNamedImport,
} from '@babel/helper-module-imports';

const defaultConfig = {
  builder: 'flask-urls',
  urlMap: {},
  mock: false,
  basePath: '',
};

const macro = ({babel: {types: t, template}, config: localConfig, references, state}) => {
  const config = {...defaultConfig, ...localConfig};

  if (!references.default) {
    throw new MacroError('flask-urls.macro requires a default import');
  } else if (Object.keys(references).length !== 1) {
    throw new MacroError('flask-urls.macro only supports a default import');
  } else if (references.default.length === 0) {
    throw new MacroError('flask-urls.macro is imported but not used');
  }

  const buildFunc = template.expression('FUNC.bind(null, RULE, BASE)');
  const buildFuncMock = template.expression('FUNC.bind(null, ENDPOINT)');

  let builderFuncId;
  references.default.forEach(({parentPath}) => {
    if (parentPath.type !== 'TaggedTemplateExpression') {
      throw new MacroError('flask-urls.macro only supports tagged template expressions');
    }

    const quasi = parentPath.node.quasi;
    if (quasi.expressions.length) {
      throw new MacroError('flask-url.macro cannot contain expressions');
    }

    const endpoint = quasi.quasis[0].value.cooked;

    if (builderFuncId) {
      builderFuncId = t.cloneDeep(builderFuncId);
    }

    let replacement;
    if (config.mock) {
      if (!builderFuncId) {
        builderFuncId = addNamedImport(state.file.path, 'mockFlaskURL', config.builder, {
          nameHint: 'mockFlaskURL',
        });
      }

      replacement = buildFuncMock({
        FUNC: builderFuncId,
        ENDPOINT: t.stringLiteral(endpoint),
      });
    } else {
      const data = config.urlMap[endpoint];
      if (!data) {
        throw new MacroError('flask-url.macro must reference a valid flask endpoint');
      }

      // generate import
      if (!builderFuncId) {
        builderFuncId = addDefaultImport(state.file.path, config.builder, {
          nameHint: 'buildFlaskURL',
        });
      }

      replacement = buildFunc({
        FUNC: builderFuncId,
        RULE: t.valueToNode(data),
        BASE: t.stringLiteral(config.basePath),
      });
    }

    // replace the tagged template expression with the builder function
    parentPath.replaceWith(replacement);
  });
};

export default createMacro(macro, {configName: 'flaskURLs'});
