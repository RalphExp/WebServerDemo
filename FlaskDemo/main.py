from flask import Flask

from flask import render_template

import layout

app = Flask(__name__)

@app.route('/iframe/<type>')
def iframe(type):
    if type == 'main':
        return render_template('main.html')

    if type == 'embedded':
        return render_template('embedded.html')

if __name__ == '__main__':
    app.run()
