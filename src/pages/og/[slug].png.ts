import type { APIRoute, GetStaticPaths } from 'astro';
import { allSouls } from '../../lib/site.js';
import { soulImage, homeImage, png } from '../../lib/og.js';

// Social preview images: /og/<slug>.png for each soul, /og/home.png for the homepage.
export const getStaticPaths = (() => [
  { params: { slug: 'home' }, props: { soul: null } },
  ...allSouls().map((soul) => ({ params: { slug: soul.slug }, props: { soul } })),
]) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const image = await png(props.soul ? soulImage(props.soul) : homeImage(allSouls()));
  return new Response(image, { headers: { 'Content-Type': 'image/png' } });
};
