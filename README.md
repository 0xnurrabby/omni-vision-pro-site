# omni-vision-pro website

The official product and setup website for [omni-vision-pro](https://github.com/0xnurrabby/omni-vision-pro), an open-source MCP server that gives text-only AI models reliable image, code, and ZIP context.

**Live site:** https://omni-vision-pro-site.vercel.app

## Highlights

- Command-first hero with a live animated terminal demo
- Dark "deep space" theme with original brand gradient (blue → violet → teal)
- Full capability bento grid: attachment recovery, vision routing, ordered batches, code context, safe ZIP inspection, local measurements
- Animated context pipeline: prepare → route (Gemini / OpenAI / OCR) → structured output
- One-click setup front and center with copy buttons everywhere
- Interactive setup docs with per-client manual guides (Codex, OpenCode, Claude Code, Cursor, VS Code, Claude Desktop)
- Provider routing docs: terminal menu, clipboard import, and manual `.env`
- Privacy section, FAQ accordion, and open-source call to action
- Scroll reveals, animated counters, marquee, cursor glow, and reduced-motion support
- Dependency-free HTML, CSS, and JavaScript

## Preview locally

Open a terminal in this folder and run:

```
python -m http.server 4173
```

Then visit http://localhost:4173.

## Deploy

Zero-build static deployment on Vercel. Import the repository or run:

```
vercel --prod
```

## Project structure

```
.
├── assets/
│   ├── favicon.svg
│   └── social-card.png
├── index.html
├── styles.css
├── script.js
├── site.webmanifest
├── robots.txt
├── sitemap.xml
└── vercel.json
```

## License

MIT. The omni-vision-pro name and product copy refer to the linked open-source package.
