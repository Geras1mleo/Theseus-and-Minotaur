from os import listdir

highscores = dict()


def update_highscore(level, new_score: str):
    current = highscores.get(level)
    if not current or new_score < current:
        highscores[level] = new_score
        return True, current if current else -1

    return False, None


def get_levels():
    return [file for file in listdir('../levels') if file.startswith('level')]


def get_level(level: int):
    path = f'level{level}.json'
    if path in get_levels():
        with open('../levels/' + path, 'r', encoding='utf-8') as file:
            return '\n'.join(file.readlines())
    else:
        return None
