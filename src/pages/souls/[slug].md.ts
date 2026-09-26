import type { APIRoute, GetStaticPaths } from 'astro';
import { SOUL_FILES } from '../../lib/souls.js';

// Every soul as plain markdown at /souls/<slug>.md, so people can hand the link straight to their agent.
export const getStaticPaths = (() =>
  Object.entries(SOUL_FILES).map(([slug, body]) => ({ params: { slug }, props: { body } }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) =>
  new Response(props.body as string, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
