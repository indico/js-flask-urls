/* The code in this file is based on werkzeug.contrib.jsrouting */

import qs from 'qs';
import difference from 'lodash/difference';
import isArray from 'lodash/isArray';
import isEmpty from 'lodash/isEmpty';
import isObject from 'lodash/isObject';
import pick from 'lodash/pick';
import unzip from 'lodash/unzip';


const makeBuildError = (endpoint, params) => {
    return new Error(`Could not build URL for endpoint '${endpoint}' (${JSON.stringify(params)})`);
};


const builtinConverters = {
    PathConverter(value) {
        // Generate unescaped forward slashes, just like in Flask
        return value.split('/').map(encodeURIComponent).join('/');
    }
};


const splitObj = (obj) => {
    const [names, values] = isEmpty(obj) ? [[], []] : unzip(Object.entries(obj));
    return {names, values, original: obj};
};


const suitable = (rule, args) => {
    // Checks if a rule is suitable for the given arguments
    const defaultArgs = splitObj(rule.defaults || {});
    const diffArgNames = difference(rule.args, defaultArgs.names);

    // If a rule arg that has no default value is missing, the rule is not suitable
    for (let i = 0; i < diffArgNames.length; i++) {
        if (args.names.indexOf(diffArgNames[i]) === -1) {
            return false;
        }
    }

    if (difference(rule.args, args.names).length === 0) {
        if (!rule.defaults) {
            return true;
        }
        // If a default argument is provided with a different value, the rule is not suitable
        for (let i = 0; i < defaultArgs.names.length; i++) {
            const key = defaultArgs.names[i];
            const value = defaultArgs.values[i];
            if (value !== args.original[key]) {
                return false;
            }
        }
    }

    return true;
};


const build = (rule, args, converters) => {
    let tmp = [];
    const processed = rule.args.slice();
    for (const part of rule.trace) {
        if (part.isDynamic) {
            const converter = converters[rule.converters[part.data]] || encodeURIComponent;
            const value = converter(args.original[part.data]);
            if (value === null) {
                return null;
            }
            tmp.push(value);
            processed.push(part.name);
        } else {
            tmp.push(part.data);
        }
    }
    tmp = tmp.join('');
    const pipe = tmp.indexOf('|');
    // if we had subdomain routes, the subdomain would come before the pipe
    const url = tmp.substring(pipe + 1);
    const unprocessed = difference(args.names, processed);
    return {url, unprocessed};
};


const fixParams = (endpoint, params) => {
    const cleanParams = Object.create(null);
    Object.entries(params).forEach(([key, value]) => {
        if (value === '') {
            return;
        }
        if (value === undefined || value === null) {
            // convert them to a string
            value = '' + value;
        }
        if (isObject(value) && !isArray(value)) {
            throw makeBuildError(endpoint, params);
        }
        cleanParams[key] = value;
    });
    return cleanParams;
};


const buildFlaskURL = (template, base = '', params = {}, fragment = '', converters = {}) => {
    converters = {...builtinConverters, ...converters};
    let qsParams, url;
    params = fixParams(template.endpoint, params);
    const args = splitObj(params);
    for (const rule of template.rules) {
        if (suitable(rule, args)) {
            const res = build(rule, args, converters);
            if (res === null) {
                continue;
            }
            url = res.url;
            qsParams = pick(params, res.unprocessed);
            break;
        }
    }

    if (!url) {
        throw makeBuildError(template.endpoint, params);
    }

    url = base.replace(/\/$/, '') + url;

    if (!isEmpty(qsParams)) {
        url += '?' + qs.stringify(qsParams, {arrayFormat: 'repeat'});
    }
    if (fragment) {
        url += '#' + fragment.replace(/^#/, '');
    }
    return url;
};


export default buildFlaskURL;
