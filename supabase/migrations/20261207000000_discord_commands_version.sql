-- Which set of slash commands Discord was last told about, so Admin can say
-- when the bot has new commands that still need registering.
alter table public.discord_settings add column commands_version text;
