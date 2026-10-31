// "Normal genres": ordinary genres and the usual combinations, for browsing without picking a niche.
// [name, params] per type; "," = all of, "|" = any of (TMDB's rules).
const G = { action: 28, adventure: 12, animation: 16, comedy: 35, crime: 80, documentary: 99, drama: 18, family: 10751, fantasy: 14,
  history: 36, horror: 27, music: 10402, mystery: 9648, romance: 10749, scifi: 878, tvmovie: 10770, thriller: 53, war: 10752, western: 37 };
const g = (...k) => ({ with_genres: k.map(x => G[x]).join(",") });
const kw = (ids, extra = {}) => ({ with_keywords: ids, ...extra });
export const NORMAL_MOVIE = [
  ["Action", g("action")], ["Adventure", g("adventure")], ["Animation", g("animation")], ["Comedy", g("comedy")], ["Crime", g("crime")],
  ["Documentary", g("documentary")], ["Drama", g("drama")], ["Family", g("family")], ["Fantasy", g("fantasy")], ["History", g("history")],
  ["Horror", g("horror")], ["Music", g("music")], ["Mystery", g("mystery")], ["Romance", g("romance")], ["Science fiction", g("scifi")],
  ["Made for TV", g("tvmovie")], ["Thriller", g("thriller")], ["War", g("war")], ["Western", g("western")],
  ["Action comedy", g("action", "comedy")], ["Action thriller", g("action", "thriller")], ["Action adventure", g("action", "adventure")],
  ["Action crime", g("action", "crime")], ["Action war", g("action", "war")], ["Sci-fi action", g("scifi", "action")],
  ["Sci-fi adventure", g("scifi", "adventure")], ["Sci-fi thriller", g("scifi", "thriller")], ["Sci-fi drama", g("scifi", "drama")],
  ["Sci-fi comedy", g("scifi", "comedy")], ["Sci-fi horror", g("scifi", "horror")], ["Fantasy adventure", g("fantasy", "adventure")],
  ["Fantasy horror", g("fantasy", "horror")], ["Romantic fantasy", g("romance", "fantasy")], ["Family fantasy", g("family", "fantasy")],
  ["Family adventure", g("family", "adventure")], ["Family comedy", g("family", "comedy")], ["Animated comedy", g("animation", "comedy")],
  ["Animated adventure", g("animation", "adventure")], ["Animated fantasy", g("animation", "fantasy")], ["Animated sci-fi", g("animation", "scifi")],
  ["Adventure comedy", g("adventure", "comedy")], ["Romantic comedy", g("romance", "comedy")], ["Romantic drama", g("romance", "drama")],
  ["Comedy drama", g("comedy", "drama")], ["Crime drama", g("crime", "drama")], ["Crime thriller", g("crime", "thriller")],
  ["Crime comedy", g("crime", "comedy")], ["Mystery thriller", g("mystery", "thriller")], ["Mystery drama", g("mystery", "drama")],
  ["Horror thriller", g("horror", "thriller")], ["Horror comedy", g("horror", "comedy")], ["Historical drama", g("history", "drama")],
  ["War drama", g("war", "drama")], ["Western drama", g("western", "drama")], ["Western comedy", g("western", "comedy")],
  ["Music drama", g("music", "drama")], ["Musical comedy", g("music", "comedy")], ["Music documentary", g("documentary", "music")],
  ["History documentary", g("documentary", "history")], ["Crime documentary", g("documentary", "crime")], ["War documentary", g("documentary", "war")],
  ["Spy films", kw("470")], ["Superhero films", kw("9715")], ["Biopics", kw("5565")], ["Musicals", kw("4344")], ["Sports films", kw("333328|6075")],
  ["Teen films", kw("296608|6270")], ["Disaster films", kw("10617")], ["Martial arts films", kw("779")], ["Monster movies", kw("1299")],
  ["Slashers", kw("12339")], ["Psychological thrillers", kw("12565")], ["Supernatural", kw("6152")], ["Erotic films", kw("190370")],
  ["Political thrillers", kw("209817")], ["Courtroom", kw("33519")], ["Road movies", kw("167043")], ["Buddy comedies", kw("167541")],
  ["Satire", kw("8201")], ["Parody", kw("9755")], ["Christmas films", kw("207317")], ["Survival", kw("10349")], ["Coming of age", kw("10683")],
  ["Based on a true story", kw("9672")], ["Based on a book", kw("818")], ["Remakes", kw("9714")], ["Sequels", kw("9663")], ["Heists", kw("10051")],
  ["Detectives", kw("703")], ["Gangsters", kw("3149|10391")], ["Serial killers", kw("10714")], ["Time travel", kw("4379")], ["Space", kw("9882")],
  ["Dystopias", kw("4565")], ["Post-apocalyptic", kw("4458")], ["Zombies", kw("12377")], ["Vampires", kw("3133")], ["Ghosts", kw("162846|3358")],
  ["Witches", kw("616")], ["Aliens", kw("9951")], ["Robots", kw("14544")], ["Dragons", kw("12554")], ["Fairy tales", kw("3205")],
  ["Swashbucklers", kw("157186")], ["Film noir", kw("9807|379729")], ["Neo-noir", kw("207268")], ["Prison", kw("378")], ["Revenge", kw("9748")],
  ["Kidnapping", kw("1930")], ["Conspiracy", kw("10410")], ["Friendship", kw("6054")], ["Weddings", kw("13027")], ["Holidays", kw("65")],
  ["Anime", kw("210024")], ["Stop motion", kw("10121")], ["Cult films", kw("374649")], ["B movies", kw("11034")], ["Exploitation", kw("2804")],
  ["Independent films", kw("281237")], ["Short films", kw("263548")], ["Silent films", kw("154802")], ["Black and white", kw("12999")],
  ["Dance", kw("1691")], ["Concert films", kw("6029")], ["Stand-up comedy", kw("9716")], ["Found footage", kw("163053")], ["Anthologies", kw("9706")],
];
const T = { action: 10759, animation: 16, comedy: 35, crime: 80, documentary: 99, drama: 18, family: 10751, kids: 10762, mystery: 9648,
  news: 10763, reality: 10764, scifi: 10765, soap: 10766, talk: 10767, war: 10768, western: 37 };
const t = (...k) => ({ with_genres: k.map(x => T[x]).join(",") });
export const NORMAL_SERIES = [
  ["Action & adventure", t("action")], ["Animation", t("animation")], ["Comedy", t("comedy")], ["Crime", t("crime")], ["Documentary", t("documentary")],
  ["Drama", t("drama")], ["Family", t("family")], ["Kids", t("kids")], ["Mystery", t("mystery")], ["News", t("news")], ["Reality", t("reality")],
  ["Sci-fi & fantasy", t("scifi")], ["Soaps", t("soap")], ["Talk shows", t("talk")], ["War & politics", t("war")], ["Western", t("western")],
  ["Crime drama", t("crime", "drama")], ["Comedy drama", t("comedy", "drama")], ["Mystery drama", t("mystery", "drama")],
  ["Sci-fi drama", t("scifi", "drama")], ["Animated comedy", t("animation", "comedy")], ["Animated sci-fi & fantasy", t("animation", "scifi")],
  ["Action crime", t("action", "crime")], ["Action sci-fi", t("action", "scifi")], ["Family comedy", t("family", "comedy")],
  ["Crime documentary", t("documentary", "crime")], ["Political drama", t("war", "drama")], ["Mystery crime", t("mystery", "crime")],
  ["Sitcoms", kw("193171")], ["Spy series", kw("470")], ["Superheroes", kw("9715")], ["Teen series", kw("296608|6270")], ["Supernatural", kw("6152")],
  ["Detectives", kw("703")], ["Medical", kw("11612")], ["Legal", kw("33519")], ["Serial killers", kw("10714")], ["Time travel", kw("4379")],
  ["Space", kw("9882")], ["Dystopias", kw("4565")], ["Zombies", kw("12377")], ["Vampires", kw("3133")], ["Anime", kw("210024")],
  ["Miniseries", kw("11162")], ["Anthologies", kw("9706")], ["Sketch comedy", kw("156203")], ["Stand-up", kw("9716")], ["Based on a book", kw("818")],
  ["Based on a true story", kw("9672")], ["Coming of age", kw("10683")], ["Mockumentary", kw("11800")], ["Period drama", kw("15060")],
];
