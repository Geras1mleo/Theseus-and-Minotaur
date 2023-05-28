using System.Text.Json.Nodes;
using server;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton(new LevelsHandler());
builder.Services.AddCors();

var app = builder.Build();

app.UseCors(x => x
    .WithOrigins(app.Configuration["AllowedOrigins"].Split(";"))
    .AllowAnyMethod()
    .AllowAnyHeader());

app.MapGet("/levels", (LevelsHandler handler) => Results.Ok(new { aantal_levels = handler.GetLevelsCount() }));

app.MapGet("/level/{level:int}", (int level, LevelsHandler handler) =>
{
    var game = handler.GetLevel(level);
    if (game == null)
        return Results.NotFound(new { foutboodschap = $"Puzzel {level} bestaat niet." });
    return Results.Ok(new
    {
        level,
        game,
        highscore = handler.GetHighscore(level)
    });
});

app.MapGet("/random_level", (LevelsHandler handler) =>{
    (object game, int level) = handler.GetRandomLevel();
    return Results.Ok(new
    {
        level,
        game,
        highscore = handler.GetHighscore(level)
    });
});


app.MapPost("/highscore/{level:int}", async (int level, HttpContext context, LevelsHandler handler) =>
{
    using var reader = new StreamReader(context.Request.Body);
    var body = await reader.ReadToEndAsync();
    try
    {
        var node = JsonNode.Parse(body)!.AsObject();
        var newScore = node["highscore"]!.GetValue<int>();
        var (updated, oldScore) = handler.UpdateHighscore(level, newScore);
        if (updated)
            return Results.Ok(new
            {
                status = $"Highscore succesvol bijgewerkt van {oldScore} naar {newScore}.",
            });
    }
    catch (Exception)
    {
        return Results.BadRequest("Bad request");
    }
    return Results.StatusCode(304);
});

app.Run();