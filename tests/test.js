import {transform} from '@babel/core';
import flaskURLPlugin from 'babel-plugin-flask-urls';
import macrosPlugin from 'babel-plugin-macros';
import buildFlaskURL from 'flask-urls';
import urlMap from '../test-data/url-map';

const mockESModule = fn => {
  return {
    default: fn,
    __esModule: true,
  };
};

const _expectTranspiled = (macro, input, builderImportLocation = 'flask-urls', basePath = '') => {
  const opts = {urlMap, builderImportLocation, basePath};
  const plugins = macro ? [[macrosPlugin, {flaskURLs: opts}]] : [[flaskURLPlugin, opts]];
  const {code} = transform(input, {
    plugins,
    presets: [['@babel/env', {targets: {node: 'current'}}]],
    filename: __filename,
  });
  // eslint-disable-next-line no-new-func
  const f = new Function(
    'require',
    `
      ${code};
      return url;
    `
  );
  const res = f(name => ({[builderImportLocation]: mockESModule(buildFlaskURL)}[name]));
  return expect(res);
};

const expectTranspiledPlugin = (...args) => _expectTranspiled(false, ...args);
const expectTranspiledMacro = (...args) => _expectTranspiled(true, ...args);

test('generates correct urls from transpiled code', () => {
  const input = `
    import noParamsURL from 'flask-url:no_params';
    const url = noParamsURL();
  `;
  expectTranspiledPlugin(input).toBe('/no/');
  expectTranspiledPlugin(input, 'myapp/flask-urls').toBe('/no/');
  expectTranspiledPlugin(input, 'flask-urls', '/test').toBe('/test/no/');
  expectTranspiledPlugin(input, 'flask-urls', '/test/').toBe('/test/no/');
});

test('generates correct urls from transpiled code using the macro', () => {
  const input = `
    import flask from 'flask-urls.macro';
    const noParamsURL = flask\`no_params\`;
    const url = noParamsURL();
  `;
  expectTranspiledMacro(input).toBe('/no/');
  expectTranspiledMacro(input, 'myapp/flask-urls').toBe('/no/');
  expectTranspiledMacro(input, 'flask-urls', '/test').toBe('/test/no/');
  expectTranspiledMacro(input, 'flask-urls', '/test/').toBe('/test/no/');
});
