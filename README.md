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

| Secret | Description | How to obtain |
|--------|-------------|---------------|
| `ALCHEMY_PASSWORD` | Encryption password for state | Generate a secure password: `openssl rand -base64 32` |
| `ALCHEMY_STATE_TOKEN` | State store authentication token | Generate with: `openssl rand -base64 32` |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token | [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens) > Create Token > "Edit Cloudflare Workers" template |
| `CLOUDFLARE_EMAIL` | Cloudflare account email | Your Cloudflare login email |

**Notes:**
- `ALCHEMY_PASSWORD` and `ALCHEMY_STATE_TOKEN` must remain consistent across all deployments
- Store these securely and never commit them to version control

## CI/CD

The GitHub Actions workflow automatically:

- Deploys to `prod` on push to `main`
- Creates `pr-<number>` preview environments for PRs
- Posts/updates a PR comment with the preview URL
- Destroys preview environments when PRs are closed
