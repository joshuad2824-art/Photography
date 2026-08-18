/**
 * Every piece of copy Joshua can edit in place, with the shipped default.
 *
 * Ids match the prototype's `JDCms.text(id, fallback)` keys so edits made
 * against the design files carry over. Overrides live server-side (see
 * lib/store.ts) rather than in a browser's localStorage.
 */
export const defaultContent = {
  "site.tagline": "photographs, mostly close to home",
  "site.footerContact": "Tulsa, Oklahoma · Timberandink@outlook.com",
  "site.footerTagline": "made in spare moments",

  "nav.home": "Home",
  "nav.galleries": "Galleries",
  "nav.session": "YOUR SESSION",
  "nav.about": "About",

  "home.heroCaption": "Two days of walking for four minutes of light.",
  "home.badge": "Tulsa, Oklahoma",
  "home.heroTitle": "A drawer full of ordinary hours",
  "home.heroHand":
    "River fog, wet streetlight, my kid on a corner downtown — I keep the ones I'd want to find again in twenty years.",
  "home.heroBody":
    "This is a hobby, not a storefront. Landscapes and street work live out in the open; portrait sessions live behind a word I send you.",
  "home.noPrints": "No prints for sale · no mailing list",
  "home.recentTitle": "Pasted in lately",
  "home.recentHand": "newest on top, as always",
  "home.card1": "He waited out three green lights before he'd look up.",
  "home.card2": "Stood there long enough to lose the feeling in my hands.",
  "home.card3": "Then, all at once, he did.",
  "home.moreLink": "the rest of the drawer →",
  "home.noteBadge": "A note before you look",
  "home.noteBody":
    "I'm not trying to sell you anything here. I carry a camera on walks and on drives out toward the Ozarks, and this is where the good ones end up. Slow down, look closer — that's the whole invitation.",
  "home.ctaEyebrow": "IF WE DID A PHOTOSHOOT TOGETHER",
  "home.ctaTitle": "Your gallery is waiting",
  "home.ctaBody":
    "I sent you a word. It opens your gallery and nothing else, and the full-size files are yours whenever you want them.",
  "home.ctaHint": "Case doesn't matter.",

  "galleries.title": "The drawer",
  "galleries.hand": "no filing system to speak of",
  "galleries.intro":
    "Piles rather than folders. A walk, a drive, a bad-weather afternoon — whatever ended up belonging together. Pick one up and see.",
  "galleries.footerNote":
    "For your personal gallery from our photoshoot together, open 'Private Gallery' or 'Session'.",
  "galleries.footerLinkLabel": "Open a private gallery",

  "session.lockedBadge": "A private drawer",
  "session.lockedTitle": "Your gallery is waiting",
  "session.lockedHand":
    "I sent you a word. It opens your gallery and nothing else — no account, no password to remember.",
  "session.lockedBody":
    "If you've lost the word, write to me and I'll send it again. If you'd rather I take the gallery down early, that's fine too — say so and it's gone that day.",
  "session.lockedEmail": "Timberandink@outlook.com",
  "session.formHand": "The word I sent you",
  "session.formHint": "Case doesn't matter. Try cottonwood to look around.",
  "session.noteBody":
    "Mark the ones you want printed and I'll get them ordered — no charge, that's part of it. The full-size files are yours to keep; I'd back them up somewhere that isn't a phone.",

  "about.portraitCaption": "Self-timer, ten seconds, one try",
  "about.badge": "Tulsa, Oklahoma",
  "about.title": "The person behind the camera",
  "about.hand":
    "Hospital IT by day, student minister by heart, and this is what I do with whatever's left of the evening.",
  "about.body":
    "I picked up a camera about three years ago wanting to get better at paying attention, and it worked better than I expected. I'm still not sure I'd call myself a photographer — mostly I'm someone who stops the car a lot.",
  "about.noteEyebrow": "How this started",
  "about.note1":
    "I've spent most of my working life keeping hospital networks from falling over, which is a job made of other people's emergencies. Photography is the opposite kind of attention — nothing is broken, nobody's paging me, I just have to stand somewhere long enough to notice what's actually in front of me.",
  "about.note2":
    "Most of what ends up here happens within an hour of the house — a walk, a drive out toward the Ozarks, a Tuesday that turned out better than expected. I also lead a student ministry, which probably explains why I keep gravitating toward pictures of kids being exactly themselves and not performing for anyone.",
  "about.note3":
    "I don't sell prints and there's no mailing list. If you were in front of my camera for a session, I'll send you a word that opens your gallery, and it's yours to keep.",
  "about.bagTitle": "What's in the bag",
  "about.bagHand": "not much, on purpose",
  "about.bagIntro":
    "One camera, two lenses, no drone. I've found that owning less gear means fewer excuses to stay home.",
  "about.tag1": "35mm, mostly wide open",
  "about.tag2": "50mm for portraits",
  "about.tag3": "no flash",
  "about.tag4": "tripod stays in the car",
  "about.tag5": "manual, most of the time",
  "about.backLink": "back to the drawer →",
} as const;

export type ContentId = keyof typeof defaultContent;

/** Ids for the one replaceable photograph the inline editor handles. */
export const IMAGE_IDS = ["about.portrait"] as const;
export type ImageId = (typeof IMAGE_IDS)[number];

export type SiteContent = Record<string, string>;
export type SiteImages = Partial<Record<ImageId, string>>;

export function withDefaults(overrides: SiteContent): SiteContent {
  return { ...defaultContent, ...overrides };
}
