This package adds a `urls_to_json` command to the `flask`
CLI that dumps the URL map of the flask app to a JSON file.

It also provides the `flask_url_map_serializer` module containing
the following functions which convert rules from the URL map to a
JSON-serializable dict:

- `dump_url_rule(url_map, endpoint)`
- `dump_url_map(url_map)`
