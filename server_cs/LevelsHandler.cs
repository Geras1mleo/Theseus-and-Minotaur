using System.Text.Json;
using System.Text.RegularExpressions;

namespace server;

public class LevelsHandler
{
    private readonly Dictionary<int, int> _highscores = new();
    private readonly Dictionary<int, object?> _levels = new();

    public LevelsHandler()
    {
        InitializeLevels();
    }

    private void InitializeLevels()
    {
        var files = Directory.GetFiles("../levels", "level*");
        foreach (var file in files)
        {
            var match = Regex.Match(file, "level(\\d+)\\.");
            if (match.Success)
            {
                var levelNumber = int.Parse(match.Groups[1].Value);
                _levels[levelNumber] = JsonSerializer.Deserialize<object>(File.ReadAllText(file));
            }
        }
    }

    public int GetLevelsCount() => _levels.Count;

    public object? GetLevel(int level)
    {
        return _levels.GetValueOrDefault(level);
    }

    public (object game, int level) GetRandomLevel() {
        var level = Random.Shared.Next(1, GetLevelsCount() + 1);
        return (GetLevel(level)!, level);
    }

    public (bool updated, int oldScore) UpdateHighscore(int level, int newScore)
    {
        if (_highscores.TryGetValue(level, out int currentHighscore))
        {
            if (currentHighscore > newScore)
                _highscores[level] = newScore;
            return (currentHighscore > newScore, currentHighscore);
        }
        _highscores[level] = newScore;
        return (true, -1);
    }

    public int GetHighscore(int level)
    {
        return _highscores.GetValueOrDefault(level, -1);
    }
}