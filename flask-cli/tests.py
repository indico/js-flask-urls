import json

import pytest
from click.testing import CliRunner
from flask import Flask
from flask.cli import ScriptInfo
from werkzeug.routing import BaseConverter

from flask_url_map_serializer import cli, dump_url_map, dump_url_rule


@pytest.fixture(name='app')
def app_fixture():
    class ListConverter(BaseConverter):
        pass

    app = Flask(__name__, static_folder=None)
    app.url_map.converters['list'] = ListConverter

    @app.route('/opt/v/<x>')
    @app.route('/opt/')
    def optional_param(x=None):
        pass  # pragma: no coverage

    @app.route('/int/<int:n>')
    def int_param(n):
        pass  # pragma: no coverage

    @app.route('/p/<x>')
    def param(x):
        pass  # pragma: no coverage

    @app.route('/def/', defaults={'x': 'nope'})
    @app.route('/def/v/<x>')
    def default_param(x):
        pass  # pragma: no coverage

    @app.route('/no/')
    def no_params():
        pass  # pragma: no coverage

    @app.route('/file/<base>/<path:location>')
    def path_param(base, location):
        pass  # pragma: no coverage

    @app.route('/items/<list:items>')
    def list_param(items):
        pass  # pragma: no coverage

    return app


URL_MAP = {'default_param': {'endpoint': 'default_param',
                             'rules': [{'args': ['x'],
                                        'converters': {},
                                        'defaults': {'x': 'nope'},
                                        'trace': [{'data': '|', 'isDynamic': False},
                                                  {'data': '/def', 'isDynamic': False},
                                                  {'data': '/', 'isDynamic': False}]},
                                       {'args': ['x'],
                                        'converters': {},
                                        'defaults': None,
                                        'trace': [{'data': '|', 'isDynamic': False},
                                                  {'data': '/def/v/', 'isDynamic': False},
                                                  {'data': 'x', 'isDynamic': True}]}]},
           'int_param': {'endpoint': 'int_param',
                         'rules': [{'args': ['n'],
                                    'converters': {'n': 'IntegerConverter'},
                                    'defaults': None,
                                    'trace': [{'data': '|', 'isDynamic': False},
                                              {'data': '/int/', 'isDynamic': False},
                                              {'data': 'n', 'isDynamic': True}]}]},
           'list_param': {'endpoint': 'list_param',
                          'rules': [{'args': ['items'],
                                     'converters': {'items': 'ListConverter'},
                                     'defaults': None,
                                     'trace': [{'data': '|', 'isDynamic': False},
                                               {'data': '/items/', 'isDynamic': False},
                                               {'data': 'items', 'isDynamic': True}]}]},
           'no_params': {'endpoint': 'no_params',
                         'rules': [{'args': [],
                                    'converters': {},
                                    'defaults': None,
                                    'trace': [{'data': '|', 'isDynamic': False},
                                              {'data': '/no', 'isDynamic': False},
                                              {'data': '/', 'isDynamic': False}]}]},
           'optional_param': {'endpoint': 'optional_param',
                              'rules': [{'args': ['x'],
                                         'converters': {},
                                         'defaults': None,
                                         'trace': [{'data': '|', 'isDynamic': False},
                                                   {'data': '/opt/v/', 'isDynamic': False},
                                                   {'data': 'x', 'isDynamic': True}]},
                                        {'args': [],
                                         'converters': {},
                                         'defaults': None,
                                         'trace': [{'data': '|', 'isDynamic': False},
                                                   {'data': '/opt', 'isDynamic': False},
                                                   {'data': '/', 'isDynamic': False}]}]},
           'param': {'endpoint': 'param',
                     'rules': [{'args': ['x'],
                                'converters': {},
                                'defaults': None,
                                'trace': [{'data': '|', 'isDynamic': False},
                                          {'data': '/p/', 'isDynamic': False},
                                          {'data': 'x', 'isDynamic': True}]}]},
           'path_param': {'endpoint': 'path_param',
                          'rules': [{'args': ['base', 'location'],
                                     'converters': {'location': 'PathConverter'},
                                     'defaults': None,
                                     'trace': [{'data': '|', 'isDynamic': False},
                                               {'data': '/file/', 'isDynamic': False},
                                               {'data': 'base', 'isDynamic': True},
                                               {'data': '/', 'isDynamic': False},
                                               {'data': 'location', 'isDynamic': True}]}]}}


def test_dump_url_rule(app):
    assert dump_url_rule(app.url_map, 'param') == URL_MAP['param']


def test_dump_url_map(app):
    assert dump_url_map(app.url_map) == URL_MAP


@pytest.mark.parametrize('pretty', (True, False))
def test_cli(app, pretty):
    obj = ScriptInfo(create_app=lambda info: app)
    args = ['--pretty'] if pretty else None
    result = CliRunner().invoke(cli, args=args, obj=obj)
    assert result.exit_code == 0
    assert result.output == _dumps(dump_url_map(app.url_map), pretty=pretty)


def _dumps(data, pretty):
    pretty_opts = {
        'indent': 2,
        'separators': (',', ': '),
    } if pretty else {
        'separators': (',', ':')
    }
    return json.dumps(data, sort_keys=True, **pretty_opts) + '\n'
