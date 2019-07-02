import macrosPlugin from 'babel-plugin-macros';
import pluginTester from 'babel-plugin-tester';
import urlMap from '../../../test-data/url-map';

pluginTester({
  plugin: macrosPlugin,
  pluginOptions: {
    flaskURLs: {
      urlMap,
    },
  },
  babelOptions: {filename: __filename},
  title: 'babel macro',
  tests: {
    // succesful cases
    'generates the function call': {
      code: `
        import flask from '../src/flask-urls.macro';
        const noParamsURL = flask\`no_params\`;
      `,
      snapshot: true,
    },
    'works with a custom import name': {
      code: `
        import kittens from '../src/flask-urls.macro';
        const noParamsURL = kittens\`no_params\`;
      `,
      snapshot: true,
    },
    'creates builder import only once': {
      code: `
        import flask from '../src/flask-urls.macro';
        const noParamsURL = flask\`no_params\`;
        const defaultParam = flask\`default_param\`;
      `,
      snapshot: true,
    },
    'rewrites import using a custom builder import location': {
      code: `
        import flask from '../src/flask-urls.macro';
        const noParamsURL = flask\`no_params\`;
      `,
      snapshot: true,
      pluginOptions: {
        flaskURLs: {
          urlMap,
          builder: 'myapp/flask-urls',
        },
      },
    },
    'rewrites import using a custom base path': {
      code: `
        import flask from '../src/flask-urls.macro';
        const noParamsURL = flask\`no_params\`;
      `,
      snapshot: true,
      pluginOptions: {
        flaskURLs: {
          urlMap,
          basePath: 'myapp/',
        },
      },
    },
    // error cases
    'fails with invalid endpoint': {
      code: `
        import flask from '../src/flask-urls.macro';
        flask\`test\`;
      `,
      error: 'flask-url.macro must reference a valid flask endpoint',
    },
    'fails with expressions': {
      code: `
        import flask from '../src/flask-urls.macro';
        flask\`\${foo}\`;
      `,
      error: 'flask-url.macro cannot contain expressions',
    },
    'fails if unused': {
      code: `
        import flask from '../src/flask-urls.macro';
      `,
      error: 'flask-urls.macro is imported but not used',
    },
    'fails with wrong macro usage': {
      code: `
        import flask from '../src/flask-urls.macro';
        flask();
      `,
      error: 'flask-urls.macro only supports tagged template expressions',
    },
    'fails with non-default import': {
      code: `
        import {other} from '../src/flask-urls.macro';
      `,
      error: 'flask-urls.macro requires a default import',
    },
    'fails with multiple import specifiers': {
      code: `
        import flask, {other} from '../src/flask-urls.macro';
      `,
      error: 'flask-urls.macro only supports a default import',
    },
  },
});
