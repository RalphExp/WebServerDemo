from flask import Flask

from flask import render_template, url_for

app = Flask(__name__)

@app.route('/iframe/<type>')
def iframe(type):
    if type == 'main':
        return render_template('iframe_main.html')

    if type == 'embedded':
        return render_template('iframe_embedded.html')

if __name__ == '__main__':
    app.run()
