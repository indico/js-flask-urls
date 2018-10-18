from flask import Flask, render_template


app = Flask(__name__)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/my-profile/')
@app.route('/user/<name>/profile')
def user(name=None):
    return render_template('profile.html', name=name)
