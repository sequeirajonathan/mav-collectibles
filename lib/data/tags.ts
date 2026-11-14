/** Cache tags for `use cache` data. Mutations call updateTag() with these. */
export const tags = {
  flags: "flags",
  banner: "banner",
  media: "media",
  installers: "installers",
  games: "games",
  events: "events",
  event: (slug: string) => `event:${slug}`,
  posts: "posts",
  post: (id: string) => `post:${id}`,
  vendors: "vendors",
  leaderboard: "leaderboard",
  catalog: "catalog",
} as const;
