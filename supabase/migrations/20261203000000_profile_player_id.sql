-- A player's Play! Pokémon ID, saved once on their profile and filled in for
-- them when an event asks for it. Written only by the server.
alter table public.profiles
  add column pokemon_player_id text,
  add constraint profiles_pokemon_player_id_digits check (pokemon_player_id is null or pokemon_player_id ~ '^[0-9]{1,12}$');
