This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## AI Provider Setup

The application supports multiple AI providers for field extraction. You'll need to add API keys to your `.env.local` file:

### Required API Keys

Create a `.env.local` file in the root directory with the following keys:

```bash
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Providers (at least one required)
# OpenAI - https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-...

# Anthropic - https://console.anthropic.com/settings/keys
ANTHROPIC_API_KEY=sk-ant-...

# OpenRouter - https://openrouter.ai/keys
OPENROUTER_API_KEY=sk-or-...

# LlamaParse (optional, for PDF extraction) - https://cloud.llamaindex.ai/api-key
LLAMA_CLOUD_API_KEY=llx-...

# Optional: Your app URL (for OpenRouter referer)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Supported Models via OpenRouter

OpenRouter provides access to many models including:
- Claude 3.5 Sonnet (latest)
- GPT-4 Turbo
- Gemini 1.5 Pro
- Llama 3.1 (70B and 8B)
- Mistral Large
- DeepSeek Chat

You only need an OpenRouter API key to access all these models.
