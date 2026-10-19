# Kiki’s Loom Room

Hi, I’m Zia. I made this site for haX.baby’s **Baby’s First Website** hackathon (Track 2: Your Own Baby).

Kiki is a baby Moon-Mouseling and an apprentice Starlight Weaver. She lives in a teacup with velvet moss, collects fallen stars, and turns them into blankets for sleepy creatures. This is her little corner of the internet: you can meet her, see what she makes, follow her story, and wander around her loom room. It’s a portfolio with things to poke at, not a browser game.

## Run it

There’s no build step. From this folder, start any static server:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>. Don’t open `index.html` directly; a few browser features need the site to be served over HTTP.

The site is plain HTML, CSS and JavaScript. Three.js is included in `js/vendor/` and only loads when you enter the 3D Loom Room.

## Have a look around

- In **My stuff**, try the Blanket Loom, connect the stars, or make some star-tea.
- The **story** has five illustrated scenes. Scroll through it, or tap a scene to hear Kiki’s thoughts.
- Step into the **Loom Room** to look around and click the things on her workbench. If 3D isn’t available, there’s a picture instead.
- Pull the yarn or roll it around the playpen and see if Kiki follows.
- You can talk to Kiki, check her little work list, or stay for bedtime.

A couple of things are hidden: tap Kiki’s scarf three times, or boop her nose four times quickly.

## A few details

The sound is made in the browser with the Web Audio API. Use the Sound button—or press `M`—to mute it. The day/night theme follows your local clock the first time you visit; after that, your choice is remembered in this browser.

The visit count, secrets, chat name and cozy progress are also stored in this browser. They aren’t shared between visitors. Kiki’s chat is written by hand; it doesn’t call an AI service or send what you type anywhere.

The wish form doesn’t send anything until you add a Formspree endpoint. The guestbook stays hidden until you connect a Supabase project. Both are optional; the page works without them.

## If you want to turn on the extras

### Send wishes to an inbox

Create a form at <https://formspree.io>, then put its endpoint in `index.html`:

```html
<script>window.KIKI_FORM_ENDPOINT = 'https://formspree.io/f/yourFormId';</script>
```

Without an endpoint, the page tells visitors their wish wasn’t sent.

### Show the Wish Wall

1. Create a project at <https://supabase.com>.
2. Run `supabase.sql` in its SQL editor.
3. Copy the project URL and **anon public** key from Project Settings → API into `index.html`:

```html
<script>window.KIKI_GUESTBOOK = { url: 'https://xxxx.supabase.co', anonKey: 'your-anon-public-key', table: 'guestbook' };</script>
```

The guestbook limits messages to 140 characters and applies a 30-second cooldown. They’re displayed as text. You can remove a message from the Supabase table if needed.

## Before you submit

- Make sure the credits in the footer match the tools used for the art and clips.
- The Magic Hour clips had a watermark cropped out. Check that your plan allows this, or export the clips again without it.
- Use the full deployed URL for `og:image` so link previews can find Kiki’s picture.
- Try the site on a real phone, especially the Loom Room.

## Credits

Kiki’s world and story are by Zia Vijay Prasad. The illustrations were generated with ChatGPT, then edited and arranged by Zia. The animated clips were made with Magic Hour and trimmed by Zia. The sound is synthesized in the browser. The site uses Three.js (MIT) and the Bagel Fat One, Nunito, Silkscreen and Caveat fonts from Google Fonts (SIL Open Font License). Code was written with help from Claude.
