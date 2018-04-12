#!/bin/sh

export FLASK_APP=test-data/app.py
flask url_map_to_json --pretty > test-data/url-map.json
