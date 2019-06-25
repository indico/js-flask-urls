import {transform} from '@babel/core';
import flaskURLPlugin from 'babel-plugin-flask-urls';
import buildFlaskURL from 'flask-urls';
import urlMap from '../test-data/url-map';


const mockESModule = (fn) => {
    return {
        default: fn,
        __esModule: true,
    };
};


const expectTranspiled = (input, builderImportLocation = 'flask-urls', basePath = '') => {
    const {code} = transform(input, {
        plugins: [[flaskURLPlugin, {urlMap, builderImportLocation, basePath}]],
        presets: [['@babel/env', {targets: {node: 'current'}}]],
    });
    // eslint-disable-next-line no-new-func
    const f = new Function('require', `
        ${code};
        return url;
    `);
    const res = f((name) => ({[builderImportLocation]: mockESModule(buildFlaskURL)}[name]));
    return expect(res);
};


test('generates correct urls from transpiled code', () => {
    const input = `
        import noParamsURL from 'flask-url:no_params';
        const url = noParamsURL();
    `;
    expectTranspiled(input).toBe('/no/');
    expectTranspiled(input, 'myapp/flask-urls').toBe('/no/');
    expectTranspiled(input, 'flask-urls', '/test').toBe('/test/no/');
    expectTranspiled(input, 'flask-urls', '/test/').toBe('/test/no/');
});
