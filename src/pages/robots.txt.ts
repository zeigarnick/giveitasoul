import type { APIRoute } from 'astro';
import { absolute } from '../lib/site.js';

// Everyone is welcome, AI crawlers included: the souls are meant to be read by agents.
export const GET: APIRoute = () => {
  const body = `User-agent: *
Allow: /

# AI agents: start at ${absolute('/llms.txt')}
User-agent: GPTBot
User-agent: OAI-SearchBot
User-agent: ChatGPT-User
User-agent: ClaudeBot
User-agent: Claude-User
User-agent: Claude-SearchBot
User-agent: PerplexityBot
User-agent: Google-Extended
Allow: /

Sitemap: ${absolute('/sitemap.xml')}
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
