import random

from flask import Flask, request, abort, Response
from flask_cors import CORS
import json
import levels_handler

app = Flask(__name__)
CORS(app)


# ============================================================
# ===== LEVEL ROUTING ========================================
# ============================================================

@app.route('/levels')
def fetch_levels():
    return Response(json.dumps({
        "aantal_levels": len(levels_handler.get_levels()),
    }), mimetype='application/json')


@app.route('/level/<int:level>')
def fetch_level(level: int):
    game = levels_handler.get_level(level)
    if not game:
        return Response(json.dumps({
            "foutboodschap": f'Puzzel {level} bestaat niet.'
        }), status=404, mimetype='application/json')

    return Response(json.dumps({
        'level': level,
        'game': json.loads(game),
        'highscore': levels_handler.highscores.get(level, -1)
    }), mimetype='application/json')


@app.route('/random_level')
def fetch_random_level():
    rand = random.randint(1, len(levels_handler.get_levels()))
    return fetch_level(rand)


# ============================================================
# ===== HIGHSCORE ROUTING ====================================
# ============================================================

@app.route('/highscore/<int:level>', methods=['POST'])
def update_highscore(level: int):
    request_json = request.get_json()
    if 'highscore' not in request_json:
        return Response("Bad request", status=400)

    new_score = request_json['highscore']
    updated, old_score = levels_handler.update_highscore(level, new_score)
    if updated:
        return Response(json.dumps({
            "status": f'Highscore succesvol bijgewerkt van {old_score} naar {new_score}.'
        }), mimetype='application/json')
    else:
        return Response("{}", status=304, mimetype='application/json')


if __name__ == '__main__':
    app.run(port=3000)
