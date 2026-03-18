export const MEWTWO_RENAME_EASTER_EGG_SOURCE_POKEMON_ID = 150;
export const LUGIA_RENAME_EASTER_EGG_UNLOCK_POKEMON_ID = 249;
export const MEWTWO_RENAME_EASTER_EGG_REQUIRED_NICKNAME = "Armand";

export function shouldUnlockLugiaShinyFromMewtwoRename({
  pokemonId,
  nickname,
  changed = true,
  alreadyUnlocked = false,
} = {}) {
  const sourcePokemonId = Number(pokemonId || 0);
  if (
    sourcePokemonId !== MEWTWO_RENAME_EASTER_EGG_SOURCE_POKEMON_ID
    || !changed
    || alreadyUnlocked
  ) {
    return false;
  }

  return String(nickname || "").trim() === MEWTWO_RENAME_EASTER_EGG_REQUIRED_NICKNAME;
}
