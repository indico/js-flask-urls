import json

import click
from flask import current_app
from flask.cli import with_appcontext
from werkzeug.routing import UnicodeConverter


def _rule_to_js(rule):
    # we skip UnicodeConverter since it never needs custom JS code
    return {
        'args': sorted(rule.arguments),
        'defaults': rule.defaults,
        'trace': [{'isDynamic': is_dynamic, 'data': data}
                  for is_dynamic, data in rule._trace],
        'converters': {key: type(converter).__name__
                       for key, converter in rule._converters.items()
                       if type(converter) is not UnicodeConverter}
    }


def dump_url_rule(url_map, endpoint):
    """Dump the URL rules for the given endpoint to a dict"""
    return {
        'endpoint': endpoint,
        'rules': [_rule_to_js(rule) for rule in url_map.iter_rules(endpoint)]
    }


def dump_url_map(url_map):
    """Dump all URL rules of the given URL map to a dict"""
    return {endpoint: dump_url_rule(url_map, endpoint)
            for endpoint in url_map._rules_by_endpoint}


@click.command('urls_to_json')
@click.option('--pretty', is_flag=True, help='Apply pretty formatting to JSON output')
@click.argument('file', type=click.File('w'), default='-')
@with_appcontext
def cli(pretty, file):
    """Dumps the URL map to JSON."""
    data = dump_url_map(current_app.url_map)
    pretty_opts = {
        'indent': 2,
        'separators': (',', ': '),
    } if pretty else {
        'separators': (',', ':')
    }
    json.dump(data, file, sort_keys=True, **pretty_opts)
    file.write('\n')
