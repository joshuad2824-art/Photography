/**
 * The public albums — "piles" in Joshua's language.
 *
 * This is the content model the handoff asked for: albums own their photos,
 * their cover treatment on the index, and the scatter geometry that gives the
 * masonry its pile-of-prints feel. Swapping in real photographs means editing
 * this file (or, later, pointing `loadAlbums` at a database) — no page changes.
 */

export type AlbumPhoto = {
  src: string;
  /** Hand-written caption shown under the print and in the lightbox. */
  cap: string;
  plate: string;
  exif: string;
  /** CSS aspect-ratio, e.g. "3 / 2". */
  ratio: string;
  /** CSS object-position / background-position. */
  pos: string;
  /** Masonry geometry: card width, left offset and rotation. */
  w: string;
  ml: string;
  rot: string;
};

export type Album = {
  slug: string;
  title: string;
  /** Right-hand half of the "N prints · <sub>" badge on the album header. */
  sub: string;
  note: string;
  /** Index-card copy and cover treatment. */
  card: {
    /** Content id for the inline-editable card title. */
    titleId: string;
    handId: string;
    hand: string;
    cover: string;
    coverAlt: string;
    ratio: string;
    pos?: string;
    /** Dark chip on the index card. */
    category: string;
    /** Mono line beside the chip. */
    dates: string;
    /** Scatter geometry for the index masonry. */
    w: string;
    ml: string;
    rot: string;
    matPadding: string;
    liftClass: string;
    tape: {
      stock: "olive" | "cream";
      style: Record<string, string | number>;
    };
  };
  photos: AlbumPhoto[];
};

export const albums: Album[] = [
  {
    slug: "treeline",
    title: "Above the treeline",
    sub: "2024–2026",
    note: "Two summers of walking uphill, mostly to stand somewhere quiet for a while. The light did what it wanted.",
    card: {
      titleId: "galleries.treelineTitle",
      handId: "galleries.treelineHand",
      hand: "Two summers of walking uphill.",
      cover: "/photos/high-country.jpg",
      coverAlt: "Grass and ridgeline above the treeline",
      ratio: "3 / 2",
      category: "Ridges & rocks",
      dates: "2024 – 2026",
      w: "100%",
      ml: "0",
      rot: "-1.4deg",
      matPadding: "13px 13px 17px",
      liftClass: "pile-lift-a",
      tape: {
        stock: "cream",
        style: { bottom: -6, right: 16, width: 104, height: 28, transform: "rotate(-9deg)" },
      },
    },
    photos: [
      {
        src: "/photos/high-country.jpg",
        cap: "Two days of walking for four minutes of light.",
        plate: "Plate 01 · Above the treeline",
        exif: "35mm · f/8 · 1/250",
        ratio: "3 / 2",
        pos: "50% 50%",
        w: "100%",
        ml: "0",
        rot: "-1.2deg",
      },
      {
        src: "/photos/the-gap.jpg",
        cap: "Stood there long enough to lose the feeling in my hands.",
        plate: "Plate 02 · The gap",
        exif: "35mm · f/5.6 · 1/125",
        ratio: "2 / 3",
        pos: "50% 50%",
        w: "94%",
        ml: "6%",
        rot: "1.4deg",
      },
    ],
  },
  {
    slug: "downtown",
    title: "Downtown, waiting",
    sub: "Tulsa · ongoing",
    note: "Six blocks I walk most weeks. Nobody here is going anywhere in a hurry, which is the whole reason I like it.",
    card: {
      titleId: "galleries.downtownTitle",
      handId: "galleries.downtownHand",
      hand: "Corners, crossings, people not in a hurry.",
      cover: "/photos/street-01-crossing.jpg",
      coverAlt: "A boy waiting at a downtown crossing",
      ratio: "4 / 5",
      pos: "50% 30%",
      category: "Sidewalks",
      dates: "Tulsa · ongoing",
      w: "92%",
      ml: "0",
      rot: "1.5deg",
      matPadding: "12px 12px 16px",
      liftClass: "pile-lift-b",
      tape: {
        stock: "olive",
        style: { bottom: -7, left: -12, width: 92, height: 26, transform: "rotate(-11deg)" },
      },
    },
    photos: [
      {
        src: "/photos/street-01-crossing.jpg",
        cap: "He waited out three green lights before he'd look up.",
        plate: "Plate 01 · Fifth & Boston",
        exif: "35mm · f/2.8 · 1/160",
        ratio: "2 / 3",
        pos: "50% 40%",
        w: "100%",
        ml: "0",
        rot: "1.3deg",
      },
      {
        src: "/photos/street-02-grin.jpg",
        cap: "Then, all at once, he did.",
        plate: "Plate 02 · Fifth & Boston",
        exif: "35mm · f/2.8 · 1/200",
        ratio: "4 / 5",
        pos: "50% 30%",
        w: "94%",
        ml: "6%",
        rot: "-1.5deg",
      },
      {
        src: "/photos/street-03-walking.jpg",
        cap: "Wet sidewalk, streetlight doing all the work.",
        plate: "Plate 03 · Boulder Ave",
        exif: "35mm · f/2 · 1/60",
        ratio: "2 / 3",
        pos: "50% 55%",
        w: "100%",
        ml: "0",
        rot: "0.9deg",
      },
    ],
  },
  {
    slug: "weather",
    title: "Weather I stood in",
    sub: "Mostly the Ozarks",
    note: "Fog, sleet, and one hailstorm I should have driven away from. Bad weather makes better pictures than a clear day ever has.",
    card: {
      titleId: "galleries.weatherTitle",
      handId: "galleries.weatherHand",
      hand: "Fog, sleet, and one hailstorm I should have driven away from.",
      cover: "/photos/the-gap.jpg",
      coverAlt: "A figure standing in a gap between two rock faces",
      ratio: "2 / 3",
      category: "Fog & sleet",
      dates: "Mostly the Ozarks",
      w: "94%",
      ml: "6%",
      rot: "-0.8deg",
      matPadding: "12px 12px 16px",
      liftClass: "pile-lift-c",
      tape: {
        stock: "cream",
        style: { bottom: -8, left: 22, width: 88, height: 25, transform: "rotate(7deg)" },
      },
    },
    photos: [
      {
        src: "/photos/the-gap.jpg",
        cap: "The fog came up the valley faster than I could pack the bag.",
        plate: "Plate 01 · Fog line",
        exif: "35mm · f/5.6 · 1/125",
        ratio: "2 / 3",
        pos: "50% 50%",
        w: "100%",
        ml: "0",
        rot: "-1.4deg",
      },
      {
        src: "/photos/high-country.jpg",
        cap: "Sleet, sideways, for about nine minutes.",
        plate: "Plate 02 · Sleet",
        exif: "35mm · f/8 · 1/500",
        ratio: "3 / 2",
        pos: "50% 40%",
        w: "94%",
        ml: "6%",
        rot: "1.2deg",
      },
      {
        src: "/photos/street-03-walking.jpg",
        cap: "Everyone else had the sense to go inside.",
        plate: "Plate 03 · Downpour",
        exif: "35mm · f/2.8 · 1/60",
        ratio: "3 / 4",
        pos: "50% 50%",
        w: "100%",
        ml: "0",
        rot: "0.7deg",
      },
    ],
  },
  {
    slug: "home",
    title: "The people I live with",
    sub: "Home · kitchen light",
    note: "Mostly taken from a chair, usually while somebody told me to put the camera down. I did not.",
    card: {
      titleId: "galleries.homeTitle",
      handId: "galleries.homeHand",
      hand: "The ones I'd grab first if the house went up.",
      cover: "/photos/street-02-grin.jpg",
      coverAlt: "A boy in a fur-hooded coat, grinning",
      ratio: "1 / 1",
      pos: "50% 28%",
      category: "Family",
      dates: "Home · kitchen light",
      w: "88%",
      ml: "0",
      rot: "2deg",
      matPadding: "12px 12px 16px",
      liftClass: "pile-lift-d",
      tape: {
        stock: "olive",
        style: { bottom: -7, right: -12, width: 92, height: 26, transform: "rotate(-14deg)" },
      },
    },
    photos: [
      {
        src: "/photos/street-02-grin.jpg",
        cap: "New coat. He wore it inside for two days.",
        plate: "Plate 01 · Kitchen",
        exif: "50mm · f/1.8 · 1/125",
        ratio: "4 / 5",
        pos: "50% 28%",
        w: "100%",
        ml: "0",
        rot: "1.1deg",
      },
      {
        src: "/photos/street-01-crossing.jpg",
        cap: "Waiting on pancakes with real patience.",
        plate: "Plate 02 · Saturday",
        exif: "35mm · f/2 · 1/80",
        ratio: "2 / 3",
        pos: "50% 35%",
        w: "94%",
        ml: "6%",
        rot: "-1.5deg",
      },
      {
        src: "/photos/street-03-walking.jpg",
        cap: "Down the driveway to the bus, one last look back.",
        plate: "Plate 03 · August",
        exif: "50mm · f/2.8 · 1/250",
        ratio: "3 / 4",
        pos: "50% 45%",
        w: "100%",
        ml: "0",
        rot: "0.8deg",
      },
    ],
  },
  {
    slug: "odds",
    title: "Odds and ends",
    sub: "Unsorted",
    note: "Frames that don't belong to anything yet. Some of them will end up in a pile of their own eventually.",
    card: {
      titleId: "galleries.oddsTitle",
      handId: "galleries.oddsHand",
      hand: "Frames that don't belong to anything yet.",
      cover: "/photos/street-03-walking.jpg",
      coverAlt: "A figure walking away down a wet sidewalk",
      ratio: "3 / 4",
      category: "Whatever's left",
      dates: "Nothing sorted yet",
      w: "96%",
      ml: "4%",
      rot: "-1.9deg",
      matPadding: "12px 12px 16px",
      liftClass: "pile-lift-e",
      tape: {
        stock: "cream",
        style: { bottom: -6, left: -14, width: 98, height: 27, transform: "rotate(11deg)" },
      },
    },
    photos: [
      {
        src: "/photos/street-03-walking.jpg",
        cap: "Somebody's morning, not mine.",
        plate: "Plate 01 · Unsorted",
        exif: "35mm · f/4 · 1/200",
        ratio: "2 / 3",
        pos: "50% 50%",
        w: "100%",
        ml: "0",
        rot: "-1.2deg",
      },
      {
        src: "/photos/high-country.jpg",
        cap: "Pulled over on the shoulder for this one.",
        plate: "Plate 02 · Unsorted",
        exif: "50mm · f/8 · 1/400",
        ratio: "3 / 2",
        pos: "50% 60%",
        w: "96%",
        ml: "4%",
        rot: "1.5deg",
      },
      {
        src: "/photos/the-gap.jpg",
        cap: "I have no idea what made me stop here.",
        plate: "Plate 03 · Unsorted",
        exif: "35mm · f/5.6 · 1/160",
        ratio: "4 / 5",
        pos: "50% 40%",
        w: "100%",
        ml: "0",
        rot: "0.6deg",
      },
      {
        src: "/photos/street-01-crossing.jpg",
        cap: "Out of focus and I kept it anyway.",
        plate: "Plate 04 · Unsorted",
        exif: "35mm · f/2 · 1/60",
        ratio: "2 / 3",
        pos: "50% 30%",
        w: "92%",
        ml: "6%",
        rot: "-1.7deg",
      },
      {
        src: "/photos/street-02-grin.jpg",
        cap: "Last frame on the roll, always the loosest one.",
        plate: "Plate 05 · Unsorted",
        exif: "50mm · f/2.8 · 1/125",
        ratio: "1 / 1",
        pos: "50% 28%",
        w: "100%",
        ml: "0",
        rot: "1deg",
      },
    ],
  },
];

export function albumBySlug(slug: string): Album | undefined {
  return albums.find((a) => a.slug === slug);
}
