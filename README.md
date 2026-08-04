# omni-vision-pro ... product website

Official marketing site for [omni-vision-pro](https://www.npmjs.com/package/omni-vision-pro) ... the production-grade MCP server that gives text-only AI models (DeepSeek, Codex, OpenCode, Claude, VS Code) eyes for screenshots, code context, and safe ZIP inspection.

## Pages

- `/` ... home
- `/features` ... MCP tools & capabilities
- `/providers` ... vision providers & modes
- `/setup` ... one-click setup & command reference
- `/docs` ... manual setup per client & troubleshooting
- `/privacy` ... privacy, safeguards & settings

## Stack

Pure static site ... HTML + CSS + vanilla JS. No build step, no framework, no dependencies.

## Security

Served over HTTPS with strict security headers: Content-Security-Policy, HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, cross-origin isolation. Clean URLs with no file extensions. Custom 404 page.

## Local development

```bash
npx serve .
```

## Deploy

One-click on Vercel ... zero config, `vercel.json` included.

## License

MIT
