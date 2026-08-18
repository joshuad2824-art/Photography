import "server-only";
import { readJson, updateJson } from "./store";
import type { Album, AlbumPhoto } from "./album-types";
import { HOME_MAX } from "./album-types";

export type { Album, AlbumPhoto } from "./album-types";
export { HOME_MAX, coverPhoto, countHomePicks } from "./album-types";

/**
 * The public albums — "piles" in Joshua's language.
 *
 * This is the content model the admin page writes to: album name, the line
 * under the title, order, draft/live, which photograph is the cover, and per
 * photograph a plate number, a hand-written caption and whether it shows in
 * "Pasted in lately" on the home page.
 */

const FILE = "albums.json";

const seed: Album[] = [
  {
    id: "treeline",
    name: "Above the treeline",
    sub: "2024 – 2026",
    hand: "Two summers of walking uphill.",
    note: "Two summers of walking uphill, mostly to stand somewhere quiet for a while. The light did what it wanted.",
    category: "Ridges & rocks",
    live: true,
    cover: 0,
    photos: [
      {
        id: "treeline-1",
        src: "/photos/high-country.jpg",
        plate: "Plate 01 · Above the treeline",
        cap: "Two days of walking for four minutes of light.",
        home: false,
        ratio: "3 / 2",
        pos: "50% 50%",
        exif: "35mm · f/8 · 1/250",
      },
      {
        id: "treeline-2",
        src: "/photos/the-gap.jpg",
        plate: "Plate 02 · The gap",
        cap: "Stood there long enough to lose the feeling in my hands.",
        home: true,
        ratio: "2 / 3",
        pos: "50% 50%",
        exif: "35mm · f/5.6 · 1/125",
      },
    ],
  },
  {
    id: "downtown",
    name: "Downtown, waiting",
    sub: "Tulsa · ongoing",
    hand: "Corners, crossings, people not in a hurry.",
    note: "Six blocks I walk most weeks. Nobody here is going anywhere in a hurry, which is the whole reason I like it.",
    category: "Sidewalks",
    live: true,
    cover: 0,
    photos: [
      {
        id: "downtown-1",
        src: "/photos/street-01-crossing.jpg",
        plate: "Plate 01 · Fifth & Boston",
        cap: "He waited out three green lights before he'd look up.",
        home: true,
        ratio: "2 / 3",
        pos: "50% 40%",
        exif: "35mm · f/2.8 · 1/160",
      },
      {
        id: "downtown-2",
        src: "/photos/street-02-grin.jpg",
        plate: "Plate 02 · Fifth & Boston",
        cap: "Then, all at once, he did.",
        home: true,
        ratio: "4 / 5",
        pos: "50% 30%",
        exif: "35mm · f/2.8 · 1/200",
      },
      {
        id: "downtown-3",
        src: "/photos/street-03-walking.jpg",
        plate: "Plate 03 · Boulder Ave",
        cap: "Wet sidewalk, streetlight doing all the work.",
        home: false,
        ratio: "2 / 3",
        pos: "50% 55%",
        exif: "35mm · f/2 · 1/60",
      },
    ],
  },
  {
    id: "weather",
    name: "Weather I stood in",
    sub: "Mostly the Ozarks",
    hand: "Fog, sleet, and one hailstorm I should have driven away from.",
    note: "Fog, sleet, and one hailstorm I should have driven away from. Bad weather makes better pictures than a clear day ever has.",
    category: "Fog & sleet",
    live: true,
    cover: 0,
    photos: [
      {
        id: "weather-1",
        src: "/photos/the-gap.jpg",
        plate: "Plate 01 · Fog line",
        cap: "The fog came up the valley faster than I could pack the bag.",
        home: false,
        ratio: "2 / 3",
        pos: "50% 50%",
        exif: "35mm · f/5.6 · 1/125",
      },
      {
        id: "weather-2",
        src: "/photos/high-country.jpg",
        plate: "Plate 02 · Sleet",
        cap: "Sleet, sideways, for about nine minutes.",
        home: false,
        ratio: "3 / 2",
        pos: "50% 40%",
        exif: "35mm · f/8 · 1/500",
      },
      {
        id: "weather-3",
        src: "/photos/street-03-walking.jpg",
        plate: "Plate 03 · Downpour",
        cap: "Everyone else had the sense to go inside.",
        home: false,
        ratio: "3 / 4",
        pos: "50% 50%",
        exif: "35mm · f/2.8 · 1/60",
      },
    ],
  },
  {
    id: "home",
    name: "The people I live with",
    sub: "Home · kitchen light",
    hand: "The ones I'd grab first if the house went up.",
    note: "Mostly taken from a chair, usually while somebody told me to put the camera down. I did not.",
    category: "Family",
    live: true,
    cover: 0,
    photos: [
      {
        id: "home-1",
        src: "/photos/street-02-grin.jpg",
        plate: "Plate 01 · Kitchen",
        cap: "New coat. He wore it inside for two days.",
        home: false,
        ratio: "4 / 5",
        pos: "50% 28%",
        exif: "50mm · f/1.8 · 1/125",
      },
      {
        id: "home-2",
        src: "/photos/street-01-crossing.jpg",
        plate: "Plate 02 · Saturday",
        cap: "Waiting on pancakes with real patience.",
        home: false,
        ratio: "2 / 3",
        pos: "50% 35%",
        exif: "35mm · f/2 · 1/80",
      },
      {
        id: "home-3",
        src: "/photos/street-03-walking.jpg",
        plate: "Plate 03 · August",
        cap: "Down the driveway to the bus, one last look back.",
        home: false,
        ratio: "3 / 4",
        pos: "50% 45%",
        exif: "50mm · f/2.8 · 1/250",
      },
    ],
  },
  {
    id: "odds",
    name: "Odds and ends",
    sub: "Nothing sorted yet",
    hand: "Frames that don't belong to anything yet.",
    note: "Frames that don't belong to anything yet. Some of them will end up in a pile of their own eventually.",
    category: "Whatever's left",
    // Still a draft, as the admin handoff shows it.
    live: false,
    cover: 0,
    photos: [
      {
        id: "odds-1",
        src: "/photos/street-03-walking.jpg",
        plate: "Plate 01 · Unsorted",
        cap: "Somebody's morning, not mine.",
        home: false,
        ratio: "3 / 4",
        pos: "50% 50%",
        exif: "35mm · f/4 · 1/200",
      },
      {
        id: "odds-2",
        src: "/photos/high-country.jpg",
        plate: "Plate 02 · Unsorted",
        cap: "Pulled over on the shoulder for this one.",
        home: false,
        ratio: "3 / 2",
        pos: "50% 60%",
        exif: "50mm · f/8 · 1/400",
      },
      {
        id: "odds-3",
        src: "/photos/the-gap.jpg",
        plate: "Plate 03 · Unsorted",
        cap: "I have no idea what made me stop here.",
        home: false,
        ratio: "4 / 5",
        pos: "50% 40%",
        exif: "35mm · f/5.6 · 1/160",
      },
      {
        id: "odds-4",
        src: "/photos/street-01-crossing.jpg",
        plate: "Plate 04 · Unsorted",
        cap: "Out of focus and I kept it anyway.",
        home: false,
        ratio: "2 / 3",
        pos: "50% 30%",
        exif: "35mm · f/2 · 1/60",
      },
      {
        id: "odds-5",
        src: "/photos/street-02-grin.jpg",
        plate: "Plate 05 · Unsorted",
        cap: "Last frame on the roll, always the loosest one.",
        home: false,
        ratio: "1 / 1",
        pos: "50% 28%",
        exif: "50mm · f/2.8 · 1/125",
      },
    ],
  },
];

/** Reads the store, writing the seed on first run so a fresh deploy works. */
export async function loadAlbums(): Promise<Album[]> {
  const existing = await readJson<Album[] | null>(FILE, null);
  if (existing) return existing;
  return updateJson<Album[]>(FILE, [], (current) =>
    current.length ? current : seed,
  );
}

/** What the public pages get: published albums, in Joshua's order. */
export async function loadLiveAlbums(): Promise<Album[]> {
  return (await loadAlbums()).filter((album) => album.live);
}

/** The home page's "Pasted in lately" strip, in album then photo order. */
export async function loadHomePicks(): Promise<
  Array<{ album: Album; photo: AlbumPhoto }>
> {
  const picks: Array<{ album: Album; photo: AlbumPhoto }> = [];
  for (const album of await loadLiveAlbums()) {
    for (const photo of album.photos) {
      if (photo.home) picks.push({ album, photo });
    }
  }
  return picks.slice(0, HOME_MAX);
}

export async function saveAlbums(
  mutate: (albums: Album[]) => Album[],
): Promise<Album[]> {
  return updateJson<Album[]>(FILE, [], (current) =>
    mutate(current.length ? current : seed),
  );
}
