# Alchemy DO Demo

A minimal Cloudflare Worker + Durable Object project using [Alchemy](https://alchemy.run).

## Features

- Counter Durable Object with increment/decrement endpoints
- PR preview deploys with stage naming (`pr-<number>`)
- GitHub PR comments with preview URLs
- Automatic cleanup when PRs are closed

## Local Setup

```bash
# Install dependencies
npm install

# Configure Alchemy (one-time)
npx alchemy configure
npx alchemy login

# Run local dev server
npm run dev

# Deploy to production
npm run deploy
```

## Endpoints

- `GET /` - Returns current count
- `GET /increment` - Increment and return count
- `GET /decrement` - Decrement and return count

## GitHub Secrets

Configure these in your repository settings (Settings > Secrets and variables > Actions):

| Secret | Description |
|--------|-------------|
| `ALCHEMY_PASSWORD` | Alchemy encryption password |
| `ALCHEMY_STATE_TOKEN` | Alchemy state store token |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token |
| `CLOUDFLARE_EMAIL` | Cloudflare account email |

## CI/CD

The GitHub Actions workflow automatically:

- Deploys to `prod` on push to `main`
- Creates `pr-<number>` preview environments for PRs
- Posts/updates a PR comment with the preview URL
- Destroys preview environments when PRs are closed
