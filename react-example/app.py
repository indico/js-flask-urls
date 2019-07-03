from flask import Flask, jsonify

app = Flask(__name__)


@app.route('/api/me/')
@app.route('/api/user/<name>/')
def user(name=None):
    return jsonify(is_self=(name is None), name=name)
