import pluginTester from 'babel-plugin-tester';
import urlMap from '../../test-data/url-map';
import flaskURLPlugin from '../src/plugin';


pluginTester({
    plugin: flaskURLPlugin,
    pluginOptions: {urlMap},
    title: 'babel plugin',
    tests: {
        'does not touch regular imports': {
            code: "import foo from 'bar';",
        },
        'works with an empty url map if no imports are processed': {
            code: "import foo from 'bar';",
            pluginOptions: {}
        },
        'rewrites the import': {
            code: "import noParams from 'flask-url:no_params';",
            snapshot: true,
        },
        'rewrites the imports and adds builder import only once': {
            code: `
                import noParams from 'flask-url:no_params';
                import defaultParam from 'flask-url:default_param';
            `,
            snapshot: true,
        },
        'rewrites import using a custom builder import location': {
            code: "import noParams from 'flask-url:no_params';",
            snapshot: true,
            pluginOptions: {
                urlMap,
                builderImportLocation: 'myapp/flask-urls',
            },
        },
        'rewrites import using a custom base path': {
            code: "import noParams from 'flask-url:no_params';",
            snapshot: true,
            pluginOptions: {
                urlMap,
                basePath: 'myapp/',
            },
        },
        'fails with duplicate import': {
            code: `
                import test from 'flask-url:no_params';
                import test from 'flask-url:default_param';
            `,
            error: /Duplicate declaration "test"/,
        },
        'fails with invalid endpoint': {
            code: "import test from 'flask-url:test';",
            error: /flask-url imports must reference a valid flask endpoint/,
        },
        'fails with import specifiers': {
            code: "import 'flask-url:test';",
            error: /flask-url imports must use a default import/,
        },
        'fails with destructing import': {
            code: "import {test} from 'flask-url:test';",
            error: /flask-url imports must use a default import/,
        },
        'fails with multiple import specifiers': {
            code: "import {foo, bar} from 'flask-url:test';",
            error: /flask-url imports must use exactly one import/,
        },
        'uses the custom import prefix in errors': {
            code: "import {foo, bar} from 'myapp-url:test';",
            error: /myapp-url imports must use exactly one import/,
            pluginOptions: {
                importPrefix: 'myapp-url'
            }
        }
    },
});
