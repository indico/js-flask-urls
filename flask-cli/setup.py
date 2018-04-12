from setuptools import setup


long_description = '''
This package adds a ``urls_to_json`` command to the ``flask``
CLI that dumps the URL map of the flask app to a JSON file.

It also provides the ``flask_url_map_serializer`` module containing
the following functions which convert rules from the URL map to a
JSON-serializable dict:

- ``dump_url_rule(url_map, endpoint)``
- ``dump_url_map(url_map)```
'''.strip()

setup(
    name='flask_url_map_serializer',
    version='0.0.1',
    url='https://github.com/indico/babel-plugin-flask-urls',
    license='MIT',
    author='Indico Team',
    author_email='indico-team@cern.ch',
    description='Dumps the URL map of a flask app to a JSON file',
    long_description=long_description,
    py_modules=('flask_url_map_serializer',),
    zip_safe=False,
    install_requires=[
        'click',
        'flask>=0.11'
    ],
    entry_points={
        'flask.commands': {
            'url_map_to_json = flask_url_map_serializer:cli'
        }
    }
)
