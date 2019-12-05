import {transform} from '@babel/core';
import flaskURLPlugin from 'babel-plugin-flask-urls';
import macrosPlugin from 'babel-plugin-macros';
import buildFlaskURL, {mockFlaskURL} from 'flask-urls';
import urlMap from '../test-data/url-map';

const mockESModule = (fn, named) => {
  return {
    __esModule: true,
    default: fn,
    ...named,
  };
};

const _expectTranspiled = (macro, mock, input, builder = 'flask-urls', basePath = '') => {
  const opts = {
    urlMap,
    [macro ? 'builder' : 'builderImportLocation']: builder,
    basePath,
    mock,
  };
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
  const res = f(name => ({[builder]: mockESModule(buildFlaskURL, {mockFlaskURL})}[name]));
  return expect(res);
};

const expectTranspiledPlugin = (...args) => _expectTranspiled(false, false, ...args);
const expectTranspiledMacro = (...args) => _expectTranspiled(true, false, ...args);
const expectTranspiledPluginMocked = (...args) => _expectTranspiled(false, true, ...args);
const expectTranspiledMacroMocked = (...args) => _expectTranspiled(true, true, ...args);

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

test('generates correct urls from transpiled code in mock mode', () => {
  const input = `
    import someURL from 'flask-url:some.thing';
    const url = [someURL(), someURL({foo: 'bar', z: 1}), someURL({foo: 'bar'}, 'fragment')];
  `;
  const expected = [
    'flask://some.thing',
    'flask://some.thing/foo=bar/z=1',
    'flask://some.thing/foo=bar#fragment',
  ];
  expectTranspiledPluginMocked(input).toEqual(expected);
  expectTranspiledPluginMocked(input, 'myapp/flask-urls').toEqual(expected);
  expectTranspiledPluginMocked(input, 'flask-urls', '/test').toEqual(expected);
  expectTranspiledPluginMocked(input, 'flask-urls', '/test/').toEqual(expected);
});

test('generates correct urls from transpiled code using the macro in mock mode', () => {
  const input = `
    import flask from 'flask-urls.macro';
    const someURL = flask\`some.thing\`;
    const url = [someURL(), someURL({foo: 'bar', z: 1}), someURL({foo: 'bar'}, 'fragment')];
  `;
  const expected = [
    'flask://some.thing',
    'flask://some.thing/foo=bar/z=1',
    'flask://some.thing/foo=bar#fragment',
  ];
  expectTranspiledMacroMocked(input).toEqual(expected);
  expectTranspiledMacroMocked(input, 'myapp/flask-urls').toEqual(expected);
  expectTranspiledMacroMocked(input, 'flask-urls', '/test').toEqual(expected);
  expectTranspiledMacroMocked(input, 'flask-urls', '/test/').toEqual(expected);
});
