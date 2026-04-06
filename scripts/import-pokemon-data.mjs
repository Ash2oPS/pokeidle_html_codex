import {
  generatedCanonLocationsPath,
  generatedEncounterTablesPath,
  generatedFormsPath,
  generatedGymsPath,
  generatedSpeciesPath,
  writeJson,
} from "./lib/canon-shared.mjs";
import { importPokemonCanonData } from "./lib/import-pokemon-canon.mjs";
import { importSinnohCanonData } from "./lib/import-sinnoh-canon.mjs";

async function main() {
  const pokemonCanonData = await importPokemonCanonData();
  const sinnohCanonData = await importSinnohCanonData(pokemonCanonData);

  await Promise.all([
    writeJson(generatedSpeciesPath, pokemonCanonData.species),
    writeJson(generatedFormsPath, pokemonCanonData.forms),
    writeJson(generatedCanonLocationsPath, sinnohCanonData.canonLocations),
    writeJson(generatedEncounterTablesPath, sinnohCanonData.encounterTables),
    writeJson(generatedGymsPath, sinnohCanonData.gyms),
  ]);

  console.log(`Generated ${pokemonCanonData.species.length} species -> ${generatedSpeciesPath}`);
  console.log(`Generated ${pokemonCanonData.forms.length} forms -> ${generatedFormsPath}`);
  console.log(`Generated ${sinnohCanonData.canonLocations.length} Sinnoh locations -> ${generatedCanonLocationsPath}`);
  console.log(
    `Generated ${sinnohCanonData.encounterTables.length} Sinnoh encounter tables -> ${generatedEncounterTablesPath}`,
  );
  console.log(`Generated ${sinnohCanonData.gyms.length} Sinnoh gyms -> ${generatedGymsPath}`);
}

await main();
