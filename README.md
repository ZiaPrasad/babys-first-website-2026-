# Kiki's Loom Room

A cozy, interactive character portfolio for **Kiki**, a baby Moon-Mouseling who spins fallen stars into glowing night-blankets. It's a personal website about her (who she is, what she makes, her story and her workspace) with playful things to poke, not a game.
Built for the haX **Baby's First Website** hackathon, Track 2 (Your Own Baby).

Plain HTML, CSS and JavaScript, no build step. The only dependency is Three.js (vendored in `js/vendor/`), lazy-loaded when a visitor steps into the 3D Loom Room.

## Run it

Any static server works. Browsers block some features on `file://`, so don't double-click `index.html`.

```bash
python3 -m http.server 8000      # then open http://localhost:8000
# or:  npx serve .
```

## Deploy (pick one)

- **Netlify Drop:** open https://app.netlify.com/drop and drag this whole folder onto the page.
- **Vercel:** `npx vercel --prod` from this folder, or import the GitHub repo (framework preset: "Other", no build command, output directory `.`).
- **GitHub Pages:** push to GitHub, then Settings, Pages, deploy from the `main` branch, root folder.
- **Cloudflare Pages:** connect the repo, no build command, output directory `/`.

## What's inside

| Feature | Where |
|---|---|
| Enter screen that unlocks sound, "Enter quietly" option | `index.html`, `js/main.js` |
| Synthesized lullaby, crickets by night, birdsong by day, click sounds, **mute switch** (button or `M` key) | `js/audio.js` |
| Day ("Pastel Morning Tea") and Night ("Deep Starlight") themes, clock-aware default | `js/theme.js` |
| Stardust and glowing-thread cursor trail, bursts, confetti | `js/stardust.js` |
| Tilting live Kiki, playable title letters, two hidden secrets | `js/hero.js` |
| Three project toys: Blanket Loom, Constellation Connect-the-Dots, Star-Tea Steeper | `js/projects.js` |
| Scroll-stitched story with a needle riding the thread | `js/story.js` |
| Yarn-ball playpen with physics, Kiki chases it | `js/playpen.js` |
| Cloud-shaped wish form | `js/contact.js` |
| Wish Wall guestbook (optional, needs a free Supabase table) | `js/guestbook.js` |
| Responsive personality ("chaos mode") | `js/responsive.js` |
| Visit odometer, returning-visitor greeting | `js/main.js` |
| 3D Loom Room: large stage, damped orbit/zoom/pinch/arrow-key camera, on-screen camera buttons, draggable yarn that Kiki chases, speech bubbles, swinging lantern + moon, weaving shuttle (Three.js, lazy-loaded, mobile-lite mode) | `js/room.js`, `js/room3d.js` |
| Kiki's Yarn Chase: artwork pops up when yarn is pulled, has its own card, and the Playpen hands off to the 3D room | `assets/kiki-yarn-chase*.webp`, `js/room.js`, `js/playpen.js` |
| Talk to Kiki (hand-written, no API) | `js/chat.js` |
| Kiki's cozy level + messy little work list (five things, 20% each) | `js/cozy.js` |
| Section navigation: smooth scroll, active-section highlight, bottom-sheet menu on phones | `js/main.js`, `css/styles.css` |
| Immersive story (parallax, motes, tappable memories) | `js/immersive.js` |

### The secrets (Easter eggs)

1. Click Kiki's **scarf** three times. She says two things, then the star knot comes loose and she sneezes shooting stars.
2. **Boop her nose** four times fast. She curls into a yarn ball.

## Turn on the two optional extras

Both are off until you fill in a value in `index.html`, and neither shows a broken UI while off.

**1. Wishes in your inbox (cloud form).** Create a free form at https://formspree.io, then set:

```html
<script>window.KIKI_FORM_ENDPOINT = 'https://formspree.io/f/yourFormId';</script>
```

Until you do, the form is honest about it: it shows "Message tucked away" and says nothing was sent.

**2. The Wish Wall (live guestbook).**

1. Create a free project at https://supabase.com.
2. In the SQL editor, run `supabase.sql` from this folder.
3. In Project Settings, API, copy the **Project URL** and the **anon public** key (the anon key is meant to be public) into:

```html
<script>window.KIKI_GUESTBOOK = { url: 'https://xxxx.supabase.co', anonKey: 'eyJ...', table: 'guestbook' };</script>
```

The wall then appears on the page. Messages are shown as plain text, limited to 140 characters, with a 30-second cooldown and a honeypot against bots. Delete unwanted rows from the Supabase table editor.

## Before you submit

- Replace the AI-art credit in the footer (`index.html`, "Credits") with the exact tool names you used for the image and the clips.
- The Magic Hour clips had a watermark that was cropped out. Check that your Magic Hour plan allows that, or re-export the clips without the watermark.
- Set `og:image` in `<head>` to the full URL of `assets/kiki.png` on your live site so link previews work.
- Test on a real phone.

## Credits

Kiki's world and story: Zia Vijay Prasad. Story artwork and illustration: AI-generated, edited and arranged by Zia (add the exact tool name in the footer Credits once confirmed). Animated clips: AI image-to-video by Magic Hour. Sound: synthesized live with the Web Audio API. Fonts: Bagel Fat One, Nunito, Silkscreen and Caveat (Google Fonts, SIL OFL). Code written with help from Claude, an AI coding assistant.
