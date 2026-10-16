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
    return value
      .split('/')
      .map(encodeURIComponent)
      .join('/');
  },
};

const builtinUnconverters = {
  IntegerConverter(value) {
    if (value === '' || value.endsWith('.')) {
      return null;
    }
    const number = Number(value);
    return Number.isInteger(number) ? number : null;
  },
  PathConverter(value) {
    return value
      .split('/')
      .map(decodeURIComponent)
      .join('/');
  },
};

const splitObj = obj => {
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

export const mockFlaskURL = (endpoint, params = {}, fragment = '') => {
  const argstr = Object.entries(params)
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join('/');
  const parts = ['flask://', endpoint];
  if (argstr) {
    parts.push('/');
    parts.push(argstr);
  }
  if (fragment) {
    parts.push('#' + fragment);
  }
  return parts.join('');
};

const _matchRule = (rule, path, extraConverters = {}) => {
  const params = {...rule.defaults};
  const minimumLengths = {};
  const backtracks = [];
  let partIndex, part;

  function backtrack() {
    if (backtracks.length === 0) {
      return false;
    }
    const prevState = backtracks.pop();
    partIndex = prevState[0] - 1;
    path = prevState[1];
    return true;
  }

  partIndex = -1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (partIndex === rule.trace.length - 1 && (path === '' || !backtrack())) {
      break;
    }

    part = rule.trace[++partIndex];

    if (part.data === '|') {
      continue;
    }

    if (part.isDynamic) {
      const converterKey = rule.converters[part.data];
      const converter = extraConverters[part.data] ?? builtinUnconverters[converterKey] ?? (v => v);
      const minimumLength = minimumLengths[part.data] ?? 0;

      let nextPartStart = path.indexOf('/', minimumLength);
      nextPartStart = nextPartStart === -1 ? path.length : nextPartStart;
      if (nextPartStart === 0) {
        if (backtrack()) {
          continue;
        } else {
          return null;
        }
      }

      params[part.data] = converter(path.substring(0, nextPartStart));
      const oldPath = path;
      path = path.substring(nextPartStart);

      if (params[part.data] === null) {
        if (backtrack()) {
          continue;
        } else {
          return null;
        }
      }

      // if this part is a path, we might have to backtrack
      if (converterKey === 'PathConverter' && nextPartStart + 1 !== minimumLengths[part.data]) {
        minimumLengths[part.data] = nextPartStart + 1;
        backtracks.push([partIndex, oldPath]);
      }
    } else if (path.startsWith(part.data)) {
      path = path.substring(part.data.length);
    } else if (!backtrack()) {
      return null;
    }
  }

  // Ensure all path segments have been consumed
  if (path === '') {
    return params;
  }
  return null;
};

const _matchFlaskURL = (template, url, mocked, converters = {}) => {
  const parsedURL = new URL(`http://flask${url}`);

  // search params are not specified in any rules
  let params = Object.fromEntries(parsedURL.searchParams.entries());

  if (!mocked) {
    let matched = false;
    for (const rule of template.rules) {
      const extraParams = _matchRule(rule, parsedURL.pathname, converters);
      if (extraParams !== null) {
        params = {...params, ...extraParams};
        matched = true;
        break;
      }
    }
    if (!matched && template.rules.length > 0) {
      return null;
    }
  } else {
    params = {
      ...params,
      ...Object.fromEntries(
        parsedURL.pathname
          .split('/')
          .filter(part => part.includes('='))
          .map(part => part.split('=', 2))
          .map(([key, value]) => [key, decodeURIComponent(value)])
      ),
    };
  }

  return params;
};

export const matchMockedFlaskURL = (endpoint, url) => {
  if (!url.startsWith(`flask://${endpoint}`)) {
    return null;
  }
  return _matchFlaskURL({endpoint, rules: []}, url.substring(endpoint.length + 8), true);
};

export const matchFlaskURL = (template, base, url, converters = {}) => {
  if (!url.startsWith(base)) {
    return null;
  }
  return _matchFlaskURL(
    template,
    url.substring(base.length + (base.endsWith('/') ? -1 : 0)),
    false,
    converters
  );
};
