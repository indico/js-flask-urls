import isArray from 'lodash/isArray';
import buildFlaskURL from '../src/build';
import urlMap from '../../test-data/url-map';


const customConverters = {
    ListConverter(value) {
        if (value === 'FAIL') {
            return null;
        }
        if (isArray(value)) {
            return value.map(encodeURIComponent).join('-');
        }
        return encodeURIComponent(value);
    }
};

const expectURL = (endpoint, params = {}, fragment = '', base = '') => expect(
    buildFlaskURL(urlMap[endpoint], base, params, fragment)
);

const expectURLError = (endpoint, params = {}, fragment = '', base = '') => expect(
    () => buildFlaskURL(urlMap[endpoint], base, params, fragment)
).toThrow(/Could not build URL/);

const expectURLConv = (endpoint, params = {}, fragment = '', base = '') => expect(
    buildFlaskURL(urlMap[endpoint], base, params, fragment, customConverters)
);

const expectURLConvError = (endpoint, params = {}, fragment = '', base = '') => expect(
    () => buildFlaskURL(urlMap[endpoint], base, params, fragment, customConverters)
).toThrow(/Could not build URL/);


test('Building URL with no extra args', () => {
    expect(buildFlaskURL(urlMap.no_params)).toBe('/no/');
});


test('Building simple URLs', () => {
    expectURL('no_params').toBe('/no/');
    expectURL('no_params', {hello: 'world'}).toBe('/no/?hello=world');
    expectURL('no_params', {hello: ['world', 'there']}).toBe('/no/?hello=world&hello=there');
    expectURL('no_params', {}, 'foo').toBe('/no/#foo');
    expectURL('no_params', {}, '', 'https://example.com').toBe('https://example.com/no/');
    expectURL('no_params', {}, '', 'https://example.com/').toBe('https://example.com/no/');
    expectURL('no_params', {}, '', 'https://example.com/test/').toBe('https://example.com/test/no/');
    expectURL('no_params', {hello: 'world'}, 'foo', '/test').toBe('/test/no/?hello=world#foo');});


test('Building URLs with params', () => {
    expectURL('path_param', {base: 'a', location: 'b/c'}).toBe('/file/a/b/c');
    expectURL('int_param', {n: 1}).toBe('/int/1');
    expectURL('int_param', {n: 1, foo: 'bar'}).toBe('/int/1?foo=bar');
    // XXX: this one would fail in python, but we don't do strict type checking here
    expectURL('int_param', {n: 'x'}).toBe('/int/x');
});


test('Building URL with optional params', () => {
    expectURL('optional_param').toBe('/opt/');
    expectURL('optional_param', {x: ''}).toBe('/opt/');
    expectURL('optional_param', {x: 'test'}).toBe('/opt/v/test');
});


test('Building URL with default params', () => {
    expectURL('default_param').toBe('/def/');
    expectURL('default_param', {x: ''}).toBe('/def/');
    expectURL('default_param', {x: 'nope'}).toBe('/def/');
    expectURL('default_param', {x: 'test'}).toBe('/def/v/test');
});


test('Building URL with special params', () => {
    expectURL('param', {x: null}).toBe('/p/null');
    expectURL('param', {x: undefined}).toBe('/p/undefined');
});


test('Building URLs with missing custom converter', () => {
    expectURL('list_param', {items: 'a'}).toBe('/items/a');
    expectURL('list_param', {items: ['a']}).toBe('/items/a');
    expectURL('list_param', {items: ['a', 'b']}).toBe(`/items/a%2Cb`);
});


test('Building URLs with custom converter', () => {
    expectURLConv('list_param', {items: 'a'}).toBe('/items/a');
    expectURLConv('list_param', {items: ['a']}).toBe('/items/a');
    expectURLConv('list_param', {items: ['a', 'b']}).toBe(`/items/a-b`);
});


test('Building URLs with failing converter', () => {
    expectURLConvError('list_param', {items: 'FAIL'});
});


test('Building URLs with missing params', () => {
    expectURLError('path_param');
    expectURLError('path_param', {base: 'test'});
    expectURLError('path_param', {location: 'test'});
});


test('Building URLs with invalid param', () => {
    expectURLError('param', {x: {}});
    expectURLError('param', {x: {foo: 'bar'}});
});
