# Kiki’s Loom Room

A cozy, interactive portfolio for Kiki, a baby Moon-Mouseling who spins fallen stars into glowing night blankets.

This project was created for the **Baby’s First Website 2026** hackathon. It combines storytelling, playful interactions, animation, sound, and responsive design in one small illustrated world.

## Preview

Open the live preview here:

[View Kiki’s Loom Room](https://8000-i5qdbkc2tppny31lgnup1-9b6a4f3a.sg2.manus.computer/)

## Features

- Interactive welcome screen with a quiet entry option
- Day and night themes
- Synthesized lullaby, crickets, birdsong, and interface sounds
- Mute controls, including the `M` keyboard shortcut
- Animated Kiki character with tilt and hover interactions
- Hidden character secrets and playful easter eggs
- Three interactive project toys:
  - Blanket Loom
  - Constellation Connect-the-Dots
  - Star-Tea Steeper
- Scroll-based story section with a moving needle and thread
- Yarn-ball playpen with simple physics
- Cloud-shaped wish form
- Responsive layouts for desktop and mobile screens
- Stardust cursor trails, glowing threads, bursts, and confetti
- Optional Wish Wall guestbook powered by Supabase

## Run locally

This is a plain HTML, CSS, and JavaScript project with no build step or framework required.

```bash
python3 -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000) in your browser.

A local server is recommended because some browser features do not work correctly when the page is opened directly with `file://`.

## Project structure

```text
.
├── index.html              # Main page and content
├── css/
│   └── styles.css          # Layout, themes, animations, and responsive styles
├── js/
│   ├── audio.js            # Web Audio sounds and mute controls
│   ├── contact.js           # Wish form behavior
│   ├── guestbook.js         # Optional Supabase Wish Wall
│   ├── hero.js              # Kiki interactions and secrets
│   ├── main.js              # Page initialization and shared behavior
│   ├── playpen.js           # Yarn-ball playpen interactions
│   ├── projects.js          # Interactive project toys
│   ├── responsive.js        # Responsive personality effects
│   ├── stardust.js          # Cursor trails and visual effects
│   ├── story.js              # Scroll story animation
│   └── theme.js              # Day/night theme switching
├── assets/                 # Illustrations, posters, and animation clips
└── supabase.sql            # Optional Wish Wall database setup
```

## Optional integrations

The project works without any external services. Two optional features can be enabled by adding configuration values in `index.html`:

### Wish form delivery

Create a form at [Formspree](https://formspree.io), then add your endpoint:

```html
<script>
  window.KIKI_FORM_ENDPOINT = 'https://formspree.io/f/yourFormId';
</script>
```

### Wish Wall guestbook

Create a free project at [Supabase](https://supabase.com), run the SQL in `supabase.sql`, and add the project URL and public anonymous key:

```html
<script>
  window.KIKI_GUESTBOOK = {
    url: 'https://your-project.supabase.co',
    anonKey: 'your-public-anon-key',
    table: 'guestbook'
  };
</script>
```

Do not add private service-role keys to the frontend.

## Hidden interactions

Kiki has a couple of secrets hidden in the page:

1. Click her scarf three times to unlock a special reaction.
2. Boop her nose four times quickly to make her curl into a yarn ball.

## Credits

- World and story: Zia Vijay Prasad
- Illustration: AI-generated artwork, cut out and edited for the project
- Animated clips: Image-to-video animation
- Sound: Synthesized live with the Web Audio API
- Fonts: Bagel Fat One, Nunito, and Silkscreen
- Code: HTML, CSS, and JavaScript

## License

This project was made for the Baby’s First Website 2026 hackathon. The original artwork, character, story, and project assets are not licensed for reuse without permission.
