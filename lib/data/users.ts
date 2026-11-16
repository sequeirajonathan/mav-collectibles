import "server-only";
import { z } from "zod";
import { prisma } from "@lib/prisma";
import { parseRole } from "@interfaces/roles";

const personSchema = z.object({
  id: z.uuid(),
  /** Full name when we have one, otherwise the username or the part of the email before the @. */
  name: z.string(),
  username: z.string().nullable(),
  email: z.string().nullable(),
  role: z.enum(["USER", "ADMIN", "STAFF", "EVENT", "PRINT_AGENT"]),
});
export type Person = z.infer<typeof personSchema>;

interface Row {
  id: string;
  email: string | null;
  role: string | null;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
}

function toPerson(row: Row): Person {
  const fullName = [row.first_name, row.last_name].filter(Boolean).join(" ");
  return personSchema.parse({
    id: row.id,
    name: fullName || row.username || row.email?.split("@")[0] || "Unnamed account",
    username: row.username,
    email: row.email,
    role: parseRole(row.role),
  });
}

/**
 * People with an account, for the role picker. With a query: matches any part
 * of the name, username or email, and falls back to close spellings. Without
 * one: the newest accounts.
 */
export async function searchPeople(query: string, limit = 8): Promise<Person[]> {
  const q = query.trim().toLowerCase();
  const rows = q
    ? await prisma.$queryRaw<Row[]>`
        with people as (
          select u.id, u.email, u.raw_app_meta_data->>'role' as role, p.username, p.first_name, p.last_name, u.created_at,
                 lower(concat_ws(' ', p.first_name, p.last_name, p.username, u.email)) as haystack
          from auth.users u left join public.profiles p on p.id = u.id
        )
        select id, email, role, username, first_name, last_name
        from people
        where haystack like '%' || ${q} || '%' or extensions.word_similarity(${q}, haystack) >= 0.45
        order by (haystack like '%' || ${q} || '%') desc, extensions.word_similarity(${q}, haystack) desc, created_at desc
        limit ${limit}`
    : await prisma.$queryRaw<Row[]>`
        select u.id, u.email, u.raw_app_meta_data->>'role' as role, p.username, p.first_name, p.last_name
        from auth.users u left join public.profiles p on p.id = u.id
        order by u.created_at desc
        limit ${limit}`;
  return rows.map(toPerson);
}

/** Everyone who currently has more than customer access. */
export async function listTeam(): Promise<Person[]> {
  const rows = await prisma.$queryRaw<Row[]>`
    select u.id, u.email, u.raw_app_meta_data->>'role' as role, p.username, p.first_name, p.last_name
    from auth.users u left join public.profiles p on p.id = u.id
    where u.raw_app_meta_data->>'role' in ('ADMIN', 'STAFF', 'EVENT', 'PRINT_AGENT')
    order by array_position(array['ADMIN', 'STAFF', 'EVENT', 'PRINT_AGENT'], u.raw_app_meta_data->>'role'), lower(coalesce(p.first_name, p.username, u.email))
    limit 200`;
  return rows.map(toPerson);
}
