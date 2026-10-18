# Kiki's Loom Room

A cozy, interactive portfolio for **Kiki**, a baby Moon-Mouseling who spins fallen stars into glowing night-blankets.
Built for the haX **Baby's First Website** hackathon, Track 2 (Your Own Baby).

Plain HTML, CSS and JavaScript. No framework, no build step, no dependencies, so it deploys anywhere in seconds.

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

### The secrets

1. Click Kiki's **scarf** three times. She says two things, then the star knot comes loose and she sneezes shooting stars.
2. **Boop her nose** four times fast. She curls into a yarn ball.

## Turn on the two optional extras

Both are off until you fill in a value in `index.html`, and neither shows a broken UI while off.

**1. Wishes in your inbox (cloud form).** Create a free form at https://formspree.io, then set:

```html
<script>window.KIKI_FORM_ENDPOINT = 'https://formspree.io/f/yourFormId';</script>
```

Until you do, the form works and shows its success screen, but nothing is delivered anywhere.

**2. The Wish Wall (live guestbook, +2 side quest).**

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

Kiki's world and story: Zia Vijay Prasad. Illustration: AI-generated, cut out and edited by Zia. Animated clips: AI image-to-video by Magic Hour. Sound: synthesized live with the Web Audio API. Fonts: Bagel Fat One, Nunito and Silkscreen (Google Fonts, SIL OFL). Code written with help from Claude, an AI coding assistant.
