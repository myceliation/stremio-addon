import { SHORT25 } from "./shortnames.js";
import { STUDIO_TWINS } from "./studiotwins.js";
import { NEW_ROWS } from "./newrows.js";
import { CURATED } from "./curated.js";
import { CURATED2 } from "./curated2.js";
import { CURATED3 } from "./curated3.js";
import { CURATED4 } from "./curated4.js";
import { MG_ITEMS } from "./mgitems.js";
import { FUTURES } from "./futures.js";
import { FUTURES_MORE } from "./futuresmore.js";
import { NORMAL_MOVIE, NORMAL_SERIES } from "./normal.js";
import { WIKI_MICROGENRES } from "./wikimg.js";
import { PREJUDICE_MG, PREJUDICE_BASE, PREJUDICE_PICKS } from "./prejudice.js";
import { EXTREME_PICKS, RAZZIES, WORST } from "./badfilms.js";
import { REGION_MG } from "./regions.js";
import { SIDE_PICKS } from "./sidepicks.js";
import { FAM2_MG } from "./families2.js";
// Generated from TMDB keyword ids; every entry was checked to return 18+ titles.
// params are passed straight to /discover/{movie|tv}.
export const MICROGENRES = [{"id":"folk-horror","name":"Folk horror: rituals, fields and old gods","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"209568"}},
{"id":"80s-slashers","name":"Slasher films of the 1980s","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"12339","primary_release_date.gte":"1980-01-01","primary_release_date.lte":"1989-12-31"}},
{"id":"body-horror","name":"Body horror","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"283085"}},
{"id":"cosmic-horror","name":"Cosmic and Lovecraftian horror","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"287274|215959"}},
{"id":"creature-features","name":"Creature features","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"158126"}},
{"id":"giallo","name":"Italian giallo","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"361094"}},
{"id":"found-footage","name":"Found-footage horror","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"27","without_genres":"16,10751","with_keywords":"163053"}},
{"id":"haunted-houses","name":"Haunted house films","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"3358"}},
{"id":"killer-animals","name":"Nature strikes back: killer animals","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"27|53","without_genres":"16,10751,12","with_keywords":"321335|5160|14662|2988"}},
{"id":"horror-comedy","name":"Horror comedies","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":200,"with_genres":"27,35","without_genres":"16,10751"}},
{"id":"japanese-horror","name":"Japanese supernatural horror","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"27","without_genres":"16,10751","with_origin_country":"JP"}},
{"id":"witches","name":"Witches and witchcraft","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"27|53|18","without_genres":"16,10751","with_keywords":"616|40931"}},
{"id":"cults","name":"Cults and communes","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"162766|159028|2412"}},
{"id":"cabin-woods","name":"A cabin in the woods","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"27","without_genres":"16,10751","with_keywords":"13209|3623"}},
{"id":"italian-horror-70s","name":"Italian horror of the 70s and 80s","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"27","without_genres":"16,10751","primary_release_date.gte":"1970-01-01","primary_release_date.lte":"1989-12-31","with_origin_country":"IT"}},
{"id":"cerebral-70s-scifi","name":"Cerebral 1970s sci-fi","type":"movie","params":{"sort_by":"vote_average.desc","vote_count.gte":150,"with_genres":"878","without_genres":"16,10751","primary_release_date.gte":"1970-01-01","primary_release_date.lte":"1979-12-31"}},
{"id":"dystopias","name":"Dystopian futures","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"4565"}},
{"id":"cyberpunk","name":"Cyberpunk","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"12190"}},
{"id":"time-loops","name":"Stuck in a time loop","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"10854"}},
{"id":"first-contact","name":"First contact","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"211248|160515"}},
{"id":"ai-minds","name":"Artificial intelligence (AI & thinking machines)","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"310|803"}},
{"id":"post-apocalypse","name":"After the end of the world","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"4458"}},
{"id":"soviet-scifi","name":"Soviet and Eastern Bloc sci-fi","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"878","without_genres":"16,10751","with_origin_country":"SU"}},
{"id":"nature-docs","name":"Nature documentaries","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"99","without_genres":"16,10751","with_keywords":"18330|9902"}},
{"id":"insects","name":"Insects and things that crawl","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"332|7035|193068|349958"}},
{"id":"swamps","name":"Swamps, bayous and wetlands","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751,14,878","with_keywords":"4551|9750|162775"}},
{"id":"fungi","name":"Mushrooms, spores and fungi","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"221253|333"}},
{"id":"wilderness-survival","name":"Survival in the wild","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"3593,10349"}},
{"id":"ocean-deep","name":"Down in the deep ocean","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751,28","with_keywords":"2769|14785"}},
{"id":"mountains","name":"Mountains and climbers","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"160177|159212"}},
{"id":"slow-burn-psych","name":"Slow-burn psychological thrillers","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":200,"with_genres":"53","without_genres":"16,10751","with_keywords":"12565"}},
{"id":"neo-noir","name":"Neo-noir","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"207268"}},
{"id":"heists","name":"Heist films","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751,878","with_keywords":"10051"}},
{"id":"paranoid-70s","name":"Paranoid 1970s thrillers","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"53","without_genres":"16,10751","with_keywords":"10410|2340","primary_release_date.gte":"1970-01-01","primary_release_date.lte":"1979-12-31"}},
{"id":"90s-erotic-thrillers","name":"Erotic thrillers of the 1990s","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"207767","primary_release_date.gte":"1990-01-01","primary_release_date.lte":"1999-12-31"}},
{"id":"small-town-secrets","name":"Small towns with secrets","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"9648","without_genres":"16,10751","with_keywords":"1415"}},
{"id":"korean-thrillers","name":"Korean thrillers","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":50,"with_genres":"53","without_genres":"16,10751","with_origin_country":"KR"}},
{"id":"nordic-noir","name":"Nordic noir","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"80","without_genres":"16,10751","with_origin_country":"SE|DK|NO|FI|IS"}},
{"id":"revenge","name":"Cold-blooded revenge","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"53","without_genres":"16,10751","with_keywords":"9748"}},
{"id":"whodunits","name":"Whodunits","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"12570"}},
{"id":"true-crime","name":"Based on true crimes","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"80","without_genres":"16,10751","with_keywords":"9672"}},
{"id":"dark-comedy-death","name":"Dark comedies about death","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":5,"with_genres":"35","without_genres":"16,10751","with_keywords":"10123,34079"}},
{"id":"mockumentary","name":"Mockumentaries","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"11800"}},
{"id":"road-movies","name":"Road movies","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751,14","with_keywords":"167043"}},
{"id":"stoner","name":"Stoner comedies","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"35","without_genres":"16,10751","with_keywords":"302399|10776"}},
{"id":"surreal","name":"Surreal and dreamlike","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":100,"without_genres":"16,10751,12","with_keywords":"9887|3307"}},
{"id":"absurdist","name":"Absurdist comedy","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"35","without_genres":"16,10751","with_keywords":"214655"}},
{"id":"satire","name":"Satire","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"8201"}},
{"id":"psychedelic","name":"Psychedelic cinema","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"184392|5498"}},
{"id":"movies-about-movies","name":"Movies about making movies","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"33490|886"}},
{"id":"hk-action","name":"Hong Kong action","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"28","without_genres":"16,10751","with_origin_country":"HK"}},
{"id":"spaghetti-westerns","name":"Spaghetti westerns","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"156212"}},
{"id":"french-new-wave","name":"French cinema of the 1960s","type":"movie","params":{"sort_by":"vote_count.desc","vote_count.gte":20,"without_genres":"16,10751","primary_release_date.gte":"1959-01-01","primary_release_date.lte":"1969-12-31","with_origin_country":"FR"}},
{"id":"martial-arts","name":"Martial arts","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"779"}},
{"id":"stop-motion","name":"Stop-motion","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"10121"}},
{"id":"adult-animation","name":"Animation for adults","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"16","with_keywords":"161919"}},
{"id":"anime-films","name":"Anime films","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":100,"with_genres":"16","with_original_language":"ja"}},
{"id":"punk","name":"Punk on film","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"4470|173919|345148"}},
{"id":"music-docs","name":"Music documentaries","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"99,10402","without_genres":"16,10751"}},
{"id":"mythology","name":"Myths and ancient gods","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"2035|2036"}},
{"id":"submarines","name":"Submarines","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"339"}},
{"id":"pirates","name":"Pirates","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"12988"}},
{"id":"tv-nature","name":"Nature docuseries","type":"series","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"99","without_genres":"16,10762","with_keywords":"18330|9902"}},
{"id":"tv-anime","name":"Anime series","type":"series","params":{"sort_by":"popularity.desc","vote_count.gte":100,"with_genres":"16","with_original_language":"ja"}},
{"id":"tv-british-comedy","name":"British comedy series","type":"series","params":{"sort_by":"popularity.desc","vote_count.gte":50,"with_genres":"35","without_genres":"10767,10764,9648","with_origin_country":"GB"}},
{"id":"tv-nordic-noir","name":"Nordic noir series","type":"series","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"80","without_genres":"16,10762","with_origin_country":"SE|DK|NO|FI|IS"}},
{"id":"tv-korean-drama","name":"Korean dramas","type":"series","params":{"sort_by":"popularity.desc","vote_count.gte":50,"with_genres":"18","without_genres":"16,10762","with_origin_country":"KR"}},
{"id":"tv-adult-animation","name":"Animated series for adults","type":"series","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"16","with_keywords":"161919"}},
{"id":"tv-true-crime","name":"True-crime docuseries","type":"series","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"99","without_genres":"16,10762","with_keywords":"33722"}},
{"id":"tv-sci-fi-anthology","name":"Sci-fi anthologies","type":"series","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"10765","without_genres":"16,10762","with_keywords":"9706"}},
{"id":"tv-mockumentary","name":"Mockumentary series","type":"series","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10762","with_keywords":"11800"}},
{"id":"tv-cozy-mystery","name":"Cozy mysteries","type":"series","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"9648","without_genres":"16,10762","with_keywords":"1735"}},
{"id":"vampires","name":"Vampires, old and new","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"27|18|53","without_genres":"16,10751","with_keywords":"3133"}},
{"id":"werewolves","name":"Werewolves and full moons","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"27","without_genres":"16,10751","with_keywords":"12564"}},
{"id":"zombie-comedy","name":"Zombie comedies","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"35","without_genres":"16,10751","with_keywords":"12377"}},
{"id":"zombies-serious","name":"Zombies played straight","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"27","without_genres":"35,16,10751","with_keywords":"12377"}},
{"id":"possession","name":"Possession and exorcism","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"2626|161261"}},
{"id":"home-invasion","name":"Home invasion","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"14903"}},
{"id":"summer-camp-horror","name":"Summer-camp horror","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"27","without_genres":"16,10751","with_keywords":"5767"}},
{"id":"christmas-horror","name":"Christmas horror","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"27","without_genres":"16,10751","with_keywords":"207317"}},
{"id":"halloween-night","name":"Set on Halloween night","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"3335"}},
{"id":"dolls","name":"Creepy dolls and puppets","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"27","without_genres":"16,10751","with_keywords":"33630|6300|9704"}},
{"id":"killer-clowns","name":"Clowns","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"27|53","without_genres":"16,10751","with_keywords":"3199"}},
{"id":"mad-scientists","name":"Mad scientists","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"27|878","without_genres":"12,16,10751","with_keywords":"10125"}},
{"id":"doppelgangers","name":"Doppelgängers","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"27|53|9648","without_genres":"16,10751","with_keywords":"161891|376610"}},
{"id":"gothic-romance","name":"Gothic romance","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"10749|18","without_genres":"16,10751","with_keywords":"33505"}},
{"id":"satanic-panic","name":"Satanism and the occult","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"27","without_genres":"16,10751","with_keywords":"3099|156174"}},
{"id":"nuns","name":"Nuns, convents and bad omens","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"27|53|18","without_genres":"16,10751","with_keywords":"745|270343"}},
{"id":"cannibals","name":"Cannibals","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"27|53","without_genres":"16,10751","with_keywords":"278235|14895"}},
{"id":"hospital-horror","name":"Hospitals and asylums","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"27|53","without_genres":"16,10751","with_keywords":"2884|11857|10323"}},
{"id":"snow-horror","name":"Snowbound terror","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"27|53","without_genres":"16,10751","with_keywords":"10794|156783"}},
{"id":"desert-horror","name":"Desert dread","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"27|53","without_genres":"16,10751","with_keywords":"18034"}},
{"id":"ocean-horror","name":"Sharks","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"15097"}},
{"id":"snakes","name":"Snakes","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"27","without_genres":"16,10751","with_keywords":"1585|3891"}},
{"id":"bears-wolves","name":"Bears and wolves","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"27|53|12","without_genres":"16,10751","with_keywords":"158175|1994"}},
{"id":"kaiju","name":"Kaiju and giant monsters","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"161791"}},
{"id":"dinosaurs","name":"Dinosaurs","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"12616"}},
{"id":"haunted-hotels","name":"Haunted hotels","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"27","without_genres":"16,10751","with_keywords":"612"}},
{"id":"ghost-stories-asia","name":"Asian ghost stories","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"27","without_genres":"16,10751","with_keywords":"162846","with_origin_country":"JP|KR|TH|HK|TW|CN"}},
{"id":"spanish-horror","name":"Spanish horror","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":50,"with_genres":"27","without_genres":"16,10751","with_origin_country":"ES"}},
{"id":"mexican-horror","name":"Mexican horror","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"27","without_genres":"16,10751","with_origin_country":"MX"}},
{"id":"french-extremity","name":"New French extremity","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"27","without_genres":"16,10751","primary_release_date.gte":"2000-01-01","primary_release_date.lte":"2012-12-31","with_origin_country":"FR"}},
{"id":"70s-horror","name":"Grimy 1970s horror","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":100,"with_genres":"27","without_genres":"16,10751","primary_release_date.gte":"1970-01-01","primary_release_date.lte":"1979-12-31"}},
{"id":"50s-monsters","name":"1950s atomic monsters","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":40,"with_genres":"27|878","without_genres":"16,10751","primary_release_date.gte":"1950-01-01","primary_release_date.lte":"1959-12-31"}},
{"id":"grindhouse","name":"Grindhouse and exploitation","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"11532|335236"}},
{"id":"b-movies","name":"Gloriously cheap B-movies","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"11034"}},
{"id":"folk-tales","name":"Dark fairy tales","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"27|14|18","without_genres":"16,10751","with_keywords":"3205"}},
{"id":"time-travel","name":"Time travel paradoxes","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"4379|208757"}},
{"id":"parallel-worlds","name":"Parallel worlds","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751,28","with_keywords":"33465|336874"}},
{"id":"clones","name":"Clones","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"402|11628"}},
{"id":"cyborgs","name":"Cyborgs and body upgrades","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"679"}},
{"id":"alien-invasion","name":"Alien invasion","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"878|27","without_genres":"12,16,10751","with_keywords":"14909"}},
{"id":"the-moon","name":"The Moon","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"878|99|18","without_genres":"16,10751","with_keywords":"305"}},
{"id":"space-stations","name":"Space stations and lonely ships","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"878","without_genres":"16,10751","with_keywords":"156039|1612|252937"}},
{"id":"astronauts","name":"Astronauts","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"14626"}},
{"id":"virtual-reality","name":"Virtual reality","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"4563"}},
{"id":"hackers","name":"Hackers","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"53|80","without_genres":"12","with_keywords":"2157|303918"}},
{"id":"surveillance","name":"Surveillance states","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"53","without_genres":"16,10751","with_keywords":"18420"}},
{"id":"pandemics","name":"Pandemics and outbreaks","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"188973|17995|188957"}},
{"id":"nuclear","name":"Nuclear dread","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"677|1815|160381"}},
{"id":"climate","name":"Climate and ecological collapse","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16","with_keywords":"2210|33480"}},
{"id":"disasters","name":"Natural disasters","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"28|18|53","without_genres":"14,16,10751,27","with_keywords":"5096|3521|3347|2213|6941"}},
{"id":"mutants","name":"Mutants and radiation","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"1852|1618"}},
{"id":"genetic","name":"Genetic engineering","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"163561"}},
{"id":"memory-loss","name":"Memory loss","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"1453|11469"}},
{"id":"body-swap","name":"Body swaps","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"33721"}},
{"id":"shapeshifters","name":"Shapeshifters","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"1370|350919"}},
{"id":"invisibility","name":"Invisibility","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"189115|271162"}},
{"id":"80s-scifi","name":"1980s sci-fi on a budget","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":80,"with_genres":"878","without_genres":"16,10751","primary_release_date.gte":"1980-01-01","primary_release_date.lte":"1989-12-31"}},
{"id":"90s-cyber","name":"1990s cyber-thrillers","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"6104|11615|2157","primary_release_date.gte":"1990-01-01","primary_release_date.lte":"1999-12-31"}},
{"id":"japanese-scifi","name":"Japanese sci-fi","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"878","without_genres":"16","with_origin_country":"JP"}},
{"id":"korean-scifi","name":"Korean genre films","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"878|14|27","without_genres":"16,10751","with_origin_country":"KR"}},
{"id":"solarpunk-utopias","name":"Utopias (and utopias gone wrong)","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"3469"}},
{"id":"serial-killers","name":"Serial killer procedurals","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"80","without_genres":"16,10751","with_keywords":"10714"}},
{"id":"hitmen","name":"Hitmen and assassins","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"2708|782"}},
{"id":"bank-robbery","name":"Bank robberies","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"15363"}},
{"id":"con-artists","name":"Con artists and grifters","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"10453|180250|11454"}},
{"id":"yakuza","name":"Yakuza","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"1794"}},
{"id":"mafia","name":"The mafia","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"10391|11578"}},
{"id":"cartels","name":"Cartels","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"10175"}},
{"id":"prison","name":"Prison films","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"18|80|53","without_genres":"16,10751","with_keywords":"378"}},
{"id":"prison-escape","name":"Prison breaks","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"9777"}},
{"id":"courtroom","name":"Courtroom dramas","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"33519"}},
{"id":"journalists","name":"Journalists chasing the story","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"18|53","without_genres":"16,10751","with_keywords":"917|736|195240"}},
{"id":"kidnapping","name":"Kidnappings","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"53","without_genres":"16,10751","with_keywords":"1930"}},
{"id":"hostage","name":"Hostage situations","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"53","without_genres":"16,10751","with_keywords":"1562"}},
{"id":"spies-cold-war","name":"Cold War spies","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"2106,470"}},
{"id":"spies-all","name":"Spies","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"470|5265"}},
{"id":"conspiracy","name":"Conspiracies","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"53","without_genres":"16,10751","with_keywords":"10410"}},
{"id":"buddy-cops","name":"Buddy cops","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"167316"}},
{"id":"police-corruption","name":"Dirty cops","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"11734|267608"}},
{"id":"vigilantes","name":"Vigilantes","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"7002"}},
{"id":"gambling","name":"Gambling and casinos","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"395|585|383"}},
{"id":"las-vegas","name":"Las Vegas","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"14570"}},
{"id":"new-orleans","name":"New Orleans","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"2411"}},
{"id":"texas","name":"Texas","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"1556"}},
{"id":"tokyo","name":"Tokyo","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"12369"}},
{"id":"paris","name":"Paris","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"90"}},
{"id":"nyc-70s","name":"New York in the 1970s","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"242","primary_release_date.gte":"1970-01-01","primary_release_date.lte":"1979-12-31"}},
{"id":"la-noir","name":"Los Angeles noir","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"80|53","without_genres":"16,10751","with_keywords":"12670"}},
{"id":"twist-endings","name":"Twist endings","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"326438|275311"}},
{"id":"nonlinear","name":"Nonlinear timelines","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"157171"}},
{"id":"real-time","name":"Told in real time","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":5,"without_genres":"16,10751","with_keywords":"173361"}},
{"id":"one-night","name":"Everything happens in one night","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"162914"}},
{"id":"british-gangsters","name":"British gangsters","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"3149","with_origin_country":"GB"}},
{"id":"hk-triads","name":"Hong Kong triads","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"41383","with_origin_country":"HK"}},
{"id":"french-crime","name":"French crime films","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":50,"with_genres":"80","without_genres":"16,10751","with_origin_country":"FR"}},
{"id":"italian-poliziotteschi","name":"Italian crime of the 1970s","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"80","without_genres":"16,10751","primary_release_date.gte":"1968-01-01","primary_release_date.lte":"1982-12-31","with_origin_country":"IT"}},
{"id":"70s-crime","name":"Gritty 1970s crime","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":150,"with_genres":"80","without_genres":"16,10751","primary_release_date.gte":"1970-01-01","primary_release_date.lte":"1979-12-31"}},
{"id":"ww2-resistance","name":"WWII resistance and occupation","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"1956,836|15182|174375"},"items":[{"id":"tt0091251","name":"Come and See","year":"1985","poster":"https://image.tmdb.org/t/p/w342/qNbMsKVzigERgJUbwf8pKyZogpb.jpg"},{"id":"tt0075404","name":"The Ascent","year":"1977","poster":"https://image.tmdb.org/t/p/w342/nbGyTnH1TREKgZXLxEJNnDVohYC.jpg"},{"id":"tt0064040","name":"Army of Shadows","year":"1969","poster":"https://image.tmdb.org/t/p/w342/aqNZWM9bspt8zaDvVRIRiWxRVJ7.jpg"},{"id":"tt0050585","name":"Kanal","year":"1957","poster":"https://image.tmdb.org/t/p/w342/mUxZNNmvX3MwIJ9LTcuw76ZdtN6.jpg"},{"id":"tt1034303","name":"Defiance","year":"2008","poster":"https://image.tmdb.org/t/p/w342/kEF847cC9yAkgoeEZPQwnF08p6p.jpg"},{"id":"tt0389557","name":"Black Book","year":"2006","poster":"https://image.tmdb.org/t/p/w342/vZaYDWa3IqTNKsHCsUr72J4zTJ6.jpg"},{"id":"tt0920458","name":"Flame & Citron","year":"2008","poster":"https://image.tmdb.org/t/p/w342/32CKp29QyqimkjtdJRBzSRHPx4j.jpg"},{"id":"tt1029235","name":"Max Manus: Man of War","year":"2008","poster":"https://image.tmdb.org/t/p/w342/v9Z7CUGW1Q5L8GdGH3rY5SkU72L.jpg"},{"id":"tt4190530","name":"Anthropoid","year":"2016","poster":"https://image.tmdb.org/t/p/w342/5hUghRVVkBYufftfNQkGevY5AmE.jpg"},{"id":"tt0038890","name":"Rome, Open City","year":"1945","poster":"https://image.tmdb.org/t/p/w342/ijGV4v8JxgbNzgEhqKdzHdaZn8a.jpg"},{"id":"tt0056111","name":"Ivan's Childhood","year":"1962","poster":"https://image.tmdb.org/t/p/w342/trY9ADhXgSExH3DLlFhV5C8aDtw.jpg"},{"id":"tt0071733","name":"Lacombe, Lucien","year":"1974","poster":"https://image.tmdb.org/t/p/w342/gHlorDyJrigxzcuZaQ5p4mseAPC.jpg"}]},
{"id":"vietnam","name":"Vietnam War","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"2957"}},
{"id":"ww1","name":"World War I","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"2504"}},
{"id":"submarine-war","name":"Naval warfare","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"10752|28","without_genres":"16,10751","with_keywords":"3588|160860|226475"}},
{"id":"samurai","name":"Samurai","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"1462"}},
{"id":"ninjas","name":"Ninjas","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"878,16,10751","with_keywords":"10278"}},
{"id":"wuxia","name":"Wuxia","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"184656|779","with_origin_country":"CN|HK|TW"}},
{"id":"medieval","name":"Medieval grit","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"161257"}},
{"id":"ancient-rome","name":"Ancient Rome","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"5049|1405|1394"}},
{"id":"ancient-egypt","name":"Ancient Egypt","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"157894|163338"}},
{"id":"victorian","name":"Victorian England","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"8250|207928","with_origin_country":"GB"}},
{"id":"neo-westerns","name":"Neo-westerns","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"168713"}},
{"id":"outlaws","name":"Outlaws on the run","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"37|80","without_genres":"16,10751","with_keywords":"9503"}},
{"id":"trains","name":"Trains","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"13008"}},
{"id":"pirates-golden","name":"Swashbucklers","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"157186"}},
{"id":"silent-era","name":"Silent films","type":"movie","params":{"sort_by":"vote_count.desc","vote_count.gte":20,"without_genres":"16,10751","primary_release_date.gte":"1895-01-01","primary_release_date.lte":"1929-12-31"}},
{"id":"black-and-white","name":"Black-and-white films","type":"movie","params":{"sort_by":"vote_count.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"12999"}},
{"id":"chefs","name":"Chefs, kitchens and restaurants","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"18|35|10749","without_genres":"27,16,10751","with_keywords":"18293|1946|1918"}},
{"id":"wine","name":"Wine","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"6563|220204|5334"}},
{"id":"painters","name":"Painters and artists","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"18","without_genres":"16,10751","with_keywords":"437|2679"}},
{"id":"photographers","name":"Photographers","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"18","without_genres":"16,10751","with_keywords":"1003|6025"}},
{"id":"rock-bands","name":"Rock bands on the road","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"18|10402|35","without_genres":"16,10751","with_keywords":"18001|311916"}},
{"id":"hip-hop","name":"Hip-hop","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"898|897|4562"}},
{"id":"jazz","name":"Jazz","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"1416|361038"}},
{"id":"heavy-metal","name":"Heavy metal","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"5540"}},
{"id":"dance","name":"Dance films","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16","with_keywords":"1691|246"}},
{"id":"ballet","name":"Ballet","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"10551"}},
{"id":"theater-kids","name":"Life in the theater","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"18|35","without_genres":"16,10751","with_keywords":"285695|195729|257714"}},
{"id":"magicians","name":"Magicians and illusionists","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"236458|210730"}},
{"id":"circus","name":"The circus","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"291"}},
{"id":"chess","name":"Chess","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"316"}},
{"id":"boxing","name":"Boxing","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"209476"}},
{"id":"baseball","name":"Baseball","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"1480"}},
{"id":"surfing","name":"Surfing","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"5349|1524"}},
{"id":"skateboarding","name":"Skateboarding","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"390"}},
{"id":"mountain-climbing","name":"Climbers","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"8624|201008|241666"}},
{"id":"boarding-school","name":"Boarding schools","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"6271"}},
{"id":"college","name":"College years","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"35|18","without_genres":"16,10751","with_keywords":"3616|13160"}},
{"id":"high-school-80s","name":"1980s high school","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"6270","primary_release_date.gte":"1980-01-01","primary_release_date.lte":"1989-12-31"}},
{"id":"coming-of-age-90s","name":"Coming of age in the 1990s","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"10683","primary_release_date.gte":"1990-01-01","primary_release_date.lte":"1999-12-31"}},
{"id":"midlife","name":"Midlife crises","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"1599"}},
{"id":"aging","name":"Growing old","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"18","without_genres":"16,10751","with_keywords":"4995|298930|172971"}},
{"id":"grief","name":"Grief","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"18","without_genres":"16,10751","with_keywords":"9872"}},
{"id":"loneliness","name":"Loneliness","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"18","without_genres":"16,10751","with_keywords":"9957"}},
{"id":"addiction","name":"Addiction","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"18","without_genres":"16,10751","with_keywords":"1803|7464"}},
{"id":"siblings","name":"Siblings","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"18","without_genres":"16,10751","with_keywords":"375255|240485|241738"}},
{"id":"fathers-sons","name":"Fathers and sons","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"18","without_genres":"16,10751","with_keywords":"240119"}},
{"id":"mothers-daughters","name":"Mothers and daughters","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"18","without_genres":"16,10751","with_keywords":"240315"}},
{"id":"friendship-women","name":"Female friendship","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"5248"}},
{"id":"lgbt","name":"Queer cinema","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":60,"without_genres":"16,10751","with_keywords":"158718|258533|264386"}},
{"id":"religion","name":"Faith and doubt","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"18","without_genres":"16,10751","with_keywords":"11001|6150|10093"}},
{"id":"politics","name":"Politics and elections","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"18|53|35","without_genres":"28,12,14,16","with_keywords":"6078|6085|6083"}},
{"id":"revolutions","name":"Revolutions","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"18|36|10752","without_genres":"878","with_keywords":"2020"}},
{"id":"immigrants","name":"Immigrants and new lives","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"18","without_genres":"16,10751","with_keywords":"2356|1900"}},
{"id":"biopics-musicians","name":"Musician biopics","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"5565,4048"}},
{"id":"based-on-play","name":"Adapted from plays","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"10181"}},
{"id":"novels-lit","name":"Literary adaptations","type":"movie","params":{"sort_by":"vote_count.desc","vote_count.gte":20,"with_genres":"18","without_genres":"16,10751","with_keywords":"818"}},
{"id":"period-romance","name":"Period romance","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"10749","without_genres":"16,10751","with_keywords":"15060"}},
{"id":"forbidden-love","name":"Forbidden love","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"10749","without_genres":"16,10751","with_keywords":"3691"}},
{"id":"love-triangles","name":"Love triangles","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"128"}},
{"id":"first-love","name":"First love","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"157303"}},
{"id":"parody","name":"Parodies and spoofs","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"9755|11931"}},
{"id":"screwball","name":"Screwball comedies","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"155457|160362"}},
{"id":"fish-out-of-water","name":"Fish out of water","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"11860"}},
{"id":"workplace","name":"Workplace comedies","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"35","without_genres":"16,10751","with_keywords":"6282|1438"}},
{"id":"weddings","name":"Weddings gone wrong","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"35","without_genres":"16,10751","with_keywords":"13027"}},
{"id":"heist-comedy","name":"Heist comedies","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"35","without_genres":"16,10751","with_keywords":"10051"}},
{"id":"british-comedy-films","name":"British comedy films","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":100,"with_genres":"35","without_genres":"16,10751","with_origin_country":"GB"}},
{"id":"aussie","name":"Australian oddities","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":80,"without_genres":"16,10751","with_origin_country":"AU"}},
{"id":"nz","name":"New Zealand films","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":40,"without_genres":"16,10751","with_origin_country":"NZ"}},
{"id":"canadian","name":"Canadian cinema","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":60,"with_genres":"18|35|27","without_genres":"16,10751","with_origin_country":"CA"}},
{"id":"irish","name":"Irish films","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":40,"without_genres":"16,10751","with_origin_country":"IE"}},
{"id":"bollywood","name":"Bollywood","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":50,"without_genres":"16,10751","with_origin_country":"IN","with_original_language":"hi"}},
{"id":"tamil","name":"Tamil cinema","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":30,"without_genres":"16,10751","with_original_language":"ta"}},
{"id":"iranian","name":"Iranian cinema","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_origin_country":"IR"}},
{"id":"turkish","name":"Turkish cinema","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":30,"without_genres":"16,10751","with_origin_country":"TR"}},
{"id":"thai","name":"Thai cinema","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_origin_country":"TH"}},
{"id":"taiwanese","name":"Taiwanese cinema","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":30,"without_genres":"16,10751","with_origin_country":"TW"}},
{"id":"polish","name":"Polish cinema","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":40,"without_genres":"16,10751","with_origin_country":"PL"}},
{"id":"german-expressionism","name":"German expressionism","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"179874"}},
{"id":"german","name":"German cinema","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":80,"with_genres":"18|53|35","without_genres":"16,10751","with_origin_country":"DE"}},
{"id":"brazilian","name":"Brazilian cinema","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":40,"without_genres":"16,10751","with_origin_country":"BR"}},
{"id":"argentine","name":"Argentine cinema","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":40,"without_genres":"16,10751","with_origin_country":"AR"}},
{"id":"nigerian","name":"Nollywood","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":5,"without_genres":"16,10751","with_origin_country":"NG"}},
{"id":"art-house","name":"Art house","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"11130|318182"}},
{"id":"experimental","name":"Experimental film","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"293336|15216"}},
{"id":"anthology-films","name":"Anthology films","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"9706"}},
{"id":"remakes","name":"Remakes","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"9714"}},
{"id":"comic-adaptations-indie","name":"Comic adaptations that aren't superhero films","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"28,12,16,10751","with_keywords":"9717"}},
{"id":"anti-heroes","name":"Anti-heroes","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"2095"}},
{"id":"video-games","name":"Video-game adaptations","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"41645"}},
{"id":"toys-come-alive","name":"Toys and games come alive","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16","with_keywords":"265589|10090"}},
{"id":"animals-docs","name":"Animal docs","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":5,"with_genres":"99","without_genres":"16,10751","with_keywords":"361118|9902"}},
{"id":"birds","name":"Birds and birders","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"99|18|35","without_genres":"16,10751","with_keywords":"18007|277462|240242"}},
{"id":"whales","name":"Whales and dolphins","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"4676|630"}},
{"id":"forests","name":"Forests","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"5774"}},
{"id":"islands","name":"Islands","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"2041"}},
{"id":"jungles","name":"Jungles","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"10787"}},
{"id":"rivers","name":"Rivers","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"1261"}},
{"id":"farming","name":"Farms and farmers","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10751","with_keywords":"4932|154846"}},
{"id":"food-docs","name":"Food documentaries","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"99","without_genres":"16,10751","with_keywords":"10637"}},
{"id":"space-docs","name":"Space documentaries","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"99","without_genres":"16,10751","with_keywords":"9882|1432|252634"}},
{"id":"art-docs","name":"Art documentaries","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"99","without_genres":"16,10751","with_keywords":"14893|2679|437"}},
{"id":"crime-docs","name":"Crime documentaries","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"99","without_genres":"16,10751","with_keywords":"33722|9826"}},
{"id":"conspiracy-docs","name":"Conspiracy documentaries","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":5,"with_genres":"99","without_genres":"16,10751","with_keywords":"10410"}},
{"id":"sports-docs","name":"Sports documentaries","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"99","without_genres":"16,10751","with_keywords":"333328|6075"}},
{"id":"skate-surf-docs","name":"Board-sport documentaries","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"99","without_genres":"16,10751","with_keywords":"390|5349|3522"}},
{"id":"tv-anthology-horror","name":"Horror anthology series","type":"series","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"9648|10765","without_genres":"16,10762","with_keywords":"9706"}},
{"id":"tv-supernatural","name":"Supernatural series","type":"series","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10762","with_keywords":"6152"}},
{"id":"tv-vampires","name":"Vampire series","type":"series","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10762","with_keywords":"3133"}},
{"id":"tv-zombies","name":"Zombie series","type":"series","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10762","with_keywords":"12377"}},
{"id":"tv-time-travel","name":"Time-travel series","type":"series","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10762","with_keywords":"4379"}},
{"id":"tv-space-opera","name":"Space opera series","type":"series","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10762","with_keywords":"161176|252937"}},
{"id":"tv-dystopia","name":"Dystopian series","type":"series","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10762","with_keywords":"4565"}},
{"id":"tv-heists","name":"Heist series","type":"series","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10762","with_keywords":"10051"}},
{"id":"tv-mafia","name":"Mob series","type":"series","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16","with_keywords":"10391|10291"}},
{"id":"tv-spy","name":"Spy series","type":"series","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10762","with_keywords":"470|5265"}},
{"id":"tv-legal","name":"Legal dramas","type":"series","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10762","with_keywords":"10909|33519"}},
{"id":"tv-medical","name":"Medical dramas","type":"series","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"18","without_genres":"16,10762","with_keywords":"11612|13005"}},
{"id":"tv-cop","name":"Police procedurals","type":"series","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10762","with_keywords":"268067"}},
{"id":"tv-small-town","name":"Small-town series","type":"series","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10762","with_keywords":"1415"}},
{"id":"tv-period","name":"Period dramas","type":"series","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10762","with_keywords":"15060"}},
{"id":"tv-workplace","name":"Workplace sitcoms","type":"series","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"35","without_genres":"16,10762","with_keywords":"6282"}},
{"id":"tv-family-sitcom","name":"Family sitcoms","type":"series","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10762","with_keywords":"193171,18035"}},
{"id":"tv-sketch","name":"Sketch comedy","type":"series","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10762","with_keywords":"156203"}},
{"id":"tv-cooking","name":"Cooking shows","type":"series","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10762","with_keywords":"1918|18293"}},
{"id":"tv-travel","name":"Travel shows","type":"series","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"99|10764","without_genres":"16,10762","with_keywords":"9935"}},
{"id":"tv-wildlife","name":"Wildlife series","type":"series","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"99","without_genres":"16,10762","with_keywords":"9902|361118"}},
{"id":"tv-history-docs","name":"History docuseries","type":"series","params":{"sort_by":"popularity.desc","vote_count.gte":5,"with_genres":"99","without_genres":"16,10762","with_keywords":"282633"}},
{"id":"tv-japanese-drama","name":"Japanese dramas","type":"series","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"18","without_genres":"16","with_origin_country":"JP"}},
{"id":"tv-spanish","name":"Spanish-language series","type":"series","params":{"sort_by":"popularity.desc","vote_count.gte":40,"without_genres":"10763,10764,10766,10767","with_original_language":"es"}},
{"id":"tv-french","name":"French series","type":"series","params":{"sort_by":"popularity.desc","vote_count.gte":30,"without_genres":"16,10762","with_origin_country":"FR"}},
{"id":"tv-german","name":"German series","type":"series","params":{"sort_by":"popularity.desc","vote_count.gte":30,"without_genres":"10763,10766,10767","with_origin_country":"DE"}},
{"id":"tv-turkish","name":"Turkish series","type":"series","params":{"sort_by":"popularity.desc","vote_count.gte":10,"without_genres":"16,10762","with_origin_country":"TR"}},
{"id":"tv-aussie","name":"Australian series","type":"series","params":{"sort_by":"popularity.desc","vote_count.gte":30,"without_genres":"16,10762","with_origin_country":"AU"}},
{"id":"tv-90s-sitcoms","name":"1990s sitcoms","type":"series","params":{"sort_by":"popularity.desc","vote_count.gte":50,"with_genres":"35","without_genres":"10767,10763,16","first_air_date.gte":"1990-01-01","first_air_date.lte":"1999-12-31"}},
{"id":"tv-80s","name":"1980s TV","type":"series","params":{"sort_by":"popularity.desc","vote_count.gte":50,"without_genres":"10767,10763,10764,10766","first_air_date.gte":"1980-01-01","first_air_date.lte":"1989-12-31"}},
{"id":"tv-mecha","name":"Mecha anime","type":"series","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"16","with_keywords":"10046"}},
{"id":"tv-isekai","name":"Isekai anime","type":"series","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"16","with_keywords":"237451"}},
{"id":"tv-slice-of-life","name":"Slice-of-life anime","type":"series","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_genres":"16","with_keywords":"9914"}},
{"id":"tv-miniseries","name":"Miniseries","type":"series","params":{"sort_by":"popularity.desc","vote_count.gte":20,"without_genres":"16,10762","with_keywords":"11162"}},
// From the author's own 17,000-title library (TMDB keywords most common there and not covered above)
{"id":"claymation","name":"Claymation","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"197065"}},
{"id":"cutout-animation","name":"Cutout and paper animation","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":5,"with_keywords":"214793"}},
{"id":"video-nasties","name":"The video nasties","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"189921","without_genres":"16,10751"}},
{"id":"psychotronic","name":"Psychotronic cinema","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"164218|259982","without_genres":"16,10751"}},
{"id":"canuxploitation","name":"Canuxploitation: Canadian tax-shelter cult films","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"206850","without_genres":"16,10751"}},
{"id":"jidaigeki","name":"Jidaigeki: Japanese period drama","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"186753","without_genres":"16,10751"}},
{"id":"tokusatsu","name":"Tokusatsu: rubber suits and miniatures","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"317204","without_genres":"16,10751"}},
{"id":"bigfoot","name":"Bigfoot and Sasquatch","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"2597|210214","without_genres":"16,10751"}},
{"id":"cryptids","name":"Cryptids and monster hunts","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":5,"with_keywords":"11220","without_genres":"16,10751"}},
{"id":"pre-code","name":"Pre-Code Hollywood","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"156764","without_genres":"16,10751"}},
{"id":"sword-sorcery","name":"Sword and sorcery","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"234213","without_genres":"16,10751"}},
{"id":"sci-fi-horror","name":"Sci-fi horror","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"323910","without_genres":"16,10751"}},
{"id":"rape-revenge","name":"Rape-and-revenge thrillers","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"184352","without_genres":"16,10751"}},
{"id":"killer-toys","name":"Killer dolls and toys","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"10603|180691|9707","without_genres":"16,10751"}},
{"id":"olympic-films","name":"Official Olympic films","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":5,"with_keywords":"2070","with_genres":"99","without_genres":"16,10751"}},
{"id":"faux-docs","name":"Faux documentaries","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"276164|365784|365923","without_genres":"16,10751"}},
{"id":"live-action-animation","name":"Live action meets animation","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"209220"}},
{"id":"camp-classics","name":"Camp classics","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"155493","without_genres":"16,10751"}},
{"id":"macabre","name":"The macabre","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"162810","without_genres":"16,10751"}},
{"id":"whimsical","name":"Whimsical films","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"324713"}},
{"id":"melancholy","name":"Melancholy cinema","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"4232","without_genres":"16,10751"}},
{"id":"gore","name":"Gore and splatter","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"10292","without_genres":"16,10751"}},
{"id":"holiday-horror","name":"Holiday horror","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"323756","without_genres":"16,10751"}},
{"id":"survival-horror","name":"Survival horror","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"50009","without_genres":"16,10751"}},
{"id":"gothic-horror","name":"Gothic horror","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"15032","without_genres":"16,10751"}},
{"id":"psychological-horror","name":"Psychological horror","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"295907","without_genres":"16,10751"}},
{"id":"demonic-possession","name":"Demonic possession","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"9712|15001","with_genres":"27","without_genres":"16,10751"}},
{"id":"voodoo","name":"Voodoo","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"3392","without_genres":"16,10751"}},
{"id":"robots","name":"Robots and androids","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"14544","without_genres":"16,10751"}},
{"id":"classic-noir","name":"Classic film noir","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"9807","primary_release_date.lte":"1959-12-31","without_genres":"16,10751"}},
{"id":"femme-fatales","name":"Femme fatales","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"9016","without_genres":"16,10751"}},
{"id":"private-eyes","name":"Private eyes","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"155790","without_genres":"16,10751"}},
{"id":"kung-fu","name":"Kung fu","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"780","without_genres":"16,10751"}},
{"id":"dreams-nightmares","name":"Dreams and nightmares","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"1566|3030","without_genres":"16,10751"}},
{"id":"hallucinatory","name":"Hallucinatory films","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"3298","without_genres":"16,10751"}},
{"id":"madness","name":"Madness","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"41410|6255","without_genres":"16,10751"}},
{"id":"old-dark-houses","name":"Castles and old dark houses","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"3098|12545","with_genres":"27|9648","without_genres":"16,10751"}},
{"id":"rock-n-roll","name":"Rock 'n' roll movies","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"578","without_genres":"16,10751"}},
{"id":"backwoods-horror","name":"Backwoods horror","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"9720|11004","with_genres":"27","without_genres":"16,10751"}},
{"id":"masked-killers","name":"Masked killers","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"2546","with_genres":"27","without_genres":"16,10751"}},
{"id":"twins-doubles","name":"Twins and doubles","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"15016","without_genres":"16,10751"}},
{"id":"softcore","name":"Softcore and erotic cinema","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"155477|190370","without_genres":"16,10751"}},
{"id":"sex-comedies","name":"Sex comedies","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"170827","without_genres":"16,10751"}},
{"id":"philosophical","name":"Philosophical films","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"212737","without_genres":"16,10751"}},
{"id":"manga-films","name":"Films based on manga","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"13141"}},
{"id":"semi-autobiographical","name":"Semi-autobiographical films","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"165402","without_genres":"16,10751"}},
{"id":"camping-horror","name":"Camping trips gone wrong","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"1890","with_genres":"27","without_genres":"16,10751"}},
{"id":"snowbound","name":"Snowbound","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"1442","without_genres":"16,10751"}},
{"id":"concert-films","name":"Concert films","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"6029","with_genres":"10402|99","without_genres":"16,10751"}},
{"id":"hollywood-on-hollywood","name":"Hollywood on Hollywood","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"12396","without_genres":"16,10751"}},
{"id":"pov-films","name":"Point-of-view films","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"207082","without_genres":"16,10751"}},
{"id":"curses","name":"Curses","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"10541","without_genres":"16,10751"}},
{"id":"cgi-features","name":"3D animated features","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"278823"}},
{"id":"devil-hell","name":"The Devil and Hell","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"14999|6154","without_genres":"16,10751"}},
{"id":"low-budget-oddities","name":"Low-budget oddities","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"285961","without_genres":"16,10751"}},
{"id":"nunsploitation","name":"Nunsploitation","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":5,"with_keywords":"195222","without_genres":"16,10751"}},
{"id":"mondo","name":"Mondo films","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":5,"with_keywords":"196543","without_genres":"16,10751"}},
{"id":"peplum","name":"Peplum: sword-and-sandal epics","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"187305","without_genres":"16,10751"}},
{"id":"graveyard-horror","name":"Graveyard horror","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"1227","with_genres":"27","without_genres":"16,10751"}},
{"id":"tokusatsu-series","name":"Tokusatsu series","type":"series","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"317204"}},
{"id":"manga-series","name":"Series based on manga","type":"series","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"13141"}},
{"id":"stop-motion-series","name":"Stop-motion and claymation series","type":"series","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"10121|197065"}},
// Requested: transgressive, black comedy, nihilist, wars, stage adaptations; two hand-picked lists TMDB keywords can't express
{"id":"transgressive","name":"Transgressive cinema","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"366511|206750|306327|310127|201028|345799|365846|224663","without_genres":"16,10751"}},
{"id":"new-french-extremity","name":"New French Extremity","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"365846|224663","without_genres":"16,10751"}},
{"id":"black-comedy","name":"Black comedy","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"10123|4553|383021|197707","with_genres":"35","without_genres":"16,10751"}},
{"id":"black-comedy-series","name":"Black comedy series","type":"series","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"10123|4553|383021|197707","with_genres":"35"}},
{"id":"nihilist","name":"Nihilist cinema","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"1541|213742|358964|230747|2300","without_genres":"16,10751"}},
{"id":"ww2","name":"World War II","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"1956","without_genres":"16,10751"}},
{"id":"ww2-series","name":"World War II series","type":"series","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"1956"}},
{"id":"post-ww2","name":"After World War II","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"160224","without_genres":"16,10751"}},
{"id":"american-civil-war","name":"The American Civil War","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"179585","without_genres":"16,10751"}},
{"id":"napoleonic-wars","name":"The Napoleonic Wars","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"33384","without_genres":"16,10751"}},
{"id":"gulf-iraq-afghanistan","name":"The Gulf, Iraq and Afghanistan wars","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"2952|15087|8159|7158|1242","without_genres":"16,10751"}},
{"id":"spanish-civil-war","name":"The Spanish Civil War","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"5509|252639","without_genres":"16,10751"}},
{"id":"algerian-war","name":"The Algerian War","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":5,"with_keywords":"213473|371555","without_genres":"16,10751"}},
{"id":"stage-adaptations","name":"Adapted from stage plays","type":"movie","params":{"sort_by":"popularity.desc","vote_count.gte":20,"with_keywords":"214595|10181","without_genres":"16,10751,10402"}},
{"id":"bottle-films","name":"Bottle films: one room, one night","type":"movie","params":{"sort_by":"popularity.desc","with_keywords":"368386|380730|348145|301728|193110|191260","without_genres":"16,10751"},"items":[{"id":"tt0050083","name":"12 Angry Men","year":"1957","poster":"https://image.tmdb.org/t/p/w342/zhG3vKWyDRaZYoaww1UVAi29T9h.jpg"},{"id":"tt0040746","name":"Rope","year":"1948","poster":"https://image.tmdb.org/t/p/w342/9ar6rxLDB8kagAnXZKn6h9smscr.jpg"},{"id":"tt0105236","name":"Reservoir Dogs","year":"1992","poster":"https://image.tmdb.org/t/p/w342/xi8Iu6qyTfyZVDVy60raIOYJJmk.jpg"},{"id":"tt0123755","name":"Cube","year":"1998","poster":"https://image.tmdb.org/t/p/w342/x4BTjxdrOKC27FcSkBh8KPEgnum.jpg"},{"id":"tt1462758","name":"Buried","year":"2010","poster":"https://image.tmdb.org/t/p/w342/lQP2sZngXzjh3NDIWzo9OVK5YVh.jpg"},{"id":"tt2866360","name":"Coherence","year":"2014","poster":"https://image.tmdb.org/t/p/w342/ezUtb9m5DeLwL2gxi4gktzNCvQv.jpg"},{"id":"tt2400463","name":"The Invitation","year":"2016","poster":"https://image.tmdb.org/t/p/w342/esubm23z8N5JUA1wQ5yLSjLicDx.jpg"},{"id":"tt0056732","name":"The Exterminating Angel","year":"1962","poster":"https://image.tmdb.org/t/p/w342/qqZXHvBFxUpo8Pfbyvgh4SYMiWm.jpg"},{"id":"tt1692486","name":"Carnage","year":"2011","poster":"https://image.tmdb.org/t/p/w342/3Imx53XV3T02ADlMxYazYXVNysZ.jpg"},{"id":"tt2692904","name":"Locke","year":"2014","poster":"https://image.tmdb.org/t/p/w342/tTREq5tTyYwmSLDRMhybJ82zXcX.jpg"},{"id":"tt0756683","name":"The Man from Earth","year":"2007","poster":"https://image.tmdb.org/t/p/w342/V086R82gNgWrotaXZFO4JhdgB1.jpg"},{"id":"tt0109445","name":"Clerks","year":"1994","poster":"https://image.tmdb.org/t/p/w342/9IiSgiq4h4siTIS9H3o4nZ3h5L9.jpg"},{"id":"tt0275719","name":"Tape","year":"2001","poster":"https://image.tmdb.org/t/p/w342/4Flz17KOjGdGqJ2dFRhKnB7eg5.jpg"},{"id":"tt0082783","name":"My Dinner with Andre","year":"1981","poster":"https://image.tmdb.org/t/p/w342/lakuk8UpDUBrO5c8uoWbKxy5j0e.jpg"},{"id":"tt0183649","name":"Phone Booth","year":"2003","poster":"https://image.tmdb.org/t/p/w342/r6lIwPKVDa6Q76qH2TbIBqPhXL3.jpg"},{"id":"tt3460252","name":"The Hateful Eight","year":"2015","poster":"https://image.tmdb.org/t/p/w342/jIywvdPjia2t3eKYbjVTcwBQlG8.jpg"},{"id":"tt1258197","name":"Exam","year":"2009","poster":"https://image.tmdb.org/t/p/w342/i1J2zBCyOQJKsQipqJ0qXERC1Ma.jpg"},{"id":"tt6742252","name":"The Guilty","year":"2018","poster":"https://image.tmdb.org/t/p/w342/42QPG6p7oLcLd4LQOPeSTLhqfMx.jpg"},{"id":"tt0258000","name":"Panic Room","year":"2002","poster":"https://image.tmdb.org/t/p/w342/hANYbvfwxmkC9E4yY6YyJxYxlSJ.jpg"},{"id":"tt1179933","name":"10 Cloverfield Lane","year":"2016","poster":"https://image.tmdb.org/t/p/w342/q8A39vcBDruhvoDTJd6L8a4lnTi.jpg"},{"id":"tt4062536","name":"Green Room","year":"2016","poster":"https://image.tmdb.org/t/p/w342/evZicaR7nXe4LiD9G6QYTorcJGO.jpg"},{"id":"tt0088847","name":"The Breakfast Club","year":"1985","poster":"https://image.tmdb.org/t/p/w342/gp4zlj7wgbiofLMNsTPndMuO3PN.jpg"},{"id":"tt0082096","name":"Das Boot","year":"1981","poster":"https://image.tmdb.org/t/p/w342/hNfAYNCMRthp9iruF5Q6S1z4bVA.jpg"},{"id":"tt0037017","name":"Lifeboat","year":"1944","poster":"https://image.tmdb.org/t/p/w342/2QXpzBMJJtmH7JvVf0ZzENvgc1o.jpg"},{"id":"tt0069281","name":"Sleuth","year":"1972","poster":"https://image.tmdb.org/t/p/w342/jAREYLUnYGwPjbQr0vs1s38QLkH.jpg"},{"id":"tt0104348","name":"Glengarry Glen Ross","year":"1992","poster":"https://image.tmdb.org/t/p/w342/zcaEDx8KlVfh4vKfMNLhiSi5Oz4.jpg"},{"id":"tt0387564","name":"Saw","year":"2004","poster":"https://image.tmdb.org/t/p/w342/rLNSOudrayDBo1uqXjrhxcjODIC.jpg"},{"id":"tt1314655","name":"Devil","year":"2010","poster":"https://image.tmdb.org/t/p/w342/wlJQObUXHyfbDU9E5PEMOhWQo3q.jpg"},{"id":"tt0046912","name":"Dial M for Murder","year":"1954","poster":"https://image.tmdb.org/t/p/w342/2gDCAgl2iBQNuJuk6p2xtuS1ewg.jpg"},{"id":"tt0047396","name":"Rear Window","year":"1954","poster":"https://image.tmdb.org/t/p/w342/ILVF0eJxHMddjxeQhswFtpMtqx.jpg"},{"id":"tt3118452","name":"Circle","year":"2015","poster":"https://image.tmdb.org/t/p/w342/hbIL53MdZFJXsgxXaSOVuApWTs8.jpg"},{"id":"tt0074156","name":"Assault on Precinct 13","year":"1976","poster":"https://image.tmdb.org/t/p/w342/RtGDEmXbSxE8NThCCY1SXFXLLw.jpg"},{"id":"tt0084787","name":"The Thing","year":"1982","poster":"https://image.tmdb.org/t/p/w342/tzGY49kseSE9QAKk47uuDGwnSCu.jpg"},{"id":"tt0061184","name":"Who's Afraid of Virginia Woolf?","year":"1966","poster":"https://image.tmdb.org/t/p/w342/wF7ihB5V5gSm6zxjv3ZhHOpgREI.jpg"},{"id":"tt7984734","name":"The Lighthouse","year":"2019","poster":"https://image.tmdb.org/t/p/w342/dwXmOYJVM1VIkkSXHY5zYSaLJLC.jpg"},{"id":"tt1016301","name":"Fermat's Room","year":"2007","poster":"https://image.tmdb.org/t/p/w342/qQcYvPXxvk6bQDV9Zgd6cnDQmKZ.jpg"},{"id":"tt4901306","name":"Perfect Strangers","year":"2016","poster":"https://image.tmdb.org/t/p/w342/3wknM629Vryofb1HNo2YnLQnQyn.jpg"},{"id":"tt8228288","name":"The Platform","year":"2019","poster":"https://image.tmdb.org/t/p/w342/iXvQnzy6JCAx1PiQEKXuTY04ZHl.jpg"},{"id":"tt0063350","name":"Night of the Living Dead","year":"1968","poster":"https://image.tmdb.org/t/p/w342/rb2NWyb008u1EcKCOyXs2Nmj0ra.jpg"},{"id":"tt1323045","name":"Frozen","year":"2010","poster":"https://image.tmdb.org/t/p/w342/2J3URUnDrIpNvh0uVqINQvr4HhW.jpg"},{"id":"tt0374102","name":"Open Water","year":"2004","poster":"https://image.tmdb.org/t/p/w342/7Gy5N0Yp7ocaKBR860v9KDbpYHj.jpg"},{"id":"tt1542344","name":"127 Hours","year":"2010","poster":"https://image.tmdb.org/t/p/w342/h0RMdn0rfl9l5hWXz3tUh6QVkhi.jpg"},{"id":"tt1182345","name":"Moon","year":"2009","poster":"https://image.tmdb.org/t/p/w342/35IU0Mq0zFsN1mYwDGts5mKc77n.jpg"},{"id":"tt0276919","name":"Dogville","year":"2003","poster":"https://image.tmdb.org/t/p/w342/lraVawavIXh5geMlVjpzCw9TGwR.jpg"},{"id":"tt1535616","name":"The Divide","year":"2012","poster":"https://image.tmdb.org/t/p/w342/hnwX5cUuzBDM0OWJB2UtnjkrHDm.jpg"},{"id":"tt0424136","name":"Hard Candy","year":"2006","poster":"https://image.tmdb.org/t/p/w342/uHTmlcivbPeclEdmtuQg3zOQWPS.jpg"},{"id":"tt0470705","name":"Bug","year":"2007","poster":"https://image.tmdb.org/t/p/w342/yjTmmAngldFoyDhHxNM8fHblk3O.jpg"},{"id":"tt1726669","name":"Killer Joe","year":"2012","poster":"https://image.tmdb.org/t/p/w342/6Tt1TQeOI4TpXu1cBUgNGNGeznW.jpg"},{"id":"tt0109579","name":"Death and the Maiden","year":"1994","poster":"https://image.tmdb.org/t/p/w342/yrGpwavZwfprhjVRHMHc165q22u.jpg"},{"id":"tt2406252","name":"Venus in Fur","year":"2013","poster":"https://image.tmdb.org/t/p/w342/b9pCYixO3ZO7tB303efB3O4nkqC.jpg"},{"id":"tt1510938","name":"The Sunset Limited","year":"2011","poster":"https://image.tmdb.org/t/p/w342/8cwqylJVbCfMflcjXQ71CwsXdpf.jpg"},{"id":"tt0062467","name":"Wait Until Dark","year":"1967","poster":"https://image.tmdb.org/t/p/w342/cNW3ewCB52KkxzSE47PcE5Bqvmr.jpg"},{"id":"tt0100157","name":"Misery","year":"1990","poster":"https://image.tmdb.org/t/p/w342/klPO5oh1LOxiPpdDXZo1ADgpKcw.jpg"},{"id":"tt1226681","name":"Pontypool","year":"2009","poster":"https://image.tmdb.org/t/p/w342/4wWMvurzg1AoArX57pqsPWwhps2.jpg"}]},
{"id":"bad-endings","name":"Bad endings: nobody gets out okay","type":"movie","params":{"sort_by":"popularity.desc","with_keywords":"368391|375722|364573","without_genres":"16,10751"},"items":[{"id":"tt0114369","name":"Se7en","year":"1995","poster":"https://image.tmdb.org/t/p/w342/191nKfP0ehp3uIvWqgPbFmI4lv9.jpg"},{"id":"tt0884328","name":"The Mist","year":"2007","poster":"https://image.tmdb.org/t/p/w342/c4UgUKZjM0Qzy5t4hAXSOFHYsnb.jpg"},{"id":"tt0180093","name":"Requiem for a Dream","year":"2000","poster":"https://image.tmdb.org/t/p/w342/9BTwsLaMVHOGFlmsSlx5QYCaXb.jpg"},{"id":"tt0364569","name":"Oldboy","year":"2003","poster":"https://image.tmdb.org/t/p/w342/pWDtjs568ZfOTMbURQBYuT4Qxka.jpg"},{"id":"tt0168629","name":"Dancer in the Dark","year":"2000","poster":"https://image.tmdb.org/t/p/w342/pWzOfTJRZHPNO1VNrMnNFqRcJwg.jpg"},{"id":"tt0063350","name":"Night of the Living Dead","year":"1968","poster":"https://image.tmdb.org/t/p/w342/rb2NWyb008u1EcKCOyXs2Nmj0ra.jpg"},{"id":"tt0071315","name":"Chinatown","year":"1974","poster":"https://image.tmdb.org/t/p/w342/kZRSP3FmOcq0xnBulqpUQngJUXY.jpg"},{"id":"tt0070917","name":"The Wicker Man","year":"1973","poster":"https://image.tmdb.org/t/p/w342/wwtrXRL8SiOWxhwLEvw7iBgYh0g.jpg"},{"id":"tt1029234","name":"Martyrs","year":"2008","poster":"https://image.tmdb.org/t/p/w342/sT5ITTlTcnPOeFzHEu5j0hTZUvD.jpg"},{"id":"tt0119167","name":"Funny Games","year":"1997","poster":"https://image.tmdb.org/t/p/w342/48uCNgdyYIoN4ayWjTpLaqSDcWI.jpg"},{"id":"tt0096163","name":"The Vanishing","year":"1988","poster":"https://image.tmdb.org/t/p/w342/eE5bbuRJluooG2MjEAsLEYyuJoa.jpg"},{"id":"tt1788391","name":"Kill List","year":"2011","poster":"https://image.tmdb.org/t/p/w342/qwT2I3ons0oD58jIppKmd4qLtvB.jpg"},{"id":"tt7784604","name":"Hereditary","year":"2018","poster":"https://image.tmdb.org/t/p/w342/4GFPuL14eXi66V96xBWY73Y9PfR.jpg"},{"id":"tt0091251","name":"Come and See","year":"1985","poster":"https://image.tmdb.org/t/p/w342/qNbMsKVzigERgJUbwf8pKyZogpb.jpg"},{"id":"tt0095327","name":"Grave of the Fireflies","year":"1988","poster":"https://image.tmdb.org/t/p/w342/k9tv1rXZbOhH7eiCk378x61kNQ1.jpg"},{"id":"tt0405159","name":"Million Dollar Baby","year":"2004","poster":"https://image.tmdb.org/t/p/w342/jcfEqKdWF1zeyvECPqp3mkWLct2.jpg"},{"id":"tt0088846","name":"Brazil","year":"1985","poster":"https://image.tmdb.org/t/p/w342/2w09J0KUnVtJvqPYu8N63XjAyCR.jpg"},{"id":"tt0064276","name":"Easy Rider","year":"1969","poster":"https://image.tmdb.org/t/p/w342/3H3vwPGX6EbBRffIVHp3eHHcjka.jpg"},{"id":"tt0477348","name":"No Country for Old Men","year":"2007","poster":"https://image.tmdb.org/t/p/w342/6d5XOczc226jECq0LIX0siKtgHR.jpg"},{"id":"tt1527186","name":"Melancholia","year":"2011","poster":"https://image.tmdb.org/t/p/w342/fMneszMiQuTKY8JUXrGGB5vwqJf.jpg"},{"id":"tt0290673","name":"Irreversible","year":"2002","poster":"https://image.tmdb.org/t/p/w342/rxeDxo8FvZpLu6iplNpxdtAVnfu.jpg"},{"id":"tt0435625","name":"The Descent","year":"2005","poster":"https://image.tmdb.org/t/p/w342/mxFPI4KYBk5ri9cPteIS8jiDFgj.jpg"},{"id":"tt0113627","name":"Leaving Las Vegas","year":"1995","poster":"https://image.tmdb.org/t/p/w342/wIfP6uLXD9Ptu68SyRx8WuSNNSK.jpg"},{"id":"tt0898367","name":"The Road","year":"2009","poster":"https://image.tmdb.org/t/p/w342/qLaXnLzqleBWQtjvZ6JGVSaKoC3.jpg"},{"id":"tt0090163","name":"Threads","year":"1984","poster":"https://image.tmdb.org/t/p/w342/qOwJDktKNt6SPZBbp3x42dgikvC.jpg"},{"id":"tt0090315","name":"When the Wind Blows","year":"1986","poster":"https://image.tmdb.org/t/p/w342/sQ7CgHdDcKnnzhCXA7wC2JVL7qq.jpg"},{"id":"tt0115751","name":"Breaking the Waves","year":"1996","poster":"https://image.tmdb.org/t/p/w342/dQWMcdHXUOSHtr7ypOCa5T79JMS.jpg"},{"id":"tt0061418","name":"Bonnie and Clyde","year":"1967","poster":"https://image.tmdb.org/t/p/w342/sCSQFK9kMsprT4jgWqgw82dT6WI.jpg"},{"id":"tt1601913","name":"The Grey","year":"2012","poster":"https://image.tmdb.org/t/p/w342/a0Vt3wx8ciKmPt4iXPx9sH4HBVU.jpg"},{"id":"tt0327056","name":"Mystic River","year":"2003","poster":"https://image.tmdb.org/t/p/w342/hCHVDbo6XJGj3r2i4hVjKhE0GKF.jpg"},{"id":"tt0235198","name":"Audition","year":"2000","poster":"https://image.tmdb.org/t/p/w342/zwGaUMm0wAqi0wkO7LJDlwoA5LP.jpg"},{"id":"tt0870984","name":"Antichrist","year":"2009","poster":"https://image.tmdb.org/t/p/w342/ge7zbYvpfsDP3luKi0iSpzOgncM.jpg"},{"id":"tt1379182","name":"Dogtooth","year":"2009","poster":"https://image.tmdb.org/t/p/w342/7nLuUGlH12cegPfR84QX4xIIH9k.jpg"},{"id":"tt5715874","name":"The Killing of a Sacred Deer","year":"2017","poster":"https://image.tmdb.org/t/p/w342/e4DGlsc9g0h5AyoyvvAuIRnofN7.jpg"},{"id":"tt5727208","name":"Uncut Gems","year":"2019","poster":"https://image.tmdb.org/t/p/w342/6XN1vxHc7kUSqNWtaQKN45J5x2v.jpg"},{"id":"tt1680114","name":"Snowtown","year":"2011","poster":"https://image.tmdb.org/t/p/w342/5LW1vPLa8ueVwdOgR8w5xYkSQGv.jpg"},{"id":"tt0300140","name":"Lilya 4-ever","year":"2002","poster":"https://image.tmdb.org/t/p/w342/5i1uhvcdv2Iogx0Bb1znvUmkCvN.jpg"},{"id":"tt2328813","name":"Hard to Be a God","year":"2014","poster":"https://image.tmdb.org/t/p/w342/4lITcslPpm8NjTJyuVGMEwKvHcM.jpg"},{"id":"tt0082933","name":"Possession","year":"1981","poster":"https://image.tmdb.org/t/p/w342/A9bnRn05riOKWftvQlLKa2gl51n.jpg"},{"id":"tt0063442","name":"Planet of the Apes","year":"1968","poster":"https://image.tmdb.org/t/p/w342/2r9iKnlSYEk4daQadsXfcjHfIjQ.jpg"},{"id":"tt0078935","name":"Cannibal Holocaust","year":"1980","poster":"https://image.tmdb.org/t/p/w342/otxZzMh53TsN7yYFqSZ3rwH1yMd.jpg"},{"id":"tt1259521","name":"The Cabin in the Woods","year":"2012","poster":"https://image.tmdb.org/t/p/w342/zZZe5wn0udlhMtdlDjN4NB72R6e.jpg"},{"id":"tt0060955","name":"Seconds","year":"1966","poster":"https://image.tmdb.org/t/p/w342/5G3q3OvulFTnFdiouaZdD8wjtIc.jpg"},{"id":"tt0043338","name":"Ace in the Hole","year":"1951","poster":"https://image.tmdb.org/t/p/w342/gPVPzHEsJBX02HtBtIQgYnfeqNQ.jpg"},{"id":"tt0046268","name":"The Wages of Fear","year":"1953","poster":"https://image.tmdb.org/t/p/w342/sNOvIp4X0fmCMfgEs2ww5IyMgFm.jpg"},{"id":"tt0059646","name":"Repulsion","year":"1965","poster":"https://image.tmdb.org/t/p/w342/dtyCKEPLqv9wxyVazL4b843vtUb.jpg"},{"id":"tt0069995","name":"Don't Look Now","year":"1973","poster":"https://image.tmdb.org/t/p/w342/ivWsU3QtcstImCTOjItsH0SAbNn.jpg"},{"id":"tt0072684","name":"Barry Lyndon","year":"1975","poster":"https://image.tmdb.org/t/p/w342/A0byHUHMwZ7dtBQtfZ44QIgDbjo.jpg"},{"id":"tt0076740","name":"Sorcerer","year":"1977","poster":"https://image.tmdb.org/t/p/w342/2b7oexm173SF1FSEq0DdgxZZNRH.jpg"},{"id":"tt1441326","name":"Martha Marcy May Marlene","year":"2011","poster":"https://image.tmdb.org/t/p/w342/bgB4sa9UfCyGdamfKAZXyEWuAwR.jpg"},{"id":"tt8772262","name":"Midsommar","year":"2019","poster":"https://image.tmdb.org/t/p/w342/7LEI8ulZzO5gy9Ww2NVCrKmHeDZ.jpg"},{"id":"tt4263482","name":"The Witch","year":"2016","poster":"https://image.tmdb.org/t/p/w342/zap5hpFCWSvdWSuPGAQyjUv2wAC.jpg"},{"id":"tt1441395","name":"Under the Skin","year":"2014","poster":"https://image.tmdb.org/t/p/w342/55wmcXJIDYITr7JDijJTdvwSaAv.jpg"},{"id":"tt0101420","name":"Begotten","year":"1991","poster":"https://image.tmdb.org/t/p/w342/rvgYcVToOHe0gKWtF3mz6SvM4Aw.jpg"},{"id":"tt0165623","name":"Angst","year":"1983","poster":"https://image.tmdb.org/t/p/w342/nSYdWrPPwvcs5t5hG67XqDbwncG.jpg"},{"id":"tt2872718","name":"Nightcrawler","year":"2014","poster":"https://image.tmdb.org/t/p/w342/j9HrX8f7GbZQm1BrBiR40uFQZSb.jpg"},{"id":"tt2267998","name":"Gone Girl","year":"2014","poster":"https://image.tmdb.org/t/p/w342/ts996lKsxvjkO2yiYG0ht4qAicO.jpg"},{"id":"tt1130884","name":"Shutter Island","year":"2010","poster":"https://image.tmdb.org/t/p/w342/nrmXQ0zcZUL8jFLrakWc90IR8z9.jpg"}]},
// Harrowing war, and the modern wars (each checked against TMDB)
{"id":"harrowing-war","name":"Harrowing war: atrocity and dehumanisation","type":"movie","params":{"sort_by":"vote_average.desc","with_keywords":"1327|11872|14900|190351|212423|14546|9281","with_genres":"10752|36|99","without_genres":"16,10751,35"},"items":[{"id":"tt0091251","name":"Come and See","year":"1985","poster":"https://image.tmdb.org/t/p/w342/qNbMsKVzigERgJUbwf8pKyZogpb.jpg"},{"id":"tt0266425","name":"Conspiracy","year":"2001","poster":"https://image.tmdb.org/t/p/w342/xKocKpTHaKcTuNRLu0rLbZWbLnH.jpg"},{"id":"tt0075404","name":"The Ascent","year":"1977","poster":"https://image.tmdb.org/t/p/w342/nbGyTnH1TREKgZXLxEJNnDVohYC.jpg"},{"id":"tt0056111","name":"Ivan's Childhood","year":"1962","poster":"https://image.tmdb.org/t/p/w342/trY9ADhXgSExH3DLlFhV5C8aDtw.jpg"},{"id":"tt3808342","name":"Son of Saul","year":"2015","poster":"https://image.tmdb.org/t/p/w342/9ZcX6NjCJam5uwkooXffhHI29Lj.jpg"},{"id":"tt1667354","name":"The Painted Bird","year":"2019","poster":"https://image.tmdb.org/t/p/w342/wfuh6vTYLGspvkYoBy8GCaJx9Ur.jpg"},{"id":"tt0095327","name":"Grave of the Fireflies","year":"1988","poster":"https://image.tmdb.org/t/p/w342/k9tv1rXZbOhH7eiCk378x61kNQ1.jpg"},{"id":"tt0090163","name":"Threads","year":"1984","poster":"https://image.tmdb.org/t/p/w342/qOwJDktKNt6SPZBbp3x42dgikvC.jpg"},{"id":"tt0050825","name":"Paths of Glory","year":"1957","poster":"https://image.tmdb.org/t/p/w342/hGg1UCQSHlXfv2HI9bDHT2OQBam.jpg"},{"id":"tt0020629","name":"All Quiet on the Western Front","year":"1930","poster":"https://image.tmdb.org/t/p/w342/1wZUB08igw8iLUgF1r4T6aJD65b.jpg"},{"id":"tt1016150","name":"All Quiet on the Western Front","year":"2022","poster":"https://image.tmdb.org/t/p/w342/2IRjbi9cADuDMKmHdLK7LaqQDKA.jpg"},{"id":"tt0053121","name":"Fires on the Plain","year":"1959","poster":"https://image.tmdb.org/t/p/w342/zSCyy8GcJ1UCNGA8G5osYbZB7OD.jpg"},{"id":"tt0074695","name":"Cross of Iron","year":"1977","poster":"https://image.tmdb.org/t/p/w342/fR6pqh5aFn0fawsn7sR2zC15swx.jpg"},{"id":"tt0252480","name":"The Grey Zone","year":"2001","poster":"https://image.tmdb.org/t/p/w342/8jRsWnpciWHRy0MC7K5eMDKKqPw.jpg"},{"id":"tt0395169","name":"Hotel Rwanda","year":"2004","poster":"https://image.tmdb.org/t/p/w342/p3pHw85UMZPegfMZBA6dZ06yarm.jpg"},{"id":"tt1365050","name":"Beasts of No Nation","year":"2015","poster":"https://image.tmdb.org/t/p/w342/1D4vcJmJc58WXarpRtwgd2do9Rg.jpg"},{"id":"tt8633462","name":"Quo Vadis, Aida?","year":"2021","poster":"https://image.tmdb.org/t/p/w342/eQy2Tgvmx0FkK8vMMqMW4aX5UXQ.jpg"},{"id":"tt1124052","name":"City of Life and Death","year":"2009","poster":"https://image.tmdb.org/t/p/w342/xY6OUM2aRCmmq1ySTg2eu5rVmcq.jpg"},{"id":"tt0879843","name":"Katyn","year":"2007","poster":"https://image.tmdb.org/t/p/w342/g9yyF5zC2pel0gG6vxlVpkDgZgC.jpg"},{"id":"tt6068960","name":"Hatred","year":"2016","poster":"https://image.tmdb.org/t/p/w342/zYk1YmXtUON1OiNveK6bqbIWUy1.jpg"},{"id":"tt0087553","name":"The Killing Fields","year":"1984","poster":"https://image.tmdb.org/t/p/w342/cX6Bv7natnZwQjsV9bLL8mmWjkS.jpg"},{"id":"tt7160372","name":"The Zone of Interest","year":"2023","poster":"https://image.tmdb.org/t/p/w342/hUu9zyZmDd8VZegKi1iK1Vk0RYS.jpg"},{"id":"tt0108052","name":"Schindler's List","year":"1993","poster":"https://image.tmdb.org/t/p/w342/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg"},{"id":"tt0253474","name":"The Pianist","year":"2002","poster":"https://image.tmdb.org/t/p/w342/2hFvxCCWrTmCYwfy7yum0GKRi3Y.jpg"},{"id":"tt0048434","name":"Night and Fog","year":"1956","poster":"https://image.tmdb.org/t/p/w342/2iWYQia8enOai7QEO3TvenleD7r.jpg"},{"id":"tt0090015","name":"Shoah","year":"1985","poster":"https://image.tmdb.org/t/p/w342/8hr8NdnMygKF2Mbu3eDDQCB5lKg.jpg"},{"id":"tt1185616","name":"Waltz with Bashir","year":"2008","poster":"https://image.tmdb.org/t/p/w342/zQaCv7lKwHsh0YSHkt1QNjIOZ1c.jpg"},{"id":"tt1483831","name":"Lebanon","year":"2009","poster":"https://image.tmdb.org/t/p/w342/ulWjW1KhMLHwWJ97593reBhnXlv.jpg"},{"id":"tt0077416","name":"The Deer Hunter","year":"1978","poster":"https://image.tmdb.org/t/p/w342/bbGtogDZOg09bm42KIpCXUXICkh.jpg"},{"id":"tt0091763","name":"Platoon","year":"1986","poster":"https://image.tmdb.org/t/p/w342/m3mmFkPQKvPZq5exmh0bDuXlD9T.jpg"},{"id":"tt0093058","name":"Full Metal Jacket","year":"1987","poster":"https://image.tmdb.org/t/p/w342/kMKyx1k8hWWscYFnPbnxxN4Eqo4.jpg"},{"id":"tt0078788","name":"Apocalypse Now","year":"1979","poster":"https://image.tmdb.org/t/p/w342/gQB8Y5RCMkv2zwzFHbUJX3kAhvA.jpg"},{"id":"tt0120863","name":"The Thin Red Line","year":"1998","poster":"https://image.tmdb.org/t/p/w342/seMydAaoxQP6F0xbE1jOcTmn5Jr.jpg"},{"id":"tt0498380","name":"Letters from Iwo Jima","year":"2006","poster":"https://image.tmdb.org/t/p/w342/kZokxQtzMPURvijWYFuvh1fAvnv.jpg"},{"id":"tt0108211","name":"Stalingrad","year":"1993","poster":"https://image.tmdb.org/t/p/w342/hEHmXFMOBJv5c6Gd5m6mDiLAxsy.jpg"},{"id":"tt0420901","name":"Shooting Dogs","year":"2006","poster":"https://image.tmdb.org/t/p/w342/9xC2yUgqPVvoHykYuigrxLyunya.jpg"},{"id":"tt0400063","name":"Sometimes in April","year":"2005","poster":"https://image.tmdb.org/t/p/w342/jDr1iXVPKSdzPMb1QeGwacEL9Vq.jpg"},{"id":"tt0283509","name":"No Man's Land","year":"2001","poster":"https://image.tmdb.org/t/p/w342/oTEmaYRKqWig5lhmwEQE0ZU3SRl.jpg"},{"id":"tt0116860","name":"Pretty Village, Pretty Flame","year":"1996","poster":"https://image.tmdb.org/t/p/w342/1qiCayfLJa4VugmyqNfm1hw67RO.jpg"},{"id":"tt6828390","name":"Mr. Jones","year":"2019","poster":"https://image.tmdb.org/t/p/w342/vpCKOsAmKLD67mwugN6hrPvdPZl.jpg"},{"id":"tt24082438","name":"20 Days in Mariupol","year":"2023","poster":"https://image.tmdb.org/t/p/w342/zIRp1IeuPh4GgqFCH3y0DQuY9xP.jpg"},{"id":"tt5474178","name":"Donbass","year":"2016","poster":"https://image.tmdb.org/t/p/w342/gSAw4wtVw4258CGbWdbDNewWywK.jpg"},{"id":"tt2375605","name":"The Act of Killing","year":"2012","poster":"https://image.tmdb.org/t/p/w342/sp5B7Tz5ttsgOLnIlCP5uEhtesI.jpg"},{"id":"tt3521134","name":"The Look of Silence","year":"2014","poster":"https://image.tmdb.org/t/p/w342/7TakQLT8gyzIMG8hX8RLTd5qROQ.jpg"},{"id":"tt4882376","name":"First They Killed My Father","year":"2017","poster":"https://image.tmdb.org/t/p/w342/5370jxJfZQY8TUZiiGkpNgvRwU9.jpg"},{"id":"tt1042424","name":"Johnny Mad Dog","year":"2008","poster":"https://image.tmdb.org/t/p/w342/7YspfHUzOSpqdEiGJIR9P6ab0g.jpg"},{"id":"tt1255953","name":"Incendies","year":"2010","poster":"https://image.tmdb.org/t/p/w342/yH6DAQVgbyj72S66gN4WWVoTjuf.jpg"},{"id":"tt3841424","name":"Land of Mine","year":"2015","poster":"https://image.tmdb.org/t/p/w342/7TOYH2VDnYbXpBKlrkdQZUSC3Du.jpg"},{"id":"tt0052961","name":"Kapo","year":"1960","poster":"https://image.tmdb.org/t/p/w342/lAd0NUnvTFkgcwbJmbx0sffn7Bk.jpg"},{"id":"tt0082432","name":"Gallipoli","year":"1981","poster":"https://image.tmdb.org/t/p/w342/un7VCqTmjrq3u75mQ204a8tofD4.jpg"},{"id":"tt0058946","name":"The Battle of Algiers","year":"1966","poster":"https://image.tmdb.org/t/p/w342/2p3AFtOHFvP6OeVMqlnL1zLKOqL.jpg"},{"id":"tt0085218","name":"Barefoot Gen","year":"1983","poster":"https://image.tmdb.org/t/p/w342/kVqQToQ47e27b9uoryttWgTPiik.jpg"},{"id":"tt0096933","name":"Black Rain","year":"1989","poster":"https://image.tmdb.org/t/p/w342/funhGWt9ee3Uwb6Ar8SGCCvbJdV.jpg"},{"id":"tt0049012","name":"The Burmese Harp","year":"1956","poster":"https://image.tmdb.org/t/p/w342/aQbrTw1srrfDbte9ZduzF2bTKDI.jpg"},{"id":"tt0067277","name":"Johnny Got His Gun","year":"1971","poster":"https://image.tmdb.org/t/p/w342/ryIY3FPmTtXu9g6W4I69qCdkxKj.jpg"},{"id":"tt0050585","name":"Kanal","year":"1957","poster":"https://image.tmdb.org/t/p/w342/mUxZNNmvX3MwIJ9LTcuw76ZdtN6.jpg"},{"id":"tt0093170","name":"Men Behind the Sun","year":"1988","poster":"https://image.tmdb.org/t/p/w342/vTbOXA1gBIhuumN5CnRhxfDp9xY.jpg"},{"id":"tt0363163","name":"Downfall","year":"2004","poster":"https://image.tmdb.org/t/p/w342/cP1ElGjBhbZAAqmueXjHDKlSwiP.jpg"},{"id":"tt0099776","name":"Europa Europa","year":"1990","poster":"https://image.tmdb.org/t/p/w342/CCaA0tjLNjwFfi34XsouCy9Lm6.jpg"},{"id":"tt0073502","name":"Overlord","year":"1975","poster":"https://image.tmdb.org/t/p/w342/2bpWZ9RwFRUwtu86v1v60p6QuYR.jpg"},{"id":"tt0052893","name":"Hiroshima Mon Amour","year":"1959","poster":"https://image.tmdb.org/t/p/w342/zieczjWnvalaxwX5EQASEx0on5f.jpg"},{"id":"tt3622120","name":"Kajaki","year":"2014","poster":"https://image.tmdb.org/t/p/w342/csL2D3ZbcxSoqoWyhYz4lDjdmk2.jpg"},{"id":"tt1559549","name":"Restrepo","year":"2010","poster":"https://image.tmdb.org/t/p/w342/62DCMBMJU1ZVezVEawyatpFoJwI.jpg"},{"id":"tt9617456","name":"For Sama","year":"2019","poster":"https://image.tmdb.org/t/p/w342/mDna51F8QfrJFZOgPGQUz3VKqsB.jpg"},{"id":"tt14321668","name":"The Conference","year":"2022","poster":"https://image.tmdb.org/t/p/w342/8uOdIP7GowDMroxy1zSmBBaRCJw.jpg"}]},
{"id":"harrowing-war-series","name":"Harrowing war series","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"1327|11872|14900|190351|212423|14546|9281","with_genres":"10768|36|99","without_genres":"16,10751,35"}},
{"id":"war-sinojapanese","name":"The Second Sino-Japanese War","type":"movie","params":{"sort_by":"popularity.desc","with_keywords":"321999|10535|217895|190931","without_genres":"16,10751"}},
{"id":"war-korea","name":"The Korean War","type":"movie","params":{"sort_by":"popularity.desc","with_keywords":"373511|197794|3264","without_genres":"16,10751"}},
{"id":"war-coldwar","name":"The Cold War","type":"movie","params":{"sort_by":"popularity.desc","with_keywords":"2106|224693|7059","without_genres":"16,10751"}},
{"id":"war-coldwar-series","name":"The Cold War (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"2106|224693|7059","without_genres":"16,10751"}},
{"id":"war-sovafghan","name":"The Soviet–Afghan War","type":"movie","params":{"sort_by":"popularity.desc","with_keywords":"194440","without_genres":"16,10751"}},
{"id":"war-iraniraq","name":"The Iran–Iraq War","type":"movie","params":{"sort_by":"popularity.desc","with_keywords":"259106|277034","without_genres":"16,10751"}},
{"id":"war-falklands","name":"The Falklands War","type":"movie","params":{"sort_by":"popularity.desc","with_keywords":"33852","without_genres":"16,10751"}},
{"id":"war-troubles","name":"The Troubles in Northern Ireland","type":"movie","params":{"sort_by":"popularity.desc","with_keywords":"230977","without_genres":"16,10751"}},
{"id":"war-israel","name":"Israel, Palestine and the Arab–Israeli wars","type":"movie","params":{"sort_by":"popularity.desc","with_keywords":"381382|359486|5907|275377|208908|255640|235551|257142|8344|367115","without_genres":"16,10751"}},
{"id":"war-israel-series","name":"Israel, Palestine and the Arab–Israeli wars (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"381382|359486|5907|275377|208908|255640|235551|257142|8344|367115","without_genres":"16,10751"}},
{"id":"war-lebanon","name":"The Lebanese Civil War","type":"movie","params":{"sort_by":"popularity.desc","with_keywords":"236275","without_genres":"16,10751"}},
{"id":"war-indopak","name":"India–Pakistan wars and Partition","type":"movie","params":{"sort_by":"popularity.desc","with_keywords":"227377|379258|158512|360299","without_genres":"16,10751"}},
{"id":"war-yugoslav","name":"The Yugoslav wars","type":"movie","params":{"sort_by":"popularity.desc","with_keywords":"343883|7973|260216|363031","without_genres":"16,10751"}},
{"id":"war-rwanda","name":"The Rwandan genocide","type":"movie","params":{"sort_by":"popularity.desc","with_keywords":"8053","without_genres":"16,10751"}},
{"id":"war-syria","name":"The Syrian civil war","type":"movie","params":{"sort_by":"popularity.desc","with_keywords":"256693","without_genres":"16,10751"}},
{"id":"war-ukraine","name":"The Russia–Ukraine war","type":"movie","params":{"sort_by":"popularity.desc","with_keywords":"301386|252606","without_genres":"16,10751"}},
{"id":"war-karabakh","name":"Nagorno-Karabakh wars","type":"movie","params":{"sort_by":"popularity.desc","with_keywords":"331737|271665|331736","without_genres":"16,10751"}},
// Series versions of the keyword microgenres (same TMDB keywords, TV genres; each checked for 18+ shows)
{"id":"haunted-houses-series","name":"Haunted house series","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"3358","without_genres":"16,10751"}},
{"id":"witches-series","name":"Witches and witchcraft (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"616|40931","with_genres":"18","without_genres":"16,10751"}},
{"id":"cults-series","name":"Cults and communes (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"162766|159028|2412","without_genres":"16,10751"}},
{"id":"dystopias-series","name":"Dystopian futures (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"4565","without_genres":"16,10751"}},
{"id":"time-loops-series","name":"Stuck in a time loop (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"10854","without_genres":"16,10751"}},
{"id":"ai-minds-series","name":"Artificial intelligence (AI & thinking machines) (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"310|803","without_genres":"16,10751"}},
{"id":"post-apocalypse-series","name":"After the end of the world (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"4458","without_genres":"16,10751"}},
{"id":"nature-docs-series","name":"Nature documentaries (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"18330|9902","with_genres":"99","without_genres":"16,10751"}},
{"id":"wilderness-survival-series","name":"Survival in the wild (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"3593,10349","without_genres":"16,10751"}},
{"id":"mountains-series","name":"Mountains and climbers (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"160177|159212","without_genres":"16,10751"}},
{"id":"neo-noir-series","name":"Neo-noir (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"207268","without_genres":"16,10751"}},
{"id":"small-town-secrets-series","name":"Small towns with secrets (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"1415","with_genres":"9648","without_genres":"16,10751"}},
{"id":"whodunits-series","name":"Whodunits (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"12570","without_genres":"16,10751"}},
{"id":"true-crime-series","name":"Based on true crimes (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"9672","with_genres":"80","without_genres":"16,10751"}},
{"id":"mockumentary-series","name":"Mockumentaries (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"11800","without_genres":"16,10751"}},
{"id":"surreal-series","name":"Surreal and dreamlike (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"9887|3307","without_genres":"16,10751,12"}},
{"id":"satire-series","name":"Satire (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"8201","without_genres":"16,10751"}},
{"id":"movies-about-movies-series","name":"series about making series","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"33490|886","without_genres":"16,10751"}},
{"id":"martial-arts-series","name":"Martial arts (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"779","without_genres":"16,10751"}},
{"id":"adult-animation-series","name":"Animation for adults (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"161919","with_genres":"16"}},
{"id":"mythology-series","name":"Myths and ancient gods (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"2035|2036","without_genres":"16,10751"}},
{"id":"submarines-series","name":"Submarines (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"339","without_genres":"16,10751"}},
{"id":"pirates-series","name":"Pirates (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"12988","without_genres":"16,10751"}},
{"id":"vampires-series","name":"Vampires, old and new (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"3133","with_genres":"18","without_genres":"16,10751"}},
{"id":"possession-series","name":"Possession and exorcism (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"2626|161261","without_genres":"16,10751"}},
{"id":"halloween-night-series","name":"Set on Halloween night (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"3335","without_genres":"16,10751"}},
{"id":"kaiju-series","name":"Kaiju and giant monsters (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"161791","without_genres":"16,10751"}},
{"id":"dinosaurs-series","name":"Dinosaurs (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"12616","without_genres":"16,10751"}},
{"id":"time-travel-series","name":"Time travel paradoxes (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"4379|208757","without_genres":"16,10751"}},
{"id":"parallel-worlds-series","name":"Parallel worlds (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"33465|336874","without_genres":"16,10751,28"}},
{"id":"cyborgs-series","name":"Cyborgs and body upgrades (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"679","without_genres":"16,10751"}},
{"id":"alien-invasion-series","name":"Alien invasion (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"14909","with_genres":"10765","without_genres":"12,16,10751"}},
{"id":"the-moon-series","name":"The Moon (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"305","with_genres":"10765|99|18","without_genres":"16,10751"}},
{"id":"space-stations-series","name":"Space stations and lonely ships (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"156039|1612|252937","with_genres":"10765","without_genres":"16,10751"}},
{"id":"astronauts-series","name":"Astronauts (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"14626","without_genres":"16,10751"}},
{"id":"virtual-reality-series","name":"Virtual reality (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"4563","without_genres":"16,10751"}},
{"id":"hackers-series","name":"Hackers (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"2157|303918","with_genres":"80","without_genres":"12"}},
{"id":"pandemics-series","name":"Pandemics and outbreaks (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"188973|17995|188957","without_genres":"16,10751"}},
{"id":"climate-series","name":"Climate and ecological collapse (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"2210|33480","without_genres":"16"}},
{"id":"disasters-series","name":"Natural disasters (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"5096|3521|3347|2213|6941","with_genres":"10759|18","without_genres":"14,16,10751,27"}},
{"id":"memory-loss-series","name":"Memory loss (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"1453|11469","without_genres":"16,10751"}},
{"id":"body-swap-series","name":"Body swaps (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"33721","without_genres":"16,10751"}},
{"id":"serial-killers-series","name":"Serial killer procedurals (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"10714","with_genres":"80","without_genres":"16,10751"}},
{"id":"hitmen-series","name":"Hitmen and assassins (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"2708|782","without_genres":"16,10751"}},
{"id":"con-artists-series","name":"Con artists and grifters (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"10453|180250|11454","without_genres":"16,10751"}},
{"id":"yakuza-series","name":"Yakuza (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"1794","without_genres":"16,10751"}},
{"id":"mafia-series","name":"The mafia (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"10391|11578","without_genres":"16,10751"}},
{"id":"cartels-series","name":"Cartels (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"10175","without_genres":"16,10751"}},
{"id":"prison-series","name":"Prison series","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"378","with_genres":"18|80","without_genres":"16,10751"}},
{"id":"courtroom-series","name":"Courtroom dramas (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"33519","without_genres":"16,10751"}},
{"id":"journalists-series","name":"Journalists chasing the story (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"917|736|195240","with_genres":"18","without_genres":"16,10751"}},
{"id":"spies-all-series","name":"Spies (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"470|5265","without_genres":"16,10751"}},
{"id":"buddy-cops-series","name":"Buddy cops (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"167316","without_genres":"16,10751"}},
{"id":"police-corruption-series","name":"Dirty cops (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"11734|267608","without_genres":"16,10751"}},
{"id":"vigilantes-series","name":"Vigilantes (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"7002","without_genres":"16,10751"}},
{"id":"gambling-series","name":"Gambling and casinos (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"395|585|383","without_genres":"16,10751"}},
{"id":"las-vegas-series","name":"Las Vegas (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"14570","without_genres":"16,10751"}},
{"id":"new-orleans-series","name":"New Orleans (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"2411","without_genres":"16,10751"}},
{"id":"texas-series","name":"Texas (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"1556","without_genres":"16,10751"}},
{"id":"tokyo-series","name":"Tokyo (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"12369","without_genres":"16,10751"}},
{"id":"paris-series","name":"Paris (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"90","without_genres":"16,10751"}},
{"id":"nyc-70s-series","name":"New York in the 1970s (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"242","without_genres":"16,10751","first_air_date.gte":"1970-01-01","first_air_date.lte":"1979-12-31"}},
{"id":"la-noir-series","name":"Los Angeles noir (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"12670","with_genres":"80","without_genres":"16,10751"}},
{"id":"vietnam-series","name":"Vietnam War (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"2957","without_genres":"16,10751"}},
{"id":"ww1-series","name":"World War I (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"2504","without_genres":"16,10751"}},
{"id":"samurai-series","name":"Samurai (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"1462","without_genres":"16,10751"}},
{"id":"ninjas-series","name":"Ninjas (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"10278","without_genres":"878,16,10751"}},
{"id":"wuxia-series","name":"Wuxia (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"184656|779","without_genres":"16,10751","with_origin_country":"CN|HK|TW"}},
{"id":"medieval-series","name":"Medieval grit (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"161257","without_genres":"16,10751"}},
{"id":"ancient-rome-series","name":"Ancient Rome (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"5049|1405|1394","without_genres":"16,10751"}},
{"id":"ancient-egypt-series","name":"Ancient Egypt (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"157894|163338","without_genres":"16,10751"}},
{"id":"victorian-series","name":"Victorian England (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"8250|207928","without_genres":"16,10751","with_origin_country":"GB"}},
{"id":"outlaws-series","name":"Outlaws on the run (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"9503","with_genres":"37|80","without_genres":"16,10751"}},
{"id":"trains-series","name":"Trains (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"13008","without_genres":"16,10751"}},
{"id":"chefs-series","name":"Chefs, kitchens and restaurants (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"18293|1946|1918","with_genres":"18|35","without_genres":"27,16,10751"}},
{"id":"painters-series","name":"Painters and artists (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"437|2679","with_genres":"18","without_genres":"16,10751"}},
{"id":"photographers-series","name":"Photographers (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"1003|6025","with_genres":"18","without_genres":"16,10751"}},
{"id":"rock-bands-series","name":"Rock bands on the road (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"18001|311916","with_genres":"18|35","without_genres":"16,10751"}},
{"id":"hip-hop-series","name":"Hip-hop (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"898|897|4562","without_genres":"16,10751"}},
{"id":"dance-series","name":"Dance series","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"1691|246","without_genres":"16"}},
{"id":"theater-kids-series","name":"Life in the theater (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"285695|195729|257714","with_genres":"18|35","without_genres":"16,10751"}},
{"id":"boxing-series","name":"Boxing (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"209476","without_genres":"16,10751"}},
{"id":"baseball-series","name":"Baseball (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"1480","without_genres":"16,10751"}},
{"id":"surfing-series","name":"Surfing (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"5349|1524","without_genres":"16,10751"}},
{"id":"boarding-school-series","name":"Boarding schools (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"6271","without_genres":"16,10751"}},
{"id":"college-series","name":"College years (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"3616|13160","with_genres":"35|18","without_genres":"16,10751"}},
{"id":"midlife-series","name":"Midlife crises (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"1599","without_genres":"16,10751"}},
{"id":"grief-series","name":"Grief (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"9872","with_genres":"18","without_genres":"16,10751"}},
{"id":"loneliness-series","name":"Loneliness (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"9957","with_genres":"18","without_genres":"16,10751"}},
{"id":"addiction-series","name":"Addiction (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"1803|7464","with_genres":"18","without_genres":"16,10751"}},
{"id":"siblings-series","name":"Siblings (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"375255|240485|241738","with_genres":"18","without_genres":"16,10751"}},
{"id":"fathers-sons-series","name":"Fathers and sons (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"240119","with_genres":"18","without_genres":"16,10751"}},
{"id":"mothers-daughters-series","name":"Mothers and daughters (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"240315","with_genres":"18","without_genres":"16,10751"}},
{"id":"friendship-women-series","name":"Female friendship (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"5248","without_genres":"16,10751"}},
{"id":"lgbt-series","name":"Queer series","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"158718|258533|264386","without_genres":"16,10751"}},
{"id":"religion-series","name":"Faith and doubt (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"11001|6150|10093","with_genres":"18","without_genres":"16,10751"}},
{"id":"politics-series","name":"Politics and elections (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"6078|6085|6083","with_genres":"18|35","without_genres":"28,12,14,16"}},
{"id":"revolutions-series","name":"Revolutions (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"2020","with_genres":"18|10768","without_genres":"878"}},
{"id":"immigrants-series","name":"Immigrants and new lives (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"2356|1900","with_genres":"18","without_genres":"16,10751"}},
{"id":"based-on-play-series","name":"Adapted from plays (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"10181","without_genres":"16,10751"}},
{"id":"novels-lit-series","name":"Literary adaptations (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"818","with_genres":"18","without_genres":"16,10751"}},
{"id":"love-triangles-series","name":"Love triangles (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"128","without_genres":"16,10751"}},
{"id":"first-love-series","name":"First love (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"157303","without_genres":"16,10751"}},
{"id":"parody-series","name":"Parodies and spoofs (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"9755|11931","without_genres":"16,10751"}},
{"id":"fish-out-of-water-series","name":"Fish out of water (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"11860","without_genres":"16,10751"}},
{"id":"workplace-series","name":"Workplace comedies (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"6282|1438","with_genres":"35","without_genres":"16,10751"}},
{"id":"weddings-series","name":"Weddings gone wrong (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"13027","with_genres":"35","without_genres":"16,10751"}},
{"id":"anthology-films-series","name":"Anthology series","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"9706","without_genres":"16,10751"}},
{"id":"remakes-series","name":"Remakes (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"9714","without_genres":"16,10751"}},
{"id":"comic-adaptations-indie-series","name":"Comic adaptations that aren't superhero series","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"9717","without_genres":"28,12,16,10751"}},
{"id":"anti-heroes-series","name":"Anti-heroes (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"2095","without_genres":"16,10751"}},
{"id":"video-games-series","name":"Video-game adaptations (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"41645","without_genres":"16,10751"}},
{"id":"toys-come-alive-series","name":"Toys and games come alive (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"265589|10090","without_genres":"16"}},
{"id":"animals-docs-series","name":"Animal docs (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"361118|9902","with_genres":"99","without_genres":"16,10751"}},
{"id":"forests-series","name":"Forests (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"5774","without_genres":"16,10751"}},
{"id":"islands-series","name":"Islands (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"2041","without_genres":"16,10751"}},
{"id":"jungles-series","name":"Jungles (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"10787","without_genres":"16,10751"}},
{"id":"farming-series","name":"Farms and farmers (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"4932|154846","without_genres":"16,10751"}},
{"id":"food-docs-series","name":"Food documentaries (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"10637","with_genres":"99","without_genres":"16,10751"}},
{"id":"space-docs-series","name":"Space documentaries (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"9882|1432|252634","with_genres":"99","without_genres":"16,10751"}},
{"id":"art-docs-series","name":"Art documentaries (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"14893|2679|437","with_genres":"99","without_genres":"16,10751"}},
{"id":"crime-docs-series","name":"Crime documentaries (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"33722|9826","with_genres":"99","without_genres":"16,10751"}},
{"id":"sports-docs-series","name":"Sports documentaries (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"333328|6075","with_genres":"99","without_genres":"16,10751"}},
{"id":"psychotronic-series","name":"Psychotronic series","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"164218|259982","without_genres":"16,10751"}},
{"id":"jidaigeki-series","name":"Jidaigeki: Japanese period drama (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"186753","without_genres":"16,10751"}},
{"id":"live-action-animation-series","name":"Live action meets animation (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"209220"}},
{"id":"whimsical-series","name":"Whimsical series","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"324713"}},
{"id":"melancholy-series","name":"Melancholy series","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"4232","without_genres":"16,10751"}},
{"id":"gore-series","name":"Gore and splatter (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"10292","without_genres":"16,10751"}},
{"id":"psychological-horror-series","name":"Psychological horror (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"295907","without_genres":"16,10751"}},
{"id":"robots-series","name":"Robots and androids (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"14544","without_genres":"16,10751"}},
{"id":"femme-fatales-series","name":"Femme fatales (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"9016","without_genres":"16,10751"}},
{"id":"private-eyes-series","name":"Private eyes (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"155790","without_genres":"16,10751"}},
{"id":"dreams-nightmares-series","name":"Dreams and nightmares (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"1566|3030","without_genres":"16,10751"}},
{"id":"rock-n-roll-series","name":"Rock 'n' roll series","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"578","without_genres":"16,10751"}},
{"id":"twins-doubles-series","name":"Twins and doubles (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"15016","without_genres":"16,10751"}},
{"id":"softcore-series","name":"Softcore and erotic series","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"155477|190370","without_genres":"16,10751"}},
{"id":"philosophical-series","name":"Philosophical series","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"212737","without_genres":"16,10751"}},
{"id":"snowbound-series","name":"Snowbound (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"1442","without_genres":"16,10751"}},
{"id":"hollywood-on-hollywood-series","name":"Hollywood on Hollywood (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"12396","without_genres":"16,10751"}},
{"id":"curses-series","name":"Curses (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"10541","without_genres":"16,10751"}},
{"id":"devil-hell-series","name":"The Devil and Hell (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"14999|6154","without_genres":"16,10751"}},
{"id":"post-ww2-series","name":"After World War II (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"160224","without_genres":"16,10751"}},
{"id":"american-civil-war-series","name":"The American Civil War (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"179585","without_genres":"16,10751"}},
{"id":"gulf-iraq-afghanistan-series","name":"The Gulf, Iraq and Afghanistan wars (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"2952|15087|8159|7158|1242","without_genres":"16,10751"}},
// obscure sports, then one "Everything else" per family: whatever the family's own microgenres don't claim
{"id":"obscure-sports","name":"Obscure sports: curling, sumo, roller derby and the rest","type":"movie","params":{"sort_by":"popularity.desc","with_keywords":"190166|11282|276964|5526|420|156191|168929|171459|10671|188086|10825|734|362510|1019|158370|262385|245203|10110|11146|195012|235329|191217|231036|206334|11672|204402|159960|222165|268859|378849|193761|194988|325084|371344|192789|166939|386812|994|345732|155720|319933|236692|228060|358437|11035|161320","without_genres":"16"}},
{"id":"obscure-sports-series","name":"Obscure sports (series)","type":"series","params":{"sort_by":"popularity.desc","with_keywords":"190166|11282|276964|5526|420|156191|168929|171459|10671|188086|10825|734|362510|1019|158370|262385|245203|10110|11146|195012|235329|191217|231036|206334|11672|204402|159960|222165|268859|378849|193761|194988|325084|371344|192789|166939|386812|994|345732|155720|319933|236692|228060|358437|11035|161320"}},
{"id":"other-cult","name":"Everything else (Cult, camp & exploitation)","type":"movie","family":"cult","catchall":true,"params":{"sort_by":"vote_count.desc","with_keywords":"2804|11034","without_keywords":"207767,11532,335236,189921,164218,259982,156764,155493,155477,190370,285961,195222,196543,366511,206750,306327,310127,201028,345799,365846,224663"}},
{"id":"other-cult-series","name":"Everything else (Cult, camp & exploitation) (series)","type":"series","family":"cult","catchall":true,"params":{"sort_by":"vote_count.desc","with_keywords":"2804|11034","without_keywords":"164218,259982,155477,190370"}},
{"id":"other-animation","name":"Everything else (Animation)","type":"movie","family":"animation","catchall":true,"params":{"sort_by":"vote_count.desc","with_genres":"16","without_keywords":"10121,161919,197065,214793,209220,13141,278823"}},
{"id":"other-animation-series","name":"Everything else (Animation) (series)","type":"series","family":"animation","catchall":true,"params":{"sort_by":"vote_count.desc","with_genres":"16","without_keywords":"161919,10046,237451,9914,13141,10121,197065,209220"}},
{"id":"other-docs","name":"Everything else (Documentaries)","type":"movie","family":"docs","catchall":true,"params":{"sort_by":"vote_count.desc","with_genres":"99","without_keywords":"18330,9902,305,361118,18007,277462,240242,10637,9882,1432,252634,14893,2679,437,33722,9826,10410,333328,6075,390,5349,3522,2070,276164,365784,365923,6029,1327,11872,14900,190351,212423,14546,9281"}},
{"id":"other-docs-series","name":"Everything else (Documentaries) (series)","type":"series","family":"docs","catchall":true,"params":{"sort_by":"vote_count.desc","with_genres":"99","without_keywords":"18330,9902,33722,1918,18293,9935,361118,282633,1327,11872,14900,190351,212423,14546,9281,305,10637,9882,1432,252634,14893,2679,437,9826,333328,6075"}},
{"id":"other-horror","name":"Everything else (Horror)","type":"movie","family":"horror","catchall":true,"params":{"sort_by":"vote_count.desc","with_genres":"27","without_keywords":"209568,12339,283085,287274,215959,158126,361094,163053,3358,321335,5160,14662,2988,616,40931,13209,3623,3133,12564,12377,2626,161261,14903,5767,207317,3335,33630,6300,9704,3199,10125,161891,376610,3099,156174,745,270343,278235,14895,2884,11857,10323,10794,156783,18034,1585,3891,158175,1994,161791,612,162846,3205,14909,2597,210214,11220,323910,10603,180691,9707,10292,323756,50009,15032,295907,9712,15001,3392,3098,12545,9720,11004,2546,1890,10541,14999,6154,1227"}},
{"id":"other-horror-series","name":"Everything else (Horror) (series)","type":"series","family":"horror","catchall":true,"params":{"sort_by":"vote_count.desc","with_keywords":"315058|6152","without_keywords":"9706,3133,12377,3358,616,40931,2626,161261,3335,161791,10292,295907,10541,14999,6154"}},
{"id":"other-mood","name":"Everything else (Moods, endings & form)","type":"movie","family":"mood","catchall":true,"params":{"sort_by":"vote_count.desc","with_genres":"18|9648|14","vote_count.gte":50,"without_keywords":"12565,9887,3307,326438,275311,173361,162914,12999,10181,293336,15216,9706,162810,324713,4232,1566,3030,3298,41410,6255,15016,212737,165402,207082,1541,213742,358964,230747,2300,214595,368386,380730,348145,301728,193110,191260,368391,375722,364573"}},
{"id":"other-mood-series","name":"Everything else (Moods, endings & form) (series)","type":"series","family":"mood","catchall":true,"params":{"sort_by":"vote_count.desc","with_genres":"18|9648","vote_count.gte":20,"without_keywords":"9706,9887,3307,10181,324713,4232,1566,3030,15016,212737"}},
{"id":"other-war","name":"Everything else (War, history & westerns)","type":"movie","family":"war","catchall":true,"params":{"sort_by":"vote_count.desc","with_genres":"10752|36|37","without_keywords":"156212,2035,2036,339,12988,2106,470,1956,836,15182,174375,2957,2504,3588,160860,226475,1462,10278,161257,5049,1405,1394,157894,163338,8250,207928,168713,9503,157186,2020,15060,186753,187305,160224,179585,33384,2952,15087,8159,7158,1242,5509,252639,213473,371555,1327,11872,14900,190351,212423,14546,9281,321999,10535,217895,190931,373511,197794,3264,224693,7059,194440,259106,277034,33852,230977,381382,359486,5907,275377,208908,255640,235551,257142,8344,367115,236275,227377,379258,158512,360299,343883,7973,260216,363031,8053,256693,301386,252606,331737,271665,331736"}},
{"id":"other-war-series","name":"Everything else (War, history & westerns) (series)","type":"series","family":"war","catchall":true,"params":{"sort_by":"vote_count.desc","with_genres":"10768|37","without_keywords":"15060,282633,1956,1327,11872,14900,190351,212423,14546,9281,2106,224693,7059,381382,359486,5907,275377,208908,255640,235551,257142,8344,367115,2035,2036,339,12988,2957,2504,1462,10278,161257,5049,1405,1394,157894,163338,8250,207928,9503,2020,186753,160224,179585,2952,15087,8159,7158,1242"}},
{"id":"other-scifi","name":"Everything else (Sci-fi & fantasy)","type":"movie","family":"scifi","catchall":true,"params":{"sort_by":"vote_count.desc","with_genres":"878|14","without_keywords":"4565,12190,10854,211248,160515,310,803,4458,12564,10125,161791,3205,4379,208757,33465,336874,402,11628,679,14909,305,156039,1612,252937,14626,4563,2157,303918,18420,188973,17995,188957,677,1815,160381,2210,33480,1852,1618,163561,1453,11469,33721,1370,350919,189115,271162,6104,11615,3469,157171,173361,9717,9882,1432,252634,317204,234213,323910,14544"}},
{"id":"other-scifi-series","name":"Everything else (Sci-fi & fantasy) (series)","type":"series","family":"scifi","catchall":true,"params":{"sort_by":"vote_count.desc","with_genres":"10765","without_keywords":"9706,4379,161176,252937,4565,317204,10854,310,803,4458,161791,208757,33465,336874,679,14909,305,156039,1612,14626,4563,2157,303918,188973,17995,188957,2210,33480,1453,11469,33721,9717,9882,1432,252634,14544"}},
{"id":"other-crime","name":"Everything else (Crime, mystery & thrillers)","type":"movie","family":"crime","catchall":true,"params":{"sort_by":"vote_count.desc","with_genres":"80|53|9648","without_keywords":"321335,5160,14662,2988,616,40931,12565,207268,10051,10410,2340,207767,1415,9748,12570,9672,3133,3199,161891,376610,745,270343,278235,14895,2884,11857,10323,10794,156783,18034,158175,1994,2157,303918,18420,5096,3521,3347,2213,6941,6104,11615,10714,2708,782,15363,10453,180250,11454,1794,10391,11578,10175,378,9777,33519,917,736,195240,1930,1562,2106,470,5265,167316,11734,267608,7002,12670,3149,9503,6078,6085,6083,33722,9826,184352,9807,9016,155790,3098,12545"}},
{"id":"other-crime-series","name":"Everything else (Crime, mystery & thrillers) (series)","type":"series","family":"crime","catchall":true,"params":{"sort_by":"vote_count.desc","with_genres":"80|9648","without_keywords":"33722,1735,10051,10391,10291,470,5265,10909,33519,268067,207268,1415,12570,9672,2157,303918,10714,2708,782,10453,180250,11454,1794,11578,10175,378,917,736,195240,167316,11734,267608,7002,12670,9503,9826,9016,155790"}},
{"id":"other-comedy","name":"Everything else (Comedy & satire)","type":"movie","family":"comedy","catchall":true,"params":{"sort_by":"vote_count.desc","with_genres":"35","without_keywords":"10123,34079,11800,302399,10776,214655,8201,12377,18293,1946,1918,18001,311916,285695,195729,257714,3616,13160,6078,6085,6083,9755,11931,155457,160362,6282,1438,13027,10051,18007,277462,240242,170827,4553,383021,197707"}},
{"id":"other-comedy-series","name":"Everything else (Comedy & satire) (series)","type":"series","family":"comedy","catchall":true,"params":{"sort_by":"vote_count.desc","with_genres":"35","without_keywords":"11800,6282,193171,18035,156203,10123,4553,383021,197707,8201,18293,1946,1918,18001,311916,285695,195729,257714,3616,13160,6078,6085,6083,9755,11931,1438,13027"}},
{"id":"other-romance","name":"Everything else (Love & relationships)","type":"movie","family":"romance","catchall":true,"params":{"sort_by":"vote_count.desc","with_genres":"10749","without_keywords":"287274,215959,33505,18293,1946,1918,15060,3691,128,157303,13027"}},
{"id":"other-romance-series","name":"Everything else (Love & relationships) (series)","type":"series","family":"romance","catchall":true,"params":{"sort_by":"vote_count.desc","with_keywords":"9840|386551|9673","without_keywords":"128,157303,13027"}},
{"id":"other-world","name":"Everything else (World cinema)","type":"movie","family":"world","catchall":true,"params":{"sort_by":"vote_count.desc","with_origin_country":"","vote_count.gte":20}},
{"id":"other-world-series","name":"Everything else (World cinema) (series)","type":"series","family":"world","catchall":true,"params":{"sort_by":"vote_count.desc","with_origin_country":"","vote_count.gte":5}},
{"id":"other-places","name":"Everything else (Places & settings)","type":"movie","family":"places","catchall":true,"params":{"sort_by":"vote_count.desc","with_keywords":"9935|282997","without_keywords":"3358,2769,14785,160177,159212,167043,612,11532,335236,156039,1612,252937,14570,2411,1556,12369,90,242,12670,13008,18001,311916,11130,318182,5774,2041,10787,4932,154846,1442"}},
{"id":"other-places-series","name":"Everything else (Places & settings) (series)","type":"series","family":"places","catchall":true,"params":{"sort_by":"vote_count.desc","with_keywords":"9935|282997","without_keywords":"1415,3358,160177,159212,156039,1612,252937,14570,2411,1556,12369,90,242,12670,13008,18001,311916,5774,2041,10787,4932,154846,1442"}},
{"id":"other-nature","name":"Everything else (Nature & creatures)","type":"movie","family":"nature","catchall":true,"params":{"sort_by":"vote_count.desc","with_keywords":"18330|9902|361118","without_keywords":"332,7035,193068,349958,4551,9750,162775,221253,333,3593,10349,2769,14785,15097,12616,5096,3521,3347,2213,6941,4676,630,1261"}},
{"id":"other-nature-series","name":"Everything else (Nature & creatures) (series)","type":"series","family":"nature","catchall":true,"params":{"sort_by":"vote_count.desc","with_keywords":"18330|9902|361118","without_keywords":"3593,10349,12616,5096,3521,3347,2213,6941"}},
{"id":"other-arts","name":"Everything else (Music, art & showbiz)","type":"movie","family":"arts","catchall":true,"params":{"sort_by":"vote_count.desc","with_keywords":"14893|2679|4048|283297|1691|285695","without_keywords":"12190,33490,886,4470,173919,345148,10453,180250,11454,437,1003,6025,898,897,4562,1416,361038,5540,246,10551,195729,257714,236458,210730,291,5565,818,156764,578,6029,12396"}},
{"id":"other-arts-series","name":"Everything else (Music, art & showbiz) (series)","type":"series","family":"arts","catchall":true,"params":{"sort_by":"vote_count.desc","with_keywords":"14893|2679|4048|283297|1691|285695","without_keywords":"33490,886,10453,180250,11454,437,1003,6025,898,897,4562,246,195729,257714,818,578,12396"}},
{"id":"other-sports","name":"Everything else (Sports, games & martial arts)","type":"movie","family":"sports","catchall":true,"params":{"sort_by":"vote_count.desc","with_keywords":"6075|333328|386163","without_keywords":"160177,159212,779,395,585,383,316,209476,1480,5349,1524,390,8624,201008,241666,3522,780,190166,11282,276964,5526,420,156191,168929,171459,10671,188086,10825,734,362510,1019,158370,262385,245203,10110,11146,195012,235329,191217,231036,206334,11672,204402,159960,222165,268859,378849,193761,194988,325084,371344,192789,166939,386812,994,345732,155720,319933,236692,228060,358437,11035,161320"}},
{"id":"other-sports-series","name":"Everything else (Sports, games & martial arts) (series)","type":"series","family":"sports","catchall":true,"params":{"sort_by":"vote_count.desc","with_keywords":"6075|333328|386163","without_keywords":"160177,159212,779,395,585,383,209476,1480,5349,1524,190166,11282,276964,5526,420,156191,168929,171459,10671,188086,10825,734,362510,1019,158370,262385,245203,10110,11146,195012,235329,191217,231036,206334,11672,204402,159960,222165,268859,378849,193761,194988,325084,371344,192789,166939,386812,994,345732,155720,319933,236692,228060,358437,11035,161320"}},
{"id":"other-growing","name":"Everything else (Family, growing up & getting old)","type":"movie","family":"growing","catchall":true,"params":{"sort_by":"vote_count.desc","with_keywords":"10683|10235|296608|206298","without_keywords":"6271,3616,13160,6270,1599,4995,298930,172971,9872,9957,1803,7464,375255,240485,241738,240119,240315,5248,158718,258533,264386,11001,6150,10093,2356,1900"}},
{"id":"other-growing-series","name":"Everything else (Family, growing up & getting old) (series)","type":"series","family":"growing","catchall":true,"params":{"sort_by":"vote_count.desc","with_keywords":"10683|10235|296608|206298","without_keywords":"193171,18035,6271,3616,13160,1599,9872,9957,1803,7464,375255,240485,241738,240119,240315,5248,158718,258533,264386,11001,6150,10093,2356,1900"}},
{"id":"other-life","name":"Unsorted (none of the above)","type":"movie","family":"life","catchall":true,"params":{"sort_by":"vote_count.desc","with_genres":"18","vote_count.gte":50,"without_keywords":"162766,159028,2412,184392,5498,6563,220204,5334,11860,9714,2095,41645,265589,10090"}},
{"id":"other-life-series","name":"Unsorted (none of the above)","type":"series","family":"life","catchall":true,"params":{"sort_by":"vote_count.desc","with_genres":"18","vote_count.gte":20,"without_keywords":"11612,13005,11162,162766,159028,2412,11860,9714,2095,41645,265589,10090"}},
];
// "New French Extremity" was in twice: keep one, with both sets of picks
{
  const a = MICROGENRES.findIndex(m => m.id === "new-french-extremity"), b = MICROGENRES.find(m => m.id === "french-extremity");
  if (a >= 0 && b) {
    const extra = (MG_ITEMS["new-french-extremity"] || []).filter(([id]) => !(MG_ITEMS["french-extremity"] || []).some(x => x[0] === id));
    MG_ITEMS["french-extremity"] = [...(MG_ITEMS["french-extremity"] || []), ...extra];
    b.name = "New French Extremity";
    MICROGENRES.splice(a, 1);
  }
}

// futures: one list (futures.js) with the year each title is set in, split by today's date when asked
const nf = n => n >= 10000 ? n.toLocaleString("en-US") : String(n);
for (const [t, sfx] of [["movie", ""], ["series", " (series)"]]) {
  const have = new Set(FUTURES[t].map(x => x[0]));
  const all = [...FUTURES[t], ...(FUTURES_MORE[t] || []).filter(x => !have.has(x[0]))].map(([id, name, year, set]) => ({ id, name: `${name} · set in ${nf(set)}`, year, set }));
  MICROGENRES.push(
    { id: `all-futures${t === "series" ? "-series" : ""}`, name: `All: every future, in the order of the year it's set in${sfx}`, type: t, family: "futures", future: "all", allof: true, items: all },
    { id: `futures-came${t === "series" ? "-series" : ""}`, name: `Futures that already came: set in a year now past${sfx}`, type: t, family: "futures", future: "past", items: all },
    { id: `futures-ahead${t === "series" ? "-series" : ""}`, name: `Futures still to come: set in a year not reached yet${sfx}`, type: t, family: "futures", future: "ahead", items: all });
}
// From Wikipedia's lists of films (wikimg.js): the list's titles first, then TMDB's keyword matches where there are any
for (const w of WIKI_MICROGENRES)
  MICROGENRES.push({ ...w, items: w.items.map(([id, name, year]) => ({ id, name, year })), ...(w.family === "extreme" ? { family: undefined } : {}) });

// Racism, prejudice & propaganda (prejudice.js): its own family, with an "Everything else" for the rest
{
  const own = { movie: [], series: [] };
  for (const [id, name0, kw, series] of PREJUDICE_MG)
    for (const t of series ? ["movie", "series"] : ["movie"]) {
      const sfx = t === "series" ? " (series)" : "";
      const name = MICROGENRES.some(m => m.type === t && m.name === name0 + sfx) ? `${name0} (prejudice)${sfx}` : name0 + sfx;
      const picks = t === "movie" ? (PREJUDICE_PICKS[id] || []).map(([i, n, y]) => ({ id: i, name: n, year: y })) : [];
      MICROGENRES.push({ id: `pj-${id}${t === "series" ? "-series" : ""}`, name, type: t, family: "prejudice",
        params: { sort_by: "vote_count.desc", with_keywords: kw, without_genres: "16,10751" }, ...(picks.length ? { items: picks } : {}) });
      own[t].push(...kw.split("|"));
    }
  for (const t of ["movie", "series"])
    MICROGENRES.push({ id: `other-prejudice${t === "series" ? "-series" : ""}`, name: `Everything else (Racism, prejudice & propaganda)${t === "series" ? " (series)" : ""}`,
      type: t, family: "prejudice", catchall: true,
      params: { sort_by: "vote_count.desc", with_keywords: PREJUDICE_BASE, without_keywords: [...new Set(own[t])].join(",") } });
}

// China (its own family), a row per national cinema (World cinema) and "moving paintings" (Moods): regions.js
for (const r of REGION_MG) {
  const family = r.id.startsWith("cn-") || r.id.startsWith("other-china") ? "china" : r.id.startsWith("nc-") ? "world" : "mood";
  const params = Object.keys(r.params || {}).length ? { sort_by: "vote_count.desc", "vote_count.gte": 3, ...r.params } : null;
  MICROGENRES.push({ id: r.id, name: r.name, type: r.type, family, ...(params ? { params } : {}), ...(r.id.startsWith("other-") ? { catchall: true } : {}),
    items: r.items.map(([id, name, year]) => ({ id, name, year })) });
}

// each war's rows in the War family get every side's hand-picked films (so War + Country: Russia finds the Russian side)
for (const [war, sides] of Object.entries(SIDE_PICKS)) {
  const m = MICROGENRES.find(x => x.id === `war-${war}` && x.type === "movie") || MICROGENRES.find(x => x.id === war);
  if (!m) continue;
  const have = new Set((m.items || []).map(i => i.id));
  m.items = [...(m.items || []), ...Object.values(sides).flatMap(x => x.items).filter(([id]) => !have.has(id) && have.add(id)).map(([id, name, year]) => ({ id, name, year }))];
}

// Studios, TV channels, collections & canons, famous people's favourites, India, Anime, and new rows in
// Animation, Docs, Music & Everything else (families2.js): hand-picked titles first, then TMDB's matches
const TODAY_ = "today";
for (const r of FAM2_MG) {
  const items = r.items.map(([id, name, year]) => ({ id, name, year }));
  if (r.family === "data") continue;            // lists other rows draw on (e.g. historic box-office bombs for Eras)
  if (r.family === "extra") {                    // more hand-picks for a row that already exists
    const m = MICROGENRES.find(x => x.id === r.id);
    if (m) { const have = new Set((m.items || []).map(i => i.id)); m.items = [...(m.items || []), ...items.filter(i => !have.has(i.id) && have.add(i.id))]; }
    continue;
  }
  const fam = r.family;
  // a studio's or channel's whole catalogue: best-known first (by popularity, this week's shorts and specials came first)
  if ((fam === "studios" || fam === "channels") && r.params && (!r.params.sort_by || r.params.sort_by === "popularity.desc")) r.params = { ...r.params, sort_by: "vote_count.desc" };
  const params = Object.keys(r.params || {}).length ? { sort_by: "popularity.desc", ...r.params,
    ...(/^other-(awards|collections)/.test(r.id) ? { [r.type === "series" ? "first_air_date.lte" : "primary_release_date.lte"]: TODAY_ } : {}) } : null;
  const clash = MICROGENRES.some(x => x.type === r.type && x.name === r.name);
  MICROGENRES.push({ id: r.id, name: clash ? `${r.name} (${fam === "channels" ? "channel" : fam === "studios" ? "studio" : fam})` : r.name, type: r.type, family: fam, ...(params ? { params } : {}),
    ...(r.id.startsWith("other-") ? { catchall: true } : {}), ...(r.allof ? { allof: true } : {}), ...(items.length ? { items } : {}) });
}
MICROGENRES.push(
  { id: "other-india", name: "Everything else (India & South Asia)", type: "movie", family: "india", catchall: true,
    params: { sort_by: "vote_count.desc", "vote_count.gte": 5, with_origin_country: "IN|PK|BD|LK|NP" } },
  { id: "other-india-series", name: "Everything else (India & South Asia) (series)", type: "series", family: "india", catchall: true,
    params: { sort_by: "vote_count.desc", with_origin_country: "IN|PK|BD|LK|NP" } },
  { id: "other-anime", name: "Everything else (Anime)", type: "movie", family: "anime", catchall: true, params: { sort_by: "vote_count.desc", with_keywords: "210024" } },
  { id: "other-anime-series", name: "Everything else (Anime) (series)", type: "series", family: "anime", catchall: true, params: { sort_by: "vote_count.desc", with_keywords: "210024" } });

// "today" is filled in when a row is loaded (catalogs.js): rows sorted by votes or box office would otherwise be
// topped by hyped films that aren't out yet. (A date worked out here would be 1970: Workers start with the clock at zero.)
const TODAY = "today";
// Eras: what each decade loved (its box-office hits, by TMDB's figures) and what it hated (its box-office bombs, from
// Wikipedia's list of the biggest), plus its best-known TV
{
  const bombs = [...((FAM2_MG.find(r => r.id === "data-bombs") || {}).items || []), ...(WORST["box-office-bombs"] || [])];
  for (let d = 1920; d <= 2020; d += 10) {
    const span = { gte: `${d}-01-01`, lte: `${d + 9}-12-31` }, dec = `${d}s`;
    MICROGENRES.push(
      { id: `era-hits-${dec}`, name: `${dec} box-office hits`, type: "movie", family: "eras",
        params: { sort_by: "revenue.desc", "vote_count.gte": d < 1950 ? 30 : 100, "primary_release_date.gte": span.gte, "primary_release_date.lte": span.lte } });
    const seen = new Set();
    const items = bombs.filter(([id, , y]) => +String(y).slice(0, 4) >= d && +String(y).slice(0, 4) <= d + 9 && !seen.has(id) && seen.add(id))
      .map(([id, name, year]) => ({ id, name, year: String(year) }));
    if (items.length >= 2) MICROGENRES.push({ id: `era-bombs-${dec}`, name: `${dec} box-office bombs`, type: "movie", family: "eras", items });
    if (d >= 1940) MICROGENRES.push({ id: `era-tv-${dec}`, name: `Best-known series that began in the ${dec}`, type: "series", family: "eras",
      params: { sort_by: "vote_count.desc", "first_air_date.gte": span.gte, "first_air_date.lte": span.lte } });
    // what each decade rated highest and lowest (TMDB's users), for films and series alike; enough votes to count
    const old = d < 1960, tvSpan = { "first_air_date.gte": span.gte, "first_air_date.lte": span.lte, without_genres: "10767,10763" };
    MICROGENRES.push(
      { id: `era-loved-${dec}`, name: `Best-rated films of the ${dec}`, type: "movie", family: "eras",
        params: { sort_by: "vote_average.desc", "vote_count.gte": old ? 150 : 1000, "primary_release_date.gte": span.gte, "primary_release_date.lte": span.lte } },
      { id: `era-hated-${dec}`, name: `Worst-rated films of the ${dec}`, type: "movie", family: "eras",
        params: { sort_by: "vote_average.asc", "vote_count.gte": old ? 40 : 300, "primary_release_date.gte": span.gte, "primary_release_date.lte": span.lte } });
    if (d >= 1950) MICROGENRES.push(
      { id: `era-tv-loved-${dec}`, name: `Best-rated series that began in the ${dec}`, type: "series", family: "eras",
        params: { sort_by: "vote_average.desc", "vote_count.gte": old ? 20 : d < 1990 ? 80 : 300, ...tvSpan } },
      { id: `era-tv-hated-${dec}`, name: `Worst-rated series that began in the ${dec}`, type: "series", family: "eras",
        params: { sort_by: "vote_average.asc", "vote_count.gte": old ? 8 : d < 1990 ? 25 : 80, ...tvSpan } });
  }
  MICROGENRES.push(
    { id: "all-eras", name: "All: the biggest hits of every decade", type: "movie", family: "eras", allof: true,
      params: { sort_by: "revenue.desc", "vote_count.gte": 200, "primary_release_date.lte": TODAY } },
    { id: "all-eras-series", name: "All: the best-known series of every decade", type: "series", family: "eras", allof: true,
      params: { sort_by: "vote_count.desc" } },
    { id: "other-eras", name: "Everything else: before 1920", type: "movie", family: "eras", catchall: true,
      params: { sort_by: "vote_count.desc", "primary_release_date.lte": "1919-12-31" } },
    { id: "other-eras-series", name: "Everything else: television before 1940", type: "series", family: "eras", catchall: true,
      params: { sort_by: "vote_count.desc", "first_air_date.lte": "1939-12-31" } });
}

// Normal genres: plain genres and combinations, their own family
for (const [t, list] of [["movie", NORMAL_MOVIE], ["series", NORMAL_SERIES]])
  for (const [name0, params] of list) {
    const name = MICROGENRES.some(m => m.type === t && m.name === name0) ? `${name0} (genre)` : name0;   // names stay unique per type
    MICROGENRES.push({ id: `normal-${t === "series" ? "tv-" : ""}${name0.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, name, type: t, family: "normal",
      params: { sort_by: "popularity.desc", "vote_count.gte": 10, ...params } });
  }

// Normal genres' garbage taxon: titles TMDB gave no genre at all
MICROGENRES.push(
  { id: "other-normal", name: "Everything else (no genre at all)", type: "movie", family: "normal", catchall: true,
    params: { sort_by: "vote_count.desc", "vote_count.gte": 5, without_genres: "28,12,16,35,80,99,18,10751,14,36,27,10402,9648,10749,878,10770,53,10752,37" } },
  { id: "other-normal-series", name: "Everything else (no genre at all) (series)", type: "series", family: "normal", catchall: true,
    params: { sort_by: "vote_count.desc", "vote_count.gte": 3, without_genres: "10759,16,35,80,99,18,10751,10762,9648,10763,10764,10765,10766,10767,10768,37" } });

// Transgressive & extreme: its own family (these also stay in their first family)
export const EXTREME = new Set(["transgressive", "french-extremity", "video-nasties", "rape-revenge", "mondo", "gore", "nihilist", "cannibals",
  "nunsploitation", "hk-category-iii", "nc-17", "torture-horror", "banned-films", "snuff", "shock-provocation", "transgressive-series", "gore-series"]);
const XK = "361070|4426|344603|201028|310003|3880";   // disturbing, sadism, splatter, depravity, banned film, snuff
MICROGENRES.push(
  { id: "torture-horror", name: "Torture horror", type: "movie", params: { sort_by: "popularity.desc", with_keywords: "13006", with_genres: "27" } },
  { id: "banned-films", name: "Banned and censored films", type: "movie", params: { sort_by: "popularity.desc", with_keywords: "310003|179428" } },
  { id: "snuff", name: "Snuff and fake-snuff", type: "movie", params: { sort_by: "popularity.desc", with_keywords: "3880" } },
  { id: "shock-provocation", name: "Shock, taboo and provocation", type: "movie", params: { sort_by: "popularity.desc", with_keywords: "193697|293649|15027|201028" } },
  { id: "other-extreme", name: "Everything else (Transgressive & extreme)", type: "movie", family: "extreme", catchall: true, params: { sort_by: "vote_count.desc", with_keywords: XK } },
  { id: "other-extreme-series", name: "Everything else (Transgressive & extreme) (series)", type: "series", family: "extreme", catchall: true, params: { sort_by: "vote_count.desc", with_keywords: XK } },
);

// Transgressive & extreme: hand-picked titles (badfilms.js), added to the existing rows or as new ones
for (const x of EXTREME_PICKS) {
  const items = x.items.map(([id, name, year]) => ({ id, name, year }));
  const m = MICROGENRES.find(y => y.id === x.id);
  if (m) { const have = new Set((m.items || []).map(i => i.id)); m.items = [...items.filter(i => !have.has(i.id)), ...(m.items || [])]; }
  else { MICROGENRES.push({ id: x.id, name: x.name, type: "movie", family: "extreme", items }); EXTREME.add(x.id); }
}

// Razzies & the worst ever made: every Worst Picture year (winner first), the worst-film lists, box-office bombs
{
  const yr = RAZZIES.slice().sort((a, b) => a.year - b.year);
  const item = ([id, name, year, win]) => ({ id, name: win ? `${name} · Worst Picture` : name, year });
  MICROGENRES.push({ id: "all-razzies", name: "All: every Worst Picture winner", type: "movie", family: "razzies", allof: true,
    items: yr.flatMap(r => r.items.filter(i => i[3]).map(item)) });
  for (const r of yr) MICROGENRES.push({ id: `razzies-${r.year}`, name: `Razzies ${r.year} (${r.ord})`, type: "movie", family: "razzies", items: r.items.map(item) });
  const L = { "worst-20th": "Considered the worst: 20th century", "worst-21st": "Considered the worst: 21st century", "box-office-bombs": "Biggest box-office bombs" };
  for (const [id, name] of Object.entries(L)) MICROGENRES.push({ id, name, type: "movie", family: "razzies", items: WORST[id].map(([i, n, y]) => ({ id: i, name: n, year: y })) });
  const rt = MICROGENRES.find(m => m.id === "rt-zero"); if (rt) rt.family = "razzies";
  MICROGENRES.push({ id: "other-razzies", name: "Everything else: so bad it's good", type: "movie", family: "razzies", catchall: true,
    params: { sort_by: "vote_count.desc", with_keywords: "11034|374649", "vote_average.lte": 4.6, "vote_count.gte": 80 } });
}

/** A futures microgenre's titles as of today (past: by the year they predicted; ahead: nearest first). */
export function futureItems(m) {
  const now = new Date().getUTCFullYear();
  return m.items.filter(x => m.future === "all" ? true : m.future === "past" ? x.set <= now : x.set > now).sort((a, b) => a.set - b.set);
}

// the hand-picked titles (mgitems.js) go first in each microgenre's row
for (const m of MICROGENRES) {
  const add = MG_ITEMS[m.id];
  if (!add) continue;
  const have = new Set((m.items || []).map(x => x.id));
  m.items = [...(m.items || []), ...add.filter(([id]) => !have.has(id)).map(([id, name, year]) => ({ id, name, year }))];
}

export const MG_BY_ID = Object.fromEntries(MICROGENRES.map(m => [m.id, m]));
function MG_ID(id) { return MG_BY_ID[id]; }

// ── which microgenres a title belongs to ────────────────────────────────────
// info: { imdb, kw: Set<keyword id>, genres: Set<genre id>, lang, year, countries: Set }
// Mirrors the TMDB /discover rules each microgenre uses: "," = all of, "|" = any of.
const groups = v => String(v).split(",").map(g => g.split("|").map(x => x.trim()).filter(Boolean));
const allOf = (v, have) => groups(v).every(g => g.some(x => have.has(isNaN(+x) ? x : +x)));
export function matchMicrogenres(type, info) {
  const out = [];
  for (const m of MICROGENRES) {
    if (m.type !== type || m.allof || m.family === "normal") continue;   // plain genres are for browsing, not title pages
    if (m.items && (m.future ? futureItems(m) : m.items).some(x => x.id === info.imdb)) { out.push(m); continue; }
    if (!m.params) continue;
    const p = m.params;
    if (!p.with_keywords && !p.with_genres && !p.with_original_language && !p.with_origin_country) continue;
    if (p.with_companies || p.with_networks || p.without_companies) continue;     // studio / channel rows: their hand-picks only
    if (p.with_keywords && !allOf(p.with_keywords, info.kw)) continue;
    if (p.without_keywords && String(p.without_keywords).split(/[,|]/).some(x => info.kw.has(+x))) continue;
    if (p.with_genres && !allOf(p.with_genres, info.genres)) continue;
    if (p.without_genres && String(p.without_genres).split(/[,|]/).some(x => info.genres.has(+x))) continue;
    if (p.with_original_language && !String(p.with_original_language).split("|").includes(info.lang)) continue;
    if (p.with_origin_country && !String(p.with_origin_country).split("|").some(c => info.countries.has(c))) continue;
    const gte = p["primary_release_date.gte"] || p["first_air_date.gte"], lte = p["primary_release_date.lte"] || p["first_air_date.lte"];
    if ((gte || lte) && !info.year) continue;
    if (gte && info.year < +gte.slice(0, 4)) continue;
    if (lte && info.year > +lte.slice(0, 4)) continue;
    out.push(m);
  }
  // "Everything else" is for titles no microgenre takes: a title filed anywhere specific gets none of them;
  // an unfiled one gets its families' catch-alls, and "Unsorted" only when no family's catch-all fits either
  const specific = out.some(m => !m.catchall);
  const famCatch = out.some(m => m.catchall && !["mood", "life"].includes(m.family));
  for (let i = out.length - 1; i >= 0; i--) {
    const m = out[i];
    if (!m.catchall) continue;
    if (specific || (famCatch && ["mood", "life"].includes(m.family)) || (m.family === "mood" && out.some(x => x.family === "life"))) out.splice(i, 1);
  }
  // keyword- and list-based ones first: they're the specific ones
  return out.sort((a, b) => (b.items || (b.params || {}).with_keywords ? 1 : 0) - (a.items || (a.params || {}).with_keywords ? 1 : 0));
}
// stored as "m533|id|id|": the prefix changes whenever the microgenre list does, so titles sorted
// against an older list get sorted again
export const MG_TAG = "m" + MICROGENRES.length + "g";   // change the letter whenever the matching rules change
export const mgString = ms => MG_TAG + "|" + ms.map(m => m.id).join("|") + (ms.length ? "|" : "");
export const mgCurrent = mg => typeof mg === "string" && mg.startsWith(MG_TAG + "|");

// ── microgenre families: the first level of the Discover tree ───────────────
// Discover: 🍄 Horror (catalog) → Microgenre (dropdown) → Genre / Year / Sort by
export const FAMILIES = [
  // TV channels and the services' own shows (served next to 📺 Streaming services)
  ["channels", "TV channels & originals"],
  // the basics and the canon, with the worst next to the eras
  ["normal", "Normal genres"], ["collections", "Collections & canons"], ["awards", "Festivals & awards"], ["favourites", "Famous people's picks"],
  ["studios", "Studios"], ["eras", "Eras by decade"], ["razzies", "Razzies & the worst"],
  // genres and moods
  ["horror", "Horror"], ["scifi", "Sci-fi & fantasy"], ["futures", "Futures"], ["crime", "Crime & thrillers"],
  ["comedy", "Comedy & satire"], ["romance", "Love & relationships"], ["mood", "Moods, endings & form"], ["vibes", "Vibes & types"],
  ["cult", "Cult, camp & exploitation"], ["extreme", "Transgressive & extreme"], ["apocalypse", "Apocalypse & collapse"],
  // where it's from, who it's about, and what kind of thing it is
  ["world", "World cinema"], ["pubtv", "Public TV worldwide"], ["china", "China, HK & Taiwan"], ["india", "India & South Asia"], ["prejudice", "Racism & propaganda"],
  ["places", "Places & settings"], ["animation", "Animation"], ["anime", "Anime"], ["docs", "Documentaries"], ["shorts", "Shorts (and longs)"], ["versions", "Versions, cuts & remakes"],
  // subjects, then everything else
  ["nature", "Nature & creatures"], ["arts", "Music, art & showbiz"], ["sports", "Sports & games"], ["growing", "Family & growing up"],
  ["life", "Everything else"],
  // wars last, next to ⚔ Wars from every side
  ["war", "War, history & westerns"],
];
// the families come in five lumps; each lump is its own add-on in Stremio (so Discover's list keeps them together),
// in this order: the basics, genres, where it's from, subjects and everything else, then war
export const FAMILY_GROUPS = [
  ["The basics & the canon", ["normal", "collections", "awards", "favourites", "studios", "eras", "razzies"]],
  ["Genres & moods", ["horror", "scifi", "futures", "apocalypse", "crime", "comedy", "romance", "mood", "vibes", "cult", "extreme"]],
  ["Where it's from & what it is", ["world", "pubtv", "china", "india", "prejudice", "places", "animation", "anime", "docs", "shorts", "versions"]],
  ["Subjects & everything else", ["nature", "arts", "sports", "growing", "life"]],
  ["War, history & westerns", ["war"]],
];
// a row's TMDB genre counts for its family when every title must have it ("27" or "27,53"); in an either-or list
// ("878|99|18": sci-fi or documentary or drama) only the first one does, so a Moon row isn't filed under Documentaries
const G = (m, ...ids) => { const g = String((m.params || {}).with_genres || ""); return (g.includes("|") ? [g.split("|")[0]] : g.split(",")).some(x => ids.includes(+x)); };
const RULES = {
  cult: m => /pre-code|nunsploit|exploit|grindhouse|psychotronic|nasties|camp classics|campy|b-movie|cult classic|softcore|erotic|mondo|midnight|low-budget|transgress|extremity|so bad/i.test(m.name),
  animation: m => G(m, 16) || /\banimat|anime\b|claymation|stop-motion|cutout|manga|anime|cgi|cartoon|mecha|isekai/i.test(m.name),
  docs: m => G(m, 99) || /documentar|docuseries|\bdocs\b|cooking shows|travel shows|wildlife|olympic|concert films/i.test(m.name),
  horror: m => G(m, 27) || /horror|slasher|zombie|vampire|ghost|haunt|demon|witch|gore|creature|monster|possession|curse|cannibal|werewolf|doll|exorcis|occult|satan|giallo|bigfoot|cryptid|devil|graveyard|lovecraft|masked killer|terror|supernatural|ghoul|halloween|voodoo|home invasion/i.test(m.name),
  mood: m => /nonlinear|real time|art house|faux|psychedel|melanchol|whimsical|philosoph|nihil|ending|bottle|surreal|dreamlike|slow-burn|macabre|hallucinat|madness|twist|dreams|\bstage\b|plays|one room|experimental|point-of-view|twins|semi-autobio|one night|anthology|black-and-white|silent|real time/i.test(m.name),
  war: m => G(m, 10752, 10768, 36, 37) || /\bwars?\b|world war|napoleonic|samurai|ninja|medieval|ancient|victorian|period|jidaigeki|peplum|western|histor|revolution|cold war|vietnam|troubles|genocide|partition|1940s|wwii|pirate|swashbuckl|submarine/i.test(m.name),
  scifi: m => G(m, 878, 14, 10765) || /sci-fi|space|alien|robot|time travel|time loop|time-travel|dystop|cyber|virtual|parallel|apocalyp|pandemic|mutant|moon|astronaut|hacker|surveillance|superhero|fantasy|sorcery|tokusatsu|kaiju|artificial|body swap|memory|contact|end of the world|after the end|clone|cyborg|genetic|shapeshift|invisib|utopia|nuclear|climate/i.test(m.name),
  crime: m => G(m, 53, 80, 9648) || /crime|heist|mafia|\bmob\b|cartel|prison|detective|noir|spy|spies|hitm|assassin|cops?\b|con artist|serial killer|vigilante|courtroom|legal|kidnap|hostage|gangster|yakuza|thriller|myster|private eye|police|femme fatale|outlaw|whodunit|robber|journalist/i.test(m.name),
  comedy: m => G(m, 35) || /comed|sitcom|spoof|parod|satir|absurd|slapstick|stoner|sketch|mockumentar/i.test(m.name),
  romance: m => G(m, 10749) || /romance|\blove\b|wedding|relationship|forbidden|triangle|marriage/i.test(m.name),
  world: m => !!((m.params || {}).with_origin_country || (m.params || {}).with_original_language) || /korean|japanese|french|italian|nordic|british|bollywood|spanish|german|turkish|australian|hong kong|soviet|iranian|indian|mexican|brazil|canadian|canuck/i.test(m.name),
  nature: m => /insect|swamp|bayou|wetland|mushroom|fung|spore|shark|dinosaur|whale|dolphin|river|wild|animal|bird|natural disaster|ocean/i.test(m.name),
  arts: m => /punk|hip-hop|jazz|metal|dance|ballet|painter|(?<!con )artist|photograph|musician|rock|magician|circus|making movies|making series|hollywood|literary|music|band|concert|theater|theatre/i.test(m.name),
  sports: m => /boxing|baseball|surf|skate|chess|climb|martial|kung fu|gambl|casino|sport/i.test(m.name),
  growing: m => /school|coming of age|midlife|growing old|grief|loneli|addiction|sibling|fathers|mothers|friendship|queer|faith|leaving home|teen|college|family/i.test(m.name),
  places: m => !/^art house$/i.test(m.name) && /\b(new york|paris|tokyo|texas|las vegas|new orleans|los angeles|london|islands?|jungles?|forests?|deserts?|snowbound|farms?|trains?|road|small-town|hotels?|castles?|houses?|stations?|beach(es)?|ocean|sea|mountains?|city|cities|suburbs?)\b/i.test(m.name),
};
// a microgenre can sit in two families (Italian giallo: Horror and World cinema; Horror comedies: Horror and
// Comedy), so it's found wherever you'd look for it; its first family is where title-page links point
const FAMILIES_CACHE = new Map();
// which family a row falls in is worked out in this order (not the display order above), so reordering the list never moves a row
const RULE_ORDER = ["normal", "collections", "awards", "favourites", "eras", "world", "china", "india", "prejudice", "war", "places",
  "animation", "anime", "docs", "studios", "channels", "horror", "scifi", "futures", "crime", "comedy", "romance", "mood", "cult", "extreme",
  "razzies", "nature", "arts", "sports", "growing", "life", "apocalypse", "shorts", "versions", "vibes", "pubtv"];
export function familiesOf(m) {
  if (FAMILIES_CACHE.has(m.id)) return FAMILIES_CACHE.get(m.id);
  if (m.family) { const f = [m.family, ...(m.also || [])]; FAMILIES_CACHE.set(m.id, f); return f; }
  const all = RULE_ORDER.filter(k => RULES[k] && RULES[k](m));
  if (EXTREME.has(m.id)) all.unshift("extreme");
  const out = all.length ? [...new Set(all)].slice(0, 2) : ["life"];
  FAMILIES_CACHE.set(m.id, out);
  return out;
}
const FAMILY_CACHE = new Map();
export function familyOf(m) {
  if (m.family) return m.family;
  if (EXTREME.has(m.id)) return "extreme";
  if (FAMILY_CACHE.has(m.id)) return FAMILY_CACHE.get(m.id);
  const f = RULE_ORDER.find(k => RULES[k] && RULES[k](m)) || "life";
  FAMILY_CACHE.set(m.id, f);
  return f;
}

// World cinema's "Everything else": films in any language none of the world microgenres covers (not English);
// "Unsorted": dramas no family genre and no microgenre keyword reaches
{
  const LANGS = "ja ko zh cn fr de it es pt ru sv da no fi is nl pl cs sk hu ro bg sr hr bs sl mk sq el tr ar fa he hi ta te ml kn bn mr pa ur gu th vi id ms tl km lo my ka hy az kk uz ky mn uk be lt lv et ga cy eu ca gl af zu xh sw am yo ig ha so ne si bo ps ku wo ln rw mi sm".split(" ");
  const NOT_DRAMA = { movie: "27,878,80,35,10749,10752,36,37,16,99,10402,14,53,9648", series: "80,35,16,99,9648,10765,10768,37,10762,10764,10767,10766,10763" };
  for (const t of ["movie", "series"]) {
    const own = MICROGENRES.filter(m => m.type === t && !m.catchall);
    const used = new Set(["en"]);
    // a whole national cinema already has its row: leave out its language (not French or Spanish, whose rows are one era or one country)
    const LANG_OF = { IR: "fa", TR: "tr", TH: "th", PL: "pl", BR: "pt", HK: "cn", IN: "hi", NG: "yo" };
    for (const m of own) if (familiesOf(m).includes("world") && m.params) {
      String(m.params.with_original_language || "").split("|").filter(Boolean).forEach(l => used.add(l));
      const dated = Object.keys(m.params).some(k => k.includes("date"));
      if (!dated) String(m.params.with_origin_country || "").split("|").forEach(c => LANG_OF[c] && used.add(LANG_OF[c]));
    }
    const w = MG_ID(t === "series" ? "other-world-series" : "other-world");
    if (w) { delete w.params.with_origin_country; w.params.with_original_language = LANGS.filter(l => !used.has(l)).join("|"); }
    const kws = new Set();
    for (const m of own) for (const k of String((m.params || {}).with_keywords || "").split(/[,|]/)) if (/^\d+$/.test(k.trim())) kws.add(k.trim());
    const u = MG_ID(t === "series" ? "other-life-series" : "other-life");
    if (u) Object.assign(u.params, { with_genres: "18", without_genres: NOT_DRAMA[t], without_keywords: [...kws].join(",") });
  }
}

// the Moon: every film set there or about it lives in Places & settings; Documentaries keeps only the documentaries
MICROGENRES.push(
  { id: "moon-docs", name: "Moon documentaries", type: "movie", family: "docs", params: { sort_by: "popularity.desc", with_keywords: "305", with_genres: "99" } },
  { id: "moon-docs-series", name: "Moon documentaries", type: "series", family: "docs", params: { sort_by: "popularity.desc", with_keywords: "305", with_genres: "99" } });
for (const m of MICROGENRES.slice(-2)) MG_BY_ID[m.id] = m;

// rows that now live in the India and Anime families (they were in World cinema and Animation)
{
  const MOVE = { places: ["the-moon", "the-moon-series"], mood: ["art-house", "faux-docs", "real-time", "nonlinear", "psychedelic"],
                 crime: ["con-artists", "con-artists-series"], cult: ["grindhouse"], war: ["harrowing-war"], growing: ["immigrants", "immigrants-series"], india: ["bollywood", "tamil", "nc-malayalam", "nc-telugu", "nc-bengali", "nc-marathi-kannada", "nc-india-series"],
                 anime: ["anime-films", "tv-anime", "tv-mecha", "tv-isekai", "tv-slice-of-life", "manga-films", "manga-series"] };
  for (const [fam, ids] of Object.entries(MOVE)) for (const id of ids) for (const m of MICROGENRES) if (m.id === id) m.family = fam;
  for (const m of MICROGENRES) if (m.id === "the-moon" || m.id === "the-moon-series") m.also = ["scifi"];      // listed in both
  // queries that let the wrong titles in: climate collapse is fiction (nature documentaries also carry "climate change"),
  // and shōnen battle series need TMDB's shōnen keyword, not just "anime" plus action
  const FIX = { climate: { without_genres: "16,99" }, "climate-series": { without_genres: "16,99" },
                "an-shonen": { with_keywords: "207826", with_genres: "16,10759" } };
  for (const m of MICROGENRES) if (FIX[m.id] && m.params) Object.assign(m.params, FIX[m.id]);
  FAMILIES_CACHE.clear(); FAMILY_CACHE.clear();
}

// studios in both types: Rankin/Bass's films next to its series, Toei's series next to its films
for (const [id, type, name, co] of STUDIO_TWINS) {
  if (MG_BY_ID[id] || MICROGENRES.some(x => x.type === type && (x.params || {}).with_companies === co)) continue;   // a channel's films row has it already
  const m = { id, name, type, family: "studios", params: { with_companies: co, sort_by: "vote_count.desc", ...(type === "series" ? { without_genres: "10767,10763" } : {}) } };
  MICROGENRES.push(m); MG_BY_ID[id] = m;
}
// new rows (newrows.js) and the Apocalypse family: the old end-of-the-world rows move in with them
for (const r of [...NEW_ROWS, ...CURATED, ...CURATED2, ...CURATED3, ...CURATED4].filter(r => r.id !== "ar-youtubers-made")) {   // films made by YouTubers come as hits and misses
  if (MG_BY_ID[r.id]) continue;
  const m = { ...r, ...(r.items ? { items: r.items.map(x => ({ ...x })) } : {}) };
  MICROGENRES.push(m); MG_BY_ID[m.id] = m;
}
{
  const MOVE = { pandemics: "Cause: pandemic", "alien-invasion": "Cause: invasion", climate: "Cause: climate", "post-apocalypse": "After the end",
    disasters: "Cause: nature" };
  for (const [id, short] of Object.entries(MOVE)) for (const m of [MG_BY_ID[id], MG_BY_ID[id + "-series"]]) if (m) { m.family = "apocalypse"; m.also = []; m.short = short; }
  if (MG_BY_ID["sh-longs"]) MG_BY_ID["sh-longs"].short = "Longs";
  // the Adult Swim-style ones are parodies of public access; the real thing has its own row
  for (const id of ["cu-publicaccess", "cu-publicaccess-films"]) if (MG_BY_ID[id]) { MG_BY_ID[id].short = "Public access: parodies"; MG_BY_ID[id].name = "Public access parodies"; }
  // snips and snails (boys' gross-out cartoons) next to sugar and spice
  if (MG_BY_ID["co-gross-series"]) Object.assign(MG_BY_ID["co-gross-series"], { short: "Snips and snails", sortKey: "Snips and snails", name: "Snips and snails: gross-out cartoons" });              // in the Shorts family, that's the joke
  // shot-for-shot remakes sit next to one continuous take
  if (MG_BY_ID["ver-shot-for-shot"]) MG_BY_ID["ver-shot-for-shot"].also = ["life"];
  if (MG_BY_ID["odd-onetake"]) { MG_BY_ID["odd-onetake"].family = "life"; MG_BY_ID["odd-onetake"].also = ["versions"]; }
  const fc = MG_BY_ID["first-contact"];
  if (fc && fc.params) fc.params.with_keywords = "211248|160515|229652|162459";
  // keywords the "Everything else" lists were full of, added to the rows they belong in
  const addKw = (id, kws) => { const m = MG_BY_ID[id]; if (m && m.params && m.params.with_keywords) m.params.with_keywords = [...new Set([...m.params.with_keywords.split("|"), ...kws.split("|")])].join("|"); };
  // rows the size check caught pulling in far too much
  const set = (id, p, drop = []) => { const m = MG_BY_ID[id]; if (m && m.params) { Object.assign(m.params, p); for (const k of drop) delete m.params[k]; } };
  set("odd-psa", { with_keywords: "380668|271463|319579" });                                   // not every short film and all propaganda
  set("in-ray-ghatak", { with_original_language: "bn", "primary_release_date.lte": "1995-12-31", sort_by: "vote_count.desc" });
  set("mus-euro", { without_genres: "99" }); set("mus-roadshow", { without_genres: "99", "vote_count.gte": 30 });
  set("ani-sitcoms", { with_genres: "16,35" });                                              // animated AND comedy, not either
  set("odd-silent-now", { "primary_release_date.gte": "1935-01-01" });
  // titles the keyword rows missed (Cousteau sat in Everything else)
  const addItems = (id, its) => { const m = MG_BY_ID[id]; if (!m) return; const have = new Set((m.items || []).map(x => x.id)); m.items = [...(m.items || []), ...its.filter(x => !have.has(x.id))]; };
  addItems("nature-docs-series", [{ id: "tt0192937", name: "The Undersea World of Jacques Cousteau", year: "1968" }, { id: "tt0076996", name: "The Jacques Cousteau Odyssey", year: "1979" }]);
  addItems("nature-docs", [{ id: "tt0049518", name: "The Silent World", year: "1956" }, { id: "tt0058364", name: "World Without Sun", year: "1964" }, { id: "tt0158350", name: "Voyage to the Edge of the World", year: "1976" }]);
  addKw("experimental", "285787"); addKw("real-time", "173361"); addKw("movies-about-movies", "9732|6026|174109"); addKw("movies-about-movies-series", "9732|6026");
  addKw("nature-docs", "221355|324404|305903|252105"); addKw("nature-docs-series", "221355|324404|305903|252105|284176");
}
// the biggest national rows (thousands of titles each) also come split by era
{
  const ERAS = [["before 1960", null, "1959-12-31"], ["1960s–70s", "1960-01-01", "1979-12-31"], ["1980s–90s", "1980-01-01", "1999-12-31"], ["2000s on", "2000-01-01", null]];
  for (const id of ["nc-france", "nc-italy", "nc-spain", "nc-mexico", "nc-japan", "nc-korea", "nc-russia", "nc-nordic"]) {
    const b = MG_BY_ID[id]; if (!b || !b.params || b.type !== "movie") continue;
    const label = b.name.split(":")[0].trim().replace(/\s+(cinema|films)$/i, "").replace(/ and Soviet$/, "");
    ERAS.forEach(([era, gte, lte], i) => {
      const m = { id: `${id}-era${i + 1}`, name: `${label}: ${era}`, type: "movie", family: "world",
        params: { ...b.params, sort_by: "vote_count.desc", ...(gte ? { "primary_release_date.gte": gte } : {}), ...(lte ? { "primary_release_date.lte": lte } : {}) } };
      if (!MG_BY_ID[m.id]) { MICROGENRES.push(m); MG_BY_ID[m.id] = m; }
    });
  }
}
// European animation, split by country
{
  const b = MG_BY_ID["ani-euro"];
  if (b && b.params) for (const [k, label, cc, short] of [["fr", "French & Belgian", "FR|BE"], ["uk", "British & Irish", "GB|IE"], ["es", "Spanish & Portuguese", "ES|PT", "Iberian"],
      ["it", "Italian", "IT"], ["de", "German, Austrian & Swiss", "DE|AT|CH", "German-speaking"], ["nordic", "Nordic", "DK|SE|NO|FI|IS"], ["nl", "Dutch", "NL"]]) {
    const m = { id: `ani-euro-${k}`, name: `European: ${label}`, short: `Europe: ${short || label}`, type: "movie", family: "animation", params: { ...b.params, with_origin_country: cc, sort_by: "vote_count.desc" } };
    if (!MG_BY_ID[m.id]) { MICROGENRES.push(m); MG_BY_ID[m.id] = m; }
  }
}
// names that promised more than the row holds, and titles a list picked up by a title clash
{
  const RENAME = { "halloween-night": "Halloween", "halloween-night-series": "Halloween", "abandoned-unfinished": "Unfinished, shelved, finished later" };
  const DROP = { "abandoned-unfinished": ["tt0291221", "tt0072389", "tt0399471", "tt0150500", "tt1468321", "tt3124454", "tt0404978", "tt4625196",
    "tt1982137", "tt0069495", "tt0071269", "tt2103264", "tt13391710", "tt0367639", "tt4320560", "tt33335215", "tt31418394"] };
  for (const [id, n] of Object.entries(RENAME)) if (MG_BY_ID[id]) MG_BY_ID[id].name = n;
  for (const [id, ids] of Object.entries(DROP)) { const m = MG_BY_ID[id]; if (m && m.items) m.items = m.items.filter(x => !ids.includes(x.id)); }
}
// superheroes and the other comics sit side by side (superheroes first), and the other comics have no superheroes
{
  const heroes = new Set([...(MG_BY_ID["tv-sf-heroes"] || {}).items || [], ...(MG_BY_ID["ani-superhero"] || {}).items || []].map(x => x.id)
    .concat(["tt6741278", "tt1312171", "tt1878805", "tt6604188", "tt7134908"]));     // Invincible, The Umbrella Academy, Doom Patrol, Watchmen (2019), The Boys
  for (const id of ["comic-adaptations-indie", "comic-adaptations-indie-series"]) {
    const m = MG_BY_ID[id]; if (!m) continue;
    m.params = { ...m.params, without_keywords: [...new Set([...String(m.params.without_keywords || "").split(",").filter(Boolean), "9715", "155030"])].join(",") };
    if (m.items) m.items = m.items.filter(x => !heroes.has(x.id));
  }
  const sh = MG_BY_ID["normal-superhero-films"];
  if (sh) { sh.family = "scifi"; sh.also = ["normal"]; }
  for (const id of ["normal-superhero-films", "tv-sf-heroes"]) if (MG_BY_ID[id]) MG_BY_ID[id].sortKey = "Comics: !";   // just above "Comics: no superheroes"
}
// one row per idea: where Normal genres, Places or Channels repeated a family's row, that row stays and also shows there
// (an old id still finds the row it became, for Home rows picked before)
{
  const SAME = [["normal-horror-comedy", "horror-comedy"], ["normal-neo-noir", "neo-noir"], ["normal-road-movies", "road-movies"],
    ["normal-satire", "satire"], ["normal-stop-motion", "stop-motion"], ["normal-music-documentary", "music-docs"], ["pl-submarines", "submarines"],
    ["normal-kidnapping", "kidnapping"], ["normal-conspiracy", "conspiracy"], ["normal-swashbucklers", "pirates-golden"], ["normal-silent-films", "silent-era"],
    ["pl-boarding-schools", "boarding-school"], ["normal-remakes", "remakes"], ["normal-crime-documentary", "crime-docs"], ["normal-tv-spy-series", "tv-spy"],
    ["normal-tv-period-drama", "tv-period"], ["normal-tv-sketch-comedy", "tv-sketch"], ["normal-tv-miniseries", "tv-miniseries"],
    ["normal-sci-fi-horror", "sci-fi-horror"], ["normal-concert-films", "concert-films"], ["normal-tv-mockumentary", "mockumentary-series"],
    ["pl-submarines-series", "submarines-series"], ["pl-boarding-schools-series", "boarding-school-series"], ["normal-tv-crime-documentary", "crime-docs-series"],
    ["tv-sp-anime", "an-sports"], ["ch-film-bbc-film", "st-bbc-film"], ["pl-courtrooms", "normal-courtroom"], ["pl-courtrooms-series", "normal-tv-legal"],
    ["pl-hospitals-series", "normal-tv-medical"], ["ch-film-lifetime--tv-movies", "normal-made-for-tv"], ["normal-tv-western", "tv-war-westerns"], ["normal-tv-superheroes", "tv-sf-heroes"], ["li-news-series", "normal-tv-news"],
    ["li-talk-series", "normal-tv-talk-shows"], ["st-tv-lucasfilm-films", "st-lucasfilm"], ["st-lucasfilm-series", "st-tv-lucasfilm"], ["mo-experimental", "experimental"], ["odd-realtime", "real-time"], ["cu-badseries", "tv-raz-flops"]];
  for (const [drop, keep] of SAME) {
    const d = MG_BY_ID[drop], k = MG_BY_ID[keep];
    if (!d || !k || d === k || d.type !== k.type) continue;
    const fs = familiesOf(k), extra = familiesOf(d);
    k.family = fs[0]; k.also = [...new Set([...fs.slice(1), ...(k.also || []), ...extra])].filter(f => f !== k.family);
    if (d.items && k.items) { const have = new Set(k.items.map(x => x.id)); k.items = [...k.items, ...d.items.filter(x => !have.has(x.id))]; }
    k.aliases = [...(k.aliases || []), drop, ...(d.aliases || [])];          // its whole catalogue (cat_items) still counts
    MICROGENRES.splice(MICROGENRES.indexOf(d), 1); MG_BY_ID[drop] = k;
  }
  FAMILIES_CACHE.clear(); FAMILY_CACHE.clear();
}

// "All of …": the first choice in every family, the whole family to scroll through (its catch-all's base query
// without the exclusions), so you can browse a family without picking a niche first
for (const t of ["movie", "series"]) {
  for (const [fam, label] of FAMILIES) {
    const c = MICROGENRES.find(m => m.catchall && m.family === fam && m.type === t);
    if (MICROGENRES.some(m => m.id === `all-${fam}${t === "series" ? "-series" : ""}`)) continue;   // has its own "All" already
    let params;
    if (fam === "normal") params = { sort_by: "popularity.desc", "vote_count.gte": 50 };
    else if (c) { params = { ...c.params, sort_by: "popularity.desc" }; delete params.without_keywords; delete params.without_genres; }
    if (!params) continue;
    params[t === "series" ? "first_air_date.lte" : "primary_release_date.lte"] = TODAY;    // not next year's trailers
    const m = { id: `all-${fam}${t === "series" ? "-series" : ""}`, name: `All: everything in ${label}${t === "series" ? " (series)" : ""}`,
      type: t, family: fam, allof: true, params };
    MICROGENRES.push(m); MG_BY_ID[m.id] = m;
  }
}

/** How many microgenres there are (not counting the "All" rows), for the install pages. */
export const MG_COUNT = () => ({ all: MICROGENRES.filter(m => !m.allof).length, series: MICROGENRES.filter(m => !m.allof && m.type === "series").length });

// ── short names: every dropdown entry fits in 44 characters ─────────────────
// (families are worked out from the long names first, so shortening never moves a row)
export const NAME_MAX = 44;
const FAM_SHORT = { normal: "Normal genres", collections: "Collections", awards: "Awards", favourites: "Favourites", eras: "Eras",
  world: "World cinema", china: "China, HK & Taiwan", india: "India & South Asia", prejudice: "Racism & prejudice", war: "War & history",
  places: "Places", animation: "Animation", anime: "Anime", docs: "Documentaries", studios: "Studios", channels: "Channels",
  horror: "Horror", scifi: "Sci-fi & fantasy", futures: "Futures", crime: "Crime & thrillers", comedy: "Comedy", romance: "Love",
  mood: "Moods & form", cult: "Cult & camp", extreme: "Extreme", razzies: "The worst", nature: "Nature", arts: "Music & art",
  sports: "Sports & games", growing: "Growing up & old", life: "Everything else", apocalypse: "Apocalypse", shorts: "Shorts", versions: "Versions", vibes: "Vibes", pubtv: "Public TV" };
const SHORTER = {
  "ai-minds": "AI and thinking machines", "comic-adaptations-indie": "Comic adaptations, not superheroes",
  "canuxploitation": "Canuxploitation: Canadian tax-shelter films", "war-israel": "Israel, Palestine and the Arab–Israeli wars",
  "obscure-sports": "Obscure sports: curling, sumo, roller derby", "all-futures": "All: every future, by the year it's set in",
  "futures-came": "Futures that already came", "futures-ahead": "Futures still to come", "euro-westerns": "Euro-westerns: Italian, German, Spanish",
  "ww2-weird": "WWII sci-fi and horror: Nazi zombies and co.", "pj-racism-us-black": "Racism in America: slavery to Black lives",
  "pj-native-americans": "Native Americans: dispossession, depiction", "pj-partition-communal": "Partition and communal violence",
  "pj-borders": "Borders, deportation, the undocumented", "cn-sixth-generation": "The Sixth Generation and indie Chinese film",
  "cn-docs": "Chinese documentaries: Wang Bing and co.", "cn-xianxia": "Xianxia and wuxia: immortals and swordsmen",
  "cn-main-melody": "Main-melody blockbusters", "cn-tibet-minorities": "Tibet, Mongolia, Xinjiang: the borderlands",
  "nc-nordic": "Nordic cinema", "nc-andes": "Andean cinema: Chile, Peru, Bolivia & co.", "nc-southeast-asia": "Southeast Asian cinema",
  "nc-south-asia-other": "Pakistani, Sri Lankan, Nepali, Bangladeshi", "moving-paintings": "Moving paintings: gorgeous, slow, thin plot",
  "ani-adult-strange": "Adult and arthouse animation: strange ones", "ani-prestige": "Prestige animation for adults",
  "ani-modern-kids": "Modern Cartoon Network, Disney, Nick", "ani-world-series": "Bluey to Pororo: cartoons from everywhere",
  "an-auteurs": "Anime auteurs: Kon, Oshii, Hosoda & co.", "in-90s": "90s Bollywood: Shah Rukh and family weepies",
  "in-soaps": "Indian soaps, sitcoms and mythologicals", "docs-attenborough": "Attenborough & the BBC Natural History Unit", "docs-attenborough-films": "Attenborough & the BBC NHU (films)",
  "docs-bbc-landmarks": "BBC landmarks: history, art, science, ideas", "odd-realtime": "Real time: a minute on screen is a minute",
  "odd-objects": "Following an object from hand to hand", "odd-psa": "Educational, scare and public-info films",
  "tv-life-rescue": "Firefighters, paramedics, first responders", "other-studios": "Everything else: every other studio",
  "other-channels": "Everything else: smaller channels, web", "col-ifa-intl": "Oscars: Best International Feature",
  "col-docs-oscar": "Oscars: Best Documentary", "col-animated-oscar": "Oscars: Best Animated Feature",
  "col-bbc-21st": "BBC: the 21st century's 100 greatest films", "col-bbc-tv21": "BBC: the 21st century's greatest TV",
  "other-collections": "Everything else: loved, on no list here", "all-india": "All: every hand-picked South Asian film",
  "life-zizek-guides": "Žižek's Pervert's Guides: every film", "col-globe-comedy": "Golden Globes: Best Musical or Comedy",
  "col-national-india": "India's National Film Award: Best Feature", "col-emmy-limited": "Emmys: Outstanding Limited Series",
  "col-globe-tv-comedy": "Golden Globes: Best TV Musical or Comedy", "col-ss2022": "Sight and Sound critics' poll (2022)",
  "col-ss2022-dir": "Sight and Sound directors' poll (2022)", "col-rs-tv": "Rolling Stone: the greatest TV shows",
  "tv-cult-cancelled": "Cancelled too soon: cult favourites", "tv-cult-trash": "Glorious trash: soaps, schlock and camp",
  "col-wga101": "Writers Guild: the 101 best-written series", "other-awards": "Everything else: loved, never awarded",
  "all-awards": "All: every winner and nominee, newest first", "all-collections": "All: every film on these lists",
  "all-favourites": "All: every favourite, tagged with whose", "other-favourites": "Everything else: films about film lovers",
  "underground-shock": "Underground shock: Guinea Pig and co.", "all-eras": "All: the biggest hits of every decade",
  "all-eras-series": "All: the best-known series of every decade",
};
for (const m of MICROGENRES) { familiesOf(m); familyOf(m); }
{
  const base = id => id.replace(/-series$/, "");
  for (const m of MICROGENRES) {
    const fam = familyOf(m);
    let n = m.name;
    if (m.type === "series") n = n.replace(/ \(series\)/g, "").replace(/\s{2,}/g, " ").trim();
    n = n.replace(/^Most loved then: box-office hits of the (\d{4}s)$/, "$1 box-office hits")
         .replace(/^Most hated then: box-office bombs of the (\d{4}s)$/, "$1 box-office bombs")
         .replace(/^Everything else \((.+)\)$/, () => `Everything else: ${FAM_SHORT[fam] || "the rest"}`)
         .replace(/^All: everything in (.+)$/, () => `All: ${FAM_SHORT[fam] || "everything"}`);
    if (n.length > NAME_MAX && (SHORTER[m.id] || SHORTER[base(m.id)])) n = SHORTER[m.id] || SHORTER[base(m.id)];
    if (n.length > NAME_MAX) n = n.replace(/:.*$/, "").trim().length >= 12 ? n.replace(/:.*$/, "").trim() : n;   // drop the gloss after a colon
    if (n.length > NAME_MAX) n = n.slice(0, NAME_MAX - 1).replace(/[\s,;:–-]+\S*$/, "") + "…";
    m.name = n;
  }
  // names stay unique per type (a dropdown choice is found by its name): a clash keeps the family in brackets
  for (const t of ["movie", "series"]) {
    const seen = new Map();
    for (const m of MICROGENRES.filter(x => x.type === t)) {
      if (seen.has(m.name)) { const tag = ` (${(FAM_SHORT[familyOf(m)] || "").toLowerCase()})`; m.name = (m.name.length + tag.length > NAME_MAX ? m.name.slice(0, NAME_MAX - tag.length - 1) + "…" : m.name) + tag; }
      let k = 2; while (seen.has(m.name)) m.name = m.name.replace(/ ?\d*$/, "") + " " + k++;
      seen.set(m.name, m);
    }
  }
}
// wars that ⚔ Wars from every side already has as their own row: those rows leave the War family's dropdown (they'd
// be the same list twice), their hand-picked films lead that war's "All sides", and their tags on title pages point there
{
  const SIDE_OF = { ww1: "ww1", "spanish-civil-war": "spanish", "war-sinojapanese": "sinojapanese", ww2: "ww2", "war-korea": "korea",
    "algerian-war": "algeria", vietnam: "vietnam", "war-coldwar": "coldwar", "war-troubles": "troubles", "war-israel": "israel",
    "war-lebanon": "lebanon", "war-indopak": "indopak", "war-iraniraq": "iraniraq", "war-sovafghan": "sovafghan", "war-falklands": "falklands",
    "war-yugoslav": "yugoslav", "war-rwanda": "rwanda", "gulf-iraq-afghanistan": "gulfiraq", "war-syria": "syria", "war-karabakh": "karabakh",
    "war-ukraine": "ukraine" };
  for (const m of MICROGENRES) { const w = SIDE_OF[m.id.replace(/-series$/, "")]; if (w) m.side = w; }
}
// ── TV names: a dropdown entry fits in 25 characters, and doesn't repeat what its family already says ──
// m.long keeps the 44-character name (install page, tags, Home rows); m.name is what the family dropdown shows,
// unique inside each family it sits in; m.tag is the short name when no other row of that type has it, else the long one.
export const TV_MAX = 25;
{
  const base = id => id.replace(/-series$/, "");
  const cut = n => n.slice(0, TV_MAX - 1).replace(/[\s,;:–&-]+\S*$/, "").replace(/[\s,;:–&-]+$/, "") + "…";
  for (const m of MICROGENRES) {
    const fam = familyOf(m);
    m.long = m.name;
    let n = m.name;
    if (m.allof) n = "All";
    else if (m.catchall || /^Everything else\b/.test(n)) n = "Everything else";
    else if (m.short) n = m.short;
    else if (SHORT25[m.id] || SHORT25[base(m.id)]) n = SHORT25[m.id] || SHORT25[base(m.id)];
    else {
      n = n.replace(/^(\d{4}s) box-office hits$/, "$1 hits").replace(/^(\d{4}s) box-office bombs$/, "$1 bombs")
           .replace(/^Best-known series that began in the (\d{4}s)$/, "$1 best known").replace(/^Best-known series of the (\d{4}s)$/, "$1 best known")
           .replace(/^Best-rated (?:films|series)(?: of the| that began in the) (\d{4}s)$/, "$1 best rated").replace(/^Worst-rated (?:films|series)(?: of the| that began in the) (\d{4}s)$/, "$1 worst rated");
      if (fam === "docs" && familiesOf(m).every(f => f === "docs")) n = n.replace(/\s+(documentar(y|ies)|docs|docuseries)$/i, "").replace(/^(documentaries|docs)\s*(about|on)?\s*:?\s*/i, "") || n;
      if (fam === "anime") { const k = n.replace(/\s*\banime\b\s*/i, " ").trim(); if (k.length >= 4 && !/^(series|films?|movies)$/i.test(k)) n = k; }
      if (fam === "world") { const k = n.replace(/\s+(cinema|films)$/i, ""); if (k.length >= 4 && !/^(world|series)$/i.test(k)) n = k; }
      if (n.length > TV_MAX && n.includes(":")) { const h = n.split(":")[0].trim(); if (h.length >= 4) n = h; }
      if (n.length > TV_MAX) n = n.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s{2,}/g, " ").trim();
      if (n.length > TV_MAX) n = cut(n);
    }
    m.name = n.charAt(0).toUpperCase() + n.slice(1);
  }
  // unique inside every family a row sits in (a family's dropdown finds its choice by name)
  for (const t of ["movie", "series"]) {
    const seen = new Map();                          // family|name → row
    for (const m of MICROGENRES.filter(x => x.type === t)) {
      const fams = familiesOf(m), taken = n => fams.some(f => seen.has(f + "|" + n) && seen.get(f + "|" + n) !== m);
      if (taken(m.name)) { const l = m.long.replace(/:.*$/, "").trim(); m.name = l.length <= TV_MAX && !taken(l) ? l : m.name; }
      let k = 2; const n0 = m.name.length > TV_MAX - 2 ? cut(m.name.slice(0, TV_MAX - 2)) : m.name;
      while (taken(m.name)) m.name = n0 + " " + k++;
      for (const f of fams) seen.set(f + "|" + m.name, m);
    }
    const count = new Map();
    for (const m of MICROGENRES.filter(x => x.type === t)) count.set(m.name, (count.get(m.name) || 0) + 1);
    for (const m of MICROGENRES.filter(x => x.type === t)) m.tag = count.get(m.name) === 1 ? m.name : m.long;
  }
}
/** The row a dropdown choice means: by its TV name inside the family, else its long name, else a TV name only it has. */
export function mgByName(name, type, fam) {
  if (!name) return null;
  const pool = MICROGENRES.filter(x => !type || x.type === type);
  return (fam && pool.find(x => x.name === name && familiesOf(x).includes(fam)))
    || pool.find(x => x.long === name) || pool.find(x => x.tag === name) || pool.find(x => x.name === name) || null;
}
