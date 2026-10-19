# Submission: Kiki's Loom Room (Track 2: Your Own Baby)

Built for haX.baby, Baby's First Website Hackathon 2026.

- **Live site URL:** `<LIVE SITE URL>`
- **GitHub repository URL:** `<GITHUB REPOSITORY URL>` (commits should be dated 17 to 19 October)

## Character

| Field | Answer |
|---|---|
| Name | Kiki |
| What they are | A baby Moon-Mouseling with a round lavender body, big fuzzy ears, dewdrop eyes and a knitted scarf spun from moonlight. Shy, affectionate, soft-spoken and endlessly curious. |
| What they do | Apprentice Starlight Weaver. Spins beam-threads from fallen stars into glowing night-blankets, so every creature in the forest feels safe on a cold night. |
| Their story | Kiki found a cold, fallen star in the moss and wrapped it in yarn. It began to glow, the Elder Weaver noticed, and Kiki moved into the Observatory Tree to learn the craft. |
| Tagline | "I stitch the night sky into blankets." |

## Story write-up

Kiki is a baby Moon-Mouseling and an apprentice Starlight Weaver who lives in a teacup lined with velvet moss at the top of the Observatory Tree. The site is meant to feel like a tiny corner of the early web where someone made something by hand (pixel title bars, a marquee, a visitor odometer, a "best viewed at night" badge) wrapped around a very soft, very shy character.

This is a personal portfolio for a character, not a game. It introduces Kiki, her job, her story and the things she makes, and lets visitors poke at all of it. Her name is a row of music-box keys, she tilts toward your cursor, and the scarf and nose each hide a surprise. Her projects are small toys you can try: re-thread a blanket for a sleepy, dreamy, brave or giggly night, connect twelve stars, brew star-tea, chase yarn in the playpen. The scroll story follows five illustrated memories (the fallen star, the first glow, the Observatory Tree, a loom of her very own, tonight), and it leads to her real workspace: a small 3D Loom Room you can look around and talk to her in. A short bedtime section and a wish form close the page.

The site is organised as eight clearly labelled places, all reachable from one navigation bar (a bottom-sheet menu on phones): Home, About, My stuff, My story, Loom Room, Yarn play, Bedtime and Contact. The current section is highlighted as you scroll, and buttons throughout say where they lead (for example "See what I'm making", "Find my loom in the 3D Loom Room", "Take the yarn to my Loom Room").

## Features

**Tier 1 (core)**
- Enter screen that unlocks sound, with an "Enter quietly" option
- Hero with a live, tilting Kiki (video clips), playable title letters, a speech bubble
- Character sheet, stat bars and quirk buttons
- Day ("Pastel Morning Tea") and Night ("Deep Starlight") themes, clock-aware default
- Responsive layout; on narrow screens the section links open as a thumb-reachable bottom sheet with 48px targets that closes after you choose
- Visit odometer and returning-visitor greeting (stored in this browser only)
- Keyboard focus styles, alt text, reduced-motion support, 44px minimum touch targets, a "you are here" highlight in the navigation

**Tier 2 (interactive)**
- Three project toys: Blanket Loom, Constellation Connect-the-Dots, Star-Tea Steeper
- Synthesized lullaby, crickets, birdsong and effects (Web Audio), with a mute switch and the `M` key
- Stardust and glowing-thread cursor trail (mouse and pen only; stops when the pointer leaves the window), bursts and confetti
- Two hidden surprises (Easter eggs): tug the scarf three times (the star knot and a sneeze), boop the nose four times fast (curls into a yarn ball)
- Scroll-stitched story with a needle riding the thread
- Yarn-ball playpen with physics (mouse, touch and arrow keys)
- Cloud-shaped wish form with validation
- Window-size remarks and "chaos mode" while resizing

**Tier 3 (experimental)**
- **3D Loom Room** (Three.js, lazy-loaded): loom, yarn, needles, fallen stars, star-tea, lantern, hanging moon, glowing threads, floating starlight, and Kiki as her real artwork. Drag or arrow keys to orbit, hover labels, click objects to make them react. The loom weaves a new row in the colours of the mood chosen in the Blanket Loom. Reduced-detail mode on phones, pauses when off-screen, falls back to a picture if WebGL is unavailable. Every object also has a button, so it works without a mouse.
- **Talk to Kiki:** a hand-written, in-character chat (keyword matcher, several replies per topic, remembers a name you tell her). Replies can link to the matching story scene or open the 3D room. No AI service is used.
- **Immersive story:** the five original illustrations with scroll-linked parallax, drifting motes, a scene-coloured tint, tappable memories with Kiki reactions, "Ask Kiki about this" buttons, and a link into the Loom Room.
- **Kiki's cozy level and work list:** a handwritten note shows how cozy Kiki is. Five things warm her up by 20% each (re-threading the blanket loom, connecting the constellation, brewing star-tea, throwing or pulling the yarn, finding a secret), and each also ticks a line on her "messy little work list" (Finish moon blanket, Stitch Little Bear, Brew star-tea, Find missing golden thread, Don't fall asleep at the loom). At 100% the note says "MAXIMUM COZY: Kiki is officially super cozy." There is no scoring, ranking or timer. Saved in this browser only.
- **Connections:** hero buttons lead to the projects and to bedtime, each project toy has a "find it in the 3D Loom Room" button, the story ends at the Loom Room door, the Loom Room and the Yarn Playpen point at each other, chat replies link to the matching story scene or 3D object, and bedtime leads to the contact form or back to the top.

## Technical stack
Plain HTML, CSS and JavaScript with no build step. Three.js r170 (MIT) is vendored in `js/vendor/` and only downloaded when the 3D room is opened. Canvas 2D for stardust, Web Audio for all sound, `localStorage` for the visit count, secrets, cozy progress and chat name. Fonts from Google Fonts with system fallbacks. Deploys as static files.

## Credits
- Built for haX.baby: Baby's First Website Hackathon 2026.
- Kiki's world, story and code: Zia Vijay Prasad. Code written with help from Claude, an AI coding assistant.
- Artwork: AI-generated illustrations (original art generated with ChatGPT), edited and arranged by Zia Prasad.
- Animated clips: AI image-to-video by Magic Hour, trimmed and compressed by Zia.
- Sound: synthesized live in the browser (Web Audio). No audio files, so no music is credited.
- 3D: Three.js (MIT).
- Fonts: Bagel Fat One, Nunito, Silkscreen and Caveat (Google Fonts, SIL Open Font License).

## How it was checked
Desktop (1366px) and phone (390px, plus 320px) layouts, section navigation and the active-section highlight, the mobile menu, keyboard tabbing and visible focus, reduced-motion mode, the no-WebGL fallback, day and night themes, mute (button and `M` key), every project toy, the yarn playpen and chase, the 3D Loom Room, chat links, story interactions, both secrets, the contact form's error and success states, and text contrast of the new notes in both themes.

## Honest limitations
- The wish form has no mailbox. With no endpoint set it says "MESSAGE TUCKED AWAY / Nothing was sent". Set `window.KIKI_FORM_ENDPOINT` in `index.html` to receive wishes.
- Kiki's chat is scripted, not a language model. Questions outside her topics get a gentle "ask me something smaller" reply.
- The visit counter, cozy level, work list and secrets are per browser, not global.
- Kiki's work list starts completely unticked and fills in as a visitor tries things, so a first-time visitor sees how it works.
- The Wish Wall guestbook is built but hidden until a Supabase table is configured (`supabase.sql`).
- The 3D room was tested in desktop and emulated-mobile Chromium with software rendering, not on real phones or GPUs. On touch screens it rotates sideways only, so the page can still scroll.
- Story hotspots are labelled buttons and a click anywhere on the art, not regions on individual painted objects.
- Google Fonts (including the handwritten Caveat used for notes) need an internet connection; offline the page uses system fonts.
