import type { SeedProgress } from "@/types/rag";
import { embedText } from "./embeddings";
import { chunkDiscoveryItem } from "./chunking";
import { addVectors, hasShow, getStoreSize, getUniqueShows } from "./vectorStore";
import { getCachedEmbedding, setCachedEmbedding } from "./cache";

const SEED_SHOWS = [
  { id: 1396, type: "tv" as const, title: "Breaking Bad", overview: "A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine with a former student to secure his family's future.", rating: 8.9, year: "2008", posterPath: null },
  { id: 94997, type: "tv" as const, title: "Squid Game", overview: "Hundreds of cash-strapped players accept a strange invitation to compete in children's games. Inside, a tempting prize awaits with deadly high stakes.", rating: 7.8, year: "2021", posterPath: null },
  { id: 82856, type: "tv" as const, title: "The Mandalorian", overview: "The travels of a lone bounty hunter in the outer reaches of the galaxy, far from the authority of the New Republic.", rating: 8.6, year: "2019", posterPath: null },
  { id: 1399, type: "tv" as const, title: "Game of Thrones", overview: "Seven noble families fight for control of the lands of Westeros, while an ancient enemy returns after being dormant for millennia.", rating: 8.4, year: "2011", posterPath: null },
  { id: 66732, type: "tv" as const, title: "Stranger Things", overview: "When a young boy disappears, his mother, a police chief and his friends must confront terrifying supernatural forces in order to get him back.", rating: 8.6, year: "2016", posterPath: null },
  { id: 93405, type: "tv" as const, title: "Squid Game: The Challenge", overview: "456 real players compete in a series of children's games for a life-changing cash prize of $4.56 million.", rating: 5.0, year: "2023", posterPath: null },
  { id: 74580, type: "tv" as const, title: "Wednesday", overview: "Follows Wednesday Addams's years as a student, when she attempts to master her emerging psychic ability while thwarting a killing spree.", rating: 8.1, year: "2022", posterPath: null },
  { id: 100088, type: "tv" as const, title: "The Last of Us", overview: "Joel and Ellie navigate a post-apocalyptic America overrun by deadly infected and残忍 survivors.", rating: 8.8, year: "2023", posterPath: null },
  { id: 110316, type: "tv" as const, title: "Dark", overview: "A family saga with a supernatural twist, set in a German town where the disappearance of two young children exposes relationships among four families.", rating: 8.8, year: "2017", posterPath: null },
  { id: 76479, type: "tv" as const, title: "The Witcher", overview: "Geralt of Rivia, a solitary monster hunter, struggles to find his place in a world where people often prove more wicked than beasts.", rating: 8.2, year: "2019", posterPath: null },
  { id: 84958, type: "tv" as const, title: "Loki", overview: "The mercurial villain Loki resumes his role as the God of Mischief in a new series that takes place after the events of Avengers: Endgame.", rating: 8.2, year: "2021", posterPath: null },
  { id: 95557, type: "tv" as const, title: "Invasion", overview: "An alien invasion series from multiple perspectives across the world.", rating: 6.2, year: "2021", posterPath: null },
  { id: 60735, type: "tv" as const, title: "The Flash", overview: "After being struck by lightning, CSI investigator Barry Allen awakens from his coma to discover he's been given the power of the fastest man alive.", rating: 7.8, year: "2014", posterPath: null },
  { id: 63174, type: "tv" as const, title: "Arcane", overview: "Amid the stark discord of twin cities Piltover and Zaun, two sisters fight on rival sides of a war between magic technology and clashing convictions.", rating: 9.0, year: "2021", posterPath: null },
  { id: 124364, type: "tv" as const, title: "The Bear", overview: "A young chef from the fine dining world returns to Chicago to run his family's sandwich shop.", rating: 8.6, year: "2022", posterPath: null },
  { id: 550, type: "movie" as const, title: "Fight Club", overview: "An insomniac office worker and a devil-may-care soap maker form an underground fight club that evolves into much more.", rating: 8.4, year: "1999", posterPath: null },
  { id: 550988, type: "movie" as const, title: "Free Guy", overview: "A bank teller called Guy realizes he is a background character in an open world video game.", rating: 7.7, year: "2021", posterPath: null },
  { id: 299536, type: "movie" as const, title: "Avengers: Infinity War", overview: "The Avengers and their allies must be willing to sacrifice all in an attempt to defeat the powerful Thanos.", rating: 8.3, year: "2018", posterPath: null },
  { id: 27205, type: "movie" as const, title: "Inception", overview: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea.", rating: 8.4, year: "2010", posterPath: null },
  { id: 680, type: "movie" as const, title: "Pulp Fiction", overview: "The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.", rating: 8.5, year: "1994", posterPath: null },
  { id: 155, type: "movie" as const, title: "The Dark Knight", overview: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological tests.", rating: 8.5, year: "2008", posterPath: null },
  { id: 299534, type: "movie" as const, title: "Avengers: Endgame", overview: "After the devastating events of Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more.", rating: 8.3, year: "2019", posterPath: null },
  { id: 1726, type: "movie" as const, title: "Iron Man", overview: "After being held captive in an Afghan cave, billionaire engineer Tony Stark creates a unique weaponized suit of armor to fight evil.", rating: 7.6, year: "2008", posterPath: null },
  { id: 11, type: "movie" as const, title: "Star Wars", overview: "Luke Skywalker joins forces with a Jedi Knight, a cocky pilot, a Wookiee and two droids to save the galaxy from the Empire.", rating: 8.2, year: "1977", posterPath: null },
  { id: 872585, type: "movie" as const, title: "Oppenheimer", overview: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.", rating: 8.3, year: "2023", posterPath: null },
  { id: 438148, type: "movie" as const, title: "Minions: The Rise of Gru", overview: "A fanboy of supervillain Gru hatches a plan to join the Vicious 6.", rating: 7.6, year: "2022", posterPath: null },
  { id: 694919, type: "movie" as const, title: "Money Heist: The Phenomenon", overview: "A documentary exploring the cultural phenomenon of La Casa de Papel.", rating: 6.5, year: "2020", posterPath: null },
  { id: 361743, type: "movie" as const, title: "Top Gun: Maverick", overview: "After more than thirty years of service as one of the Navy's top aviators, Pete Mitchell is where he belongs.", rating: 8.3, year: "2022", posterPath: null },
  { id: 238, type: "movie" as const, title: "The Godfather", overview: "The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant youngest son.", rating: 8.7, year: "1972", posterPath: null },
  { id: 244786, type: "movie" as const, title: "Whiplash", overview: "A promising young drummer enrolls at a cut-throat music conservatory where his dreams of greatness are mentored by an instructor who will stop at nothing.", rating: 8.4, year: "2014", posterPath: null },
];

export const seedKnowledgeBase = async (
  onProgress?: (progress: SeedProgress) => void
): Promise<{ seeded: number; skipped: number }> => {
  let seeded = 0;
  let skipped = 0;

  onProgress?.({ status: "seeding", current: 0, total: SEED_SHOWS.length, currentTitle: "" });

  for (let i = 0; i < SEED_SHOWS.length; i++) {
    const show = SEED_SHOWS[i];

    if (hasShow(show.id)) {
      skipped++;
      onProgress?.({ status: "seeding", current: i + 1, total: SEED_SHOWS.length, currentTitle: `${show.title} (cached)` });
      continue;
    }

    onProgress?.({ status: "seeding", current: i + 1, total: SEED_SHOWS.length, currentTitle: show.title });

    try {
      const chunks = chunkDiscoveryItem(show);
      const entries = [];

      for (const chunk of chunks) {
        let embedding = getCachedEmbedding(chunk.content);
        if (!embedding) {
          embedding = await embedText(chunk.content);
          setCachedEmbedding(chunk.content, embedding);
        }
        entries.push({ chunk, embedding });
      }

      addVectors(entries);
      seeded++;
    } catch (e) {
      console.error(`Failed to seed "${show.title}":`, e);
    }
  }

  onProgress?.({ status: "done", current: SEED_SHOWS.length, total: SEED_SHOWS.length, currentTitle: "" });
  return { seeded, skipped };
};

export const getSeedShowCount = (): number => SEED_SHOWS.length;

export const getVectorStoreStatus = () => ({
  totalVectors: getStoreSize(),
  totalShows: getUniqueShows().size,
});
