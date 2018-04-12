"""Test app used to generate the url map for the unit tests"""

from flask import Flask
from werkzeug.routing import BaseConverter


class ListConverter(BaseConverter):
    """Matches a dash-separated list"""

    def __init__(self, map):
        BaseConverter.__init__(self, map)
        self.regex = '\w+(?:-\w+)*'

    def to_python(self, value):
        return value.split('-')

    def to_url(self, value):
        if isinstance(value, (list, tuple, set)):
            value = '-'.join(value)
        return super(ListConverter, self).to_url(value)


app = Flask(__name__, static_folder=None)
app.url_map.converters['list'] = ListConverter


@app.route('/opt/v/<x>')
@app.route('/opt/')
def optional_param(x=None):
    pass

@app.route('/int/<int:n>')
def int_param(n):
    pass

@app.route('/p/<x>')
def param(x):
    pass

@app.route('/def/', defaults={'x': 'nope'})
@app.route('/def/v/<x>')
def default_param(x):
    pass

@app.route('/no/')
def no_params():
    pass

@app.route('/file/<base>/<path:location>')
def path_param(base, location):
    pass

@app.route('/items/<list:items>')
def list_param(items):
    pass
