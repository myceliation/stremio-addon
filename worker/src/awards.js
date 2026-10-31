// Festival and award rows that keep themselves current (awardsync.js): which Wikipedia page each one reads, and how
export const AWARD_LISTS = [
{
"id": "col-bestpic",
"name": "Oscars: Best Picture winners and nominees",
"page": "Academy Award for Best Picture",
"type": "movie",
"cfg": {
"section": "Winners and nominees"
}
},
{
"id": "col-bestpic-win",
"name": "Oscars: Best Picture winners",
"page": "Academy Award for Best Picture",
"type": "movie",
"cfg": {
"section": "Winners and nominees",
"winners": true
}
},
{
"id": "col-ifa-intl",
"name": "Oscars: Best International Feature winners and nominees",
"page": "Academy Award for Best International Feature Film",
"type": "movie",
"cfg": {
"section": "Winners"
}
},
{
"id": "col-animated-oscar",
"name": "Oscars: Best Animated Feature winners and nominees",
"page": "Academy Award for Best Animated Feature",
"type": "movie",
"cfg": {
"section": "Winners and nominees"
}
},
{
"id": "col-docs-oscar",
"name": "Oscars: Best Documentary winners and nominees",
"page": "Academy Award for Best Documentary Feature Film",
"type": "movie",
"cfg": {
"section": "Winners and nominees"
}
},
{
"id": "col-palme",
"name": "Cannes: Palme d'Or",
"page": "Palme d'Or",
"type": "movie",
"cfg": {
"section": "Award winners|Winners|Palme d'Or winners|Laureates"
}
},
{
"id": "col-cannes-gp",
"name": "Cannes: Grand Prix",
"page": "Grand Prix (Cannes Film Festival)",
"type": "movie",
"cfg": {}
},
{
"id": "col-cannes-jury",
"name": "Cannes: Jury Prize",
"page": "Jury Prize (Cannes Film Festival)",
"type": "movie",
"cfg": {}
},
{
"id": "col-ucr",
"name": "Cannes: Un Certain Regard prize",
"page": "Un Certain Regard",
"type": "movie",
"cfg": {
"section": "Prize|Award|Winners"
}
},
{
"id": "col-camera",
"name": "Cannes: Caméra d'Or (best first film)",
"page": "Caméra d'Or",
"type": "movie",
"cfg": {}
},
{
"id": "col-lion",
"name": "Venice: Golden Lion",
"page": "Golden Lion",
"type": "movie",
"cfg": {}
},
{
"id": "col-venice-gj",
"name": "Venice: Grand Jury Prize",
"page": "Grand Jury Prize (Venice Film Festival)",
"type": "movie",
"cfg": {}
},
{
"id": "col-bear",
"name": "Berlin: Golden Bear",
"page": "Golden Bear",
"type": "movie",
"cfg": {}
},
{
"id": "col-berlin-gj",
"name": "Berlin: Silver Bear Grand Jury Prize",
"page": "Silver Bear Grand Jury Prize",
"type": "movie",
"cfg": {}
},
{
"id": "col-sundance-drama",
"name": "Sundance: Grand Jury Prize (dramatic)",
"page": "Sundance Grand Jury Prize",
"type": "movie",
"cfg": {
"line": "Grand Jury Prize",
"notline": "Documentary|Short|World Cinema"
}
},
{
"id": "col-sundance-doc",
"name": "Sundance: Grand Jury Prize (documentary)",
"page": "Sundance Grand Jury Prize",
"type": "movie",
"cfg": {
"line": "Grand Jury Prize.*Documentary|Documentary.*Grand Jury Prize",
"notline": "Short|World Cinema"
}
},
{
"id": "col-sundance-world",
"name": "Sundance: World Cinema Grand Jury Prize",
"page": "Sundance Grand Jury Prize",
"type": "movie",
"cfg": {
"line": "World Cinema.*Grand Jury|Grand Jury.*World Cinema",
"notline": "Short"
}
},
{
"id": "col-sundance-audience",
"name": "Sundance: Audience Award",
"page": "Sundance Grand Jury Prize",
"type": "movie",
"cfg": {
"line": "Audience Award",
"notline": "Short"
}
},
{
"id": "col-tiff",
"name": "Toronto (TIFF): People's Choice Award",
"page": "Toronto International Film Festival People's Choice Award",
"type": "movie",
"cfg": {
"winners": true
}
},
{
"id": "col-locarno",
"name": "Locarno: Golden Leopard",
"page": "Golden Leopard",
"type": "movie",
"cfg": {}
},
{
"id": "col-sansebastian",
"name": "San Sebastián: Golden Shell",
"page": "Golden Shell",
"type": "movie",
"cfg": {}
},
{
"id": "col-karlovy",
"name": "Karlovy Vary: Crystal Globe",
"page": "Karlovy Vary International Film Festival",
"type": "movie",
"cfg": {
"section": "Crystal Globe|Grand Prix|Main competition|Awards"
}
},
{
"id": "col-rotterdam",
"name": "Rotterdam: Tiger Award",
"page": "Tiger Award",
"type": "movie",
"cfg": {}
},
{
"id": "col-annecy",
"name": "Annecy: best animated feature (Cristal)",
"page": "Annecy International Animation Film Festival",
"type": "movie",
"cfg": {
"section": "Feature|Cristal"
}
},
{
"id": "col-sitges",
"name": "Sitges: best film",
"page": "Sitges Film Festival",
"type": "movie",
"cfg": {
"section": "Best film|Best Film|Winners"
}
},
{
"id": "col-bafta",
"name": "BAFTA: Best Film winners and nominees",
"page": "BAFTA Award for Best Film",
"type": "movie",
"cfg": {
"section": "Winners and nominees|Winners|Nominees"
}
},
{
"id": "col-globe-drama",
"name": "Golden Globes: Best Motion Picture – Drama",
"page": "Golden Globe Award for Best Motion Picture – Drama",
"type": "movie",
"cfg": {
"section": "Winners and nominees|Winners"
}
},
{
"id": "col-globe-comedy",
"name": "Golden Globes: Best Motion Picture – Musical or Comedy",
"page": "Golden Globe Award for Best Motion Picture – Musical or Comedy",
"type": "movie",
"cfg": {
"section": "Winners and nominees|Winners"
}
},
{
"id": "col-cesar",
"name": "César: Best Film (France)",
"page": "César Award for Best Film",
"type": "movie",
"cfg": {}
},
{
"id": "col-goya",
"name": "Goya: Best Film (Spain)",
"page": "Goya Award for Best Film",
"type": "movie",
"cfg": {}
},
{
"id": "col-david",
"name": "David di Donatello: Best Film (Italy)",
"page": "David di Donatello for Best Film",
"type": "movie",
"cfg": {}
},
{
"id": "col-efa",
"name": "European Film Awards: Best Film",
"page": "European Film Award for Best Film",
"type": "movie",
"cfg": {}
},
{
"id": "col-spirit",
"name": "Independent Spirit: Best Film",
"page": "Independent Spirit Award for Best Film",
"type": "movie",
"cfg": {}
},
{
"id": "col-gotham",
"name": "Gotham Awards: Best Feature",
"page": "Gotham Independent Film Award for Best Feature",
"type": "movie",
"cfg": {}
},
{
"id": "col-nbr",
"name": "National Board of Review: Best Film",
"page": "National Board of Review Award for Best Film",
"type": "movie",
"cfg": {}
},
{
"id": "col-nyfcc",
"name": "New York Film Critics Circle: Best Film",
"page": "New York Film Critics Circle Award for Best Film",
"type": "movie",
"cfg": {}
},
{
"id": "col-golden-horse",
"name": "Golden Horse: Best Feature Film (Taiwan)",
"page": "Golden Horse Award for Best Feature Film",
"type": "movie",
"cfg": {}
},
{
"id": "col-hkfa",
"name": "Hong Kong Film Awards: Best Film",
"page": "Hong Kong Film Award for Best Film",
"type": "movie",
"cfg": {}
},
{
"id": "col-japan-academy",
"name": "Japan Academy: Picture of the Year",
"page": "Japan Academy Film Prize for Picture of the Year",
"type": "movie",
"cfg": {}
},
{
"id": "col-blue-dragon",
"name": "Blue Dragon: Best Film (Korea)",
"page": "Blue Dragon Film Award for Best Film",
"type": "movie",
"cfg": {}
},
{
"id": "col-golden-rooster",
"name": "Golden Rooster: Best Film (China)",
"page": "Golden Rooster Award for Best Film",
"type": "movie",
"cfg": {}
},
{
"id": "col-filmfare",
"name": "Filmfare: Best Film (India)",
"page": "Filmfare Award for Best Film",
"type": "movie",
"cfg": {}
},
{
"id": "col-national-india",
"name": "India's National Film Award: Best Feature Film",
"page": "National Film Award for Best Feature Film",
"type": "movie",
"cfg": {}
},
{
"id": "col-asian",
"name": "Asian Film Awards: Best Film",
"page": "Asian Film Award for Best Film",
"type": "movie",
"cfg": {}
},
{
"id": "col-ariel",
"name": "Ariel: Best Picture (Mexico)",
"page": "Ariel Award for Best Picture",
"type": "movie",
"cfg": {}
},
{
"id": "col-csa",
"name": "Canadian Screen Awards: Best Motion Picture",
"page": "Canadian Screen Award for Best Motion Picture",
"type": "movie",
"cfg": {}
},
{
"id": "col-aacta",
"name": "AACTA: Best Film (Australia)",
"page": "AACTA Award for Best Film",
"type": "movie",
"cfg": {}
},
{
"id": "col-saturn-scifi",
"name": "Saturn Award: Best Science Fiction Film",
"page": "Saturn Award for Best Science Fiction Film",
"type": "movie",
"cfg": {}
},
{
"id": "col-saturn-horror",
"name": "Saturn Award: Best Horror Film",
"page": "Saturn Award for Best Horror Film",
"type": "movie",
"cfg": {}
},
{
"id": "col-hugo",
"name": "Hugo Award: Best Dramatic Presentation",
"page": "Hugo Award for Best Dramatic Presentation, Long Form",
"type": "movie",
"cfg": {}
},
{
"id": "col-emmy-drama",
"name": "Emmys: Outstanding Drama Series",
"page": "Primetime Emmy Award for Outstanding Drama Series",
"type": "series",
"cfg": {}
},
{
"id": "col-emmy-comedy",
"name": "Emmys: Outstanding Comedy Series",
"page": "Primetime Emmy Award for Outstanding Comedy Series",
"type": "series",
"cfg": {}
},
{
"id": "col-emmy-limited",
"name": "Emmys: Outstanding Limited or Anthology Series",
"page": "Primetime Emmy Award for Outstanding Limited or Anthology Series",
"type": "series",
"cfg": {}
},
{
"id": "col-emmy-animated",
"name": "Emmys: Outstanding Animated Program",
"page": "Primetime Emmy Award for Outstanding Animated Program",
"type": "series",
"cfg": {}
},
{
"id": "col-globe-tv-drama",
"name": "Golden Globes: Best TV Series – Drama",
"page": "Golden Globe Award for Best Television Series – Drama",
"type": "series",
"cfg": {}
},
{
"id": "col-globe-tv-comedy",
"name": "Golden Globes: Best TV Series – Musical or Comedy",
"page": "Golden Globe Award for Best Television Series – Musical or Comedy",
"type": "series",
"cfg": {}
},
{
"id": "col-bafta-tv-drama",
"name": "BAFTA TV: Best Drama Series",
"page": "British Academy Television Award for Best Drama Series",
"type": "series",
"cfg": {}
},
{
"id": "col-intl-emmy-drama",
"name": "International Emmy: Best Drama Series",
"page": "International Emmy Award for Best Drama Series",
"type": "series",
"cfg": {}
}
];
