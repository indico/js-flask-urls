import {transform} from '@babel/core';
import flaskURLPlugin from 'babel-plugin-flask-urls';
import macrosPlugin from 'babel-plugin-macros';
import buildFlaskURL, {mockFlaskURL, matchFlaskURL, matchMockedFlaskURL} from 'flask-urls';
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
  const res = f(
    name =>
      ({[builder]: mockESModule(buildFlaskURL, {mockFlaskURL, matchFlaskURL, matchMockedFlaskURL})}[
        name
      ])
  );
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

test('extracts correct parameters from URL with default parameters', () => {
  const params = [{x: 'hello'}, {}, {x: 'hello', y: 'world'}, {y: 'world'}];
  const results = [{x: 'hello'}, {x: 'nope'}, {x: 'hello', y: 'world'}, {x: 'nope', y: 'world'}];
  const setup = `import defaultParamURL from 'flask-url:default_param';`;
  const setupMacro = `
    import flask from 'flask-urls.macro';
    const defaultParamURL = flask\`default_param\`;
  `;
  const body = `
    const url = ${JSON.stringify(
      params
    )}.map(param => defaultParamURL.match(defaultParamURL(param)));
  `;
  const input = [setup, body].join('\n');
  const inputMacro = [setupMacro, body].join('\n');

  expectTranspiledPlugin(input).toEqual(results);
  expectTranspiledPlugin(input, 'myapp/flask-urls').toEqual(results);
  expectTranspiledPlugin(input, 'flask-urls', '/test').toEqual(results);
  expectTranspiledPlugin(input, 'flask-urls', '/test/').toEqual(results);

  expectTranspiledMacro(inputMacro).toEqual(results);
  expectTranspiledMacro(inputMacro, 'myapp/flask-urls').toEqual(results);
  expectTranspiledMacro(inputMacro, 'flask-urls', '/test').toEqual(results);
  expectTranspiledMacro(inputMacro, 'flask-urls', '/test/').toEqual(results);
});

test('extracts correct parameters from URL with optional parameters', () => {
  const params = [{x: 'hello'}, {}, {y: 'world'}, {x: 'hello', y: 'world'}];
  const results = params;
  const setup = `import optionalParamURL from 'flask-url:optional_param';`;
  const setupMacro = `
    import flask from 'flask-urls.macro';
    const optionalParamURL = flask\`optional_param\`;
  `;
  const body = `
    const url = ${JSON.stringify(
      params
    )}.map(param => optionalParamURL.match(optionalParamURL(param)));
  `;
  const input = [setup, body].join('\n');
  const inputMacro = [setupMacro, body].join('\n');

  expectTranspiledPlugin(input).toEqual(results);
  expectTranspiledPlugin(input, 'myapp/flask-urls').toEqual(results);
  expectTranspiledPlugin(input, 'flask-urls', '/test').toEqual(results);
  expectTranspiledPlugin(input, 'flask-urls', '/test/').toEqual(results);

  expectTranspiledMacro(inputMacro).toEqual(results);
  expectTranspiledMacro(inputMacro, 'myapp/flask-urls').toEqual(results);
  expectTranspiledMacro(inputMacro, 'flask-urls', '/test').toEqual(results);
  expectTranspiledMacro(inputMacro, 'flask-urls', '/test/').toEqual(results);
});

test('extracts correct parameters from URL with integer converter', () => {
  const params = [{n: 42}, {n: -9000}, {n: 1337, y: 'test'}];
  const results = params;
  const setup = `import intParamURL from 'flask-url:int_param';`;
  const setupMacro = `
    import flask from 'flask-urls.macro';
    const intParamURL = flask\`int_param\`;
  `;
  const body = `
    const url = ${JSON.stringify(params)}.map(param => intParamURL.match(intParamURL(param)));
  `;
  const input = [setup, body].join('\n');
  const inputMacro = [setupMacro, body].join('\n');

  expectTranspiledPlugin(input).toEqual(results);
  expectTranspiledPlugin(input, 'myapp/flask-urls').toEqual(results);
  expectTranspiledPlugin(input, 'flask-urls', '/test').toEqual(results);
  expectTranspiledPlugin(input, 'flask-urls', '/test/').toEqual(results);

  expectTranspiledMacro(inputMacro).toEqual(results);
  expectTranspiledMacro(inputMacro, 'myapp/flask-urls').toEqual(results);
  expectTranspiledMacro(inputMacro, 'flask-urls', '/test').toEqual(results);
  expectTranspiledMacro(inputMacro, 'flask-urls', '/test/').toEqual(results);
});

test('extracts correct parameters from URL with path converter', () => {
  const params = [
    {base: 'hello', location: 'this/world'},
    {base: 'hello', location: 'this/is a/world'},
  ];
  const results = params;
  const setup = `import pathParamURL from 'flask-url:path_param';`;
  const setupMacro = `
    import flask from 'flask-urls.macro';
    const pathParamURL = flask\`path_param\`;
  `;
  const body = `
    const url = ${JSON.stringify(params)}.map(param => pathParamURL.match(pathParamURL(param)));
  `;
  const input = [setup, body].join('\n');
  const inputMacro = [setupMacro, body].join('\n');

  expectTranspiledPlugin(input).toEqual(results);
  expectTranspiledPlugin(input, 'myapp/flask-urls').toEqual(results);
  expectTranspiledPlugin(input, 'flask-urls', '/test').toEqual(results);
  expectTranspiledPlugin(input, 'flask-urls', '/test/').toEqual(results);

  expectTranspiledMacro(inputMacro).toEqual(results);
  expectTranspiledMacro(inputMacro, 'myapp/flask-urls').toEqual(results);
  expectTranspiledMacro(inputMacro, 'flask-urls', '/test').toEqual(results);
  expectTranspiledMacro(inputMacro, 'flask-urls', '/test/').toEqual(results);
});

test('extracts correct parameters from URL with complex path converter', () => {
  const params = [
    {location1: 'hello', location2: 'world'},
    {location1: 'hello/world', location2: 'separator/this/is'},
    {location1: 'hello/world/separator', location2: 'this/is'},
    {location1: 'hello/world', location2: '/separator/this/is'},
  ];
  const results = [
    {location1: 'hello', location2: 'world'},
    {location1: 'hello/world', location2: 'separator/this/is'},
    {location1: 'hello/world', location2: 'separator/this/is'},
    {location1: 'hello/world/separator/', location2: 'this/is'},
  ];
  const setup = `import complexPathParamURL from 'flask-url:complex_path_param';`;
  const setupMacro = `
    import flask from 'flask-urls.macro';
    const complexPathParamURL = flask\`complex_path_param\`;
  `;
  const body = `
    const url = ${JSON.stringify(
      params
    )}.map(param => complexPathParamURL.match(complexPathParamURL(param)));
  `;
  const input = [setup, body].join('\n');
  const inputMacro = [setupMacro, body].join('\n');

  expectTranspiledPlugin(input).toEqual(results);
  expectTranspiledPlugin(input, 'myapp/flask-urls').toEqual(results);
  expectTranspiledPlugin(input, 'flask-urls', '/test').toEqual(results);
  expectTranspiledPlugin(input, 'flask-urls', '/test/').toEqual(results);

  expectTranspiledMacro(inputMacro).toEqual(results);
  expectTranspiledMacro(inputMacro, 'myapp/flask-urls').toEqual(results);
  expectTranspiledMacro(inputMacro, 'flask-urls', '/test').toEqual(results);
  expectTranspiledMacro(inputMacro, 'flask-urls', '/test/').toEqual(results);
});

test('extracts correct parameters from URL in mock mode', () => {
  const params = [{x: 'hello'}, {}, {x: 'hello', y: 'world'}, {abc: 'hello world'}];
  const results = params;
  const setup = `import someURL from 'flask-url:some.thing';`;
  const setupMacro = `
    import flask from 'flask-urls.macro';
    const someURL = flask\`some.thing\`;
  `;
  const body = `
    const url = ${JSON.stringify(params)}.map(param => someURL.match(someURL(param)));
  `;
  const input = [setup, body].join('\n');
  const inputMacro = [setupMacro, body].join('\n');

  expectTranspiledPluginMocked(input).toEqual(results);
  expectTranspiledPluginMocked(input, 'myapp/flask-urls').toEqual(results);
  expectTranspiledPluginMocked(input, 'flask-urls', '/test').toEqual(results);
  expectTranspiledPluginMocked(input, 'flask-urls', '/test/').toEqual(results);

  expectTranspiledMacroMocked(inputMacro).toEqual(results);
  expectTranspiledMacroMocked(inputMacro, 'myapp/flask-urls').toEqual(results);
  expectTranspiledMacroMocked(inputMacro, 'flask-urls', '/test').toEqual(results);
  expectTranspiledMacroMocked(inputMacro, 'flask-urls', '/test/').toEqual(results);
});

test('rejects invalid URLs when extracting', () => {
  const input = `
    import defaultParamURL from 'flask-url:default_param';
    import optionalParamURL from 'flask-url:optional_param';
    import intParamURL from 'flask-url:int_param';
    import complexPathParamURL from 'flask-url:complex_path_param';

    const url = [
      defaultParamURL.match(defaultParamURL().replace('/def', '/abc')),
      optionalParamURL.match(optionalParamURL({x: 'a'}).slice(0, -1)),
      intParamURL.match(intParamURL({n: 123}).replace('123', 'abc')),
      intParamURL.match(intParamURL({n: 42}).replace('42', '42.5')),
      intParamURL.match(intParamURL({n: 1337}).replace('1337', '1337.')),
      intParamURL.match(intParamURL({n: 0}).replace('0', '0a')),
      complexPathParamURL.match(complexPathParamURL({location1: 'hello', location2: 'world'}).replace('separator', 'sep')),
    ];
  `;
  const results = Array(7).fill(null);
  expectTranspiledPlugin(input).toEqual(results);
});

test('rejects invalid URLs when extracting when base is specified', () => {
  const input = `
    import defaultParamURL from 'flask-url:default_param';

    const url = defaultParamURL.match(defaultParamURL().replace('test', 'prod'));
  `;
  expectTranspiledPlugin(input, 'flask-urls', '/test').toBe(null);
});

test('rejects invalid URLs when extracting in mock mode', () => {
  const input = `
    import someURL from 'flask-url:some.thing';

    const url = someURL.match(someURL().replace('flask://', 'https://'));
  `;
  expectTranspiledPluginMocked(input, 'flask-urls', '/test').toBe(null);
});
