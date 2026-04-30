import { parseRawNumbers } from "./utils.ts";
import { PrCupWorker } from "./worker.ts";
import { ScoreManager } from "./scores.ts";
import GithubApi from "./GithubApi.ts";

const SQLITE_PATH = Deno.env.get("SQLITE_PATH") || "./data/prcup.sqlite";
const REPOSITORIES = Deno.env.get("REPOSITORIES");
const GH_TOKEN = Deno.env.get("GH_TOKEN");

if (!REPOSITORIES || !GH_TOKEN) {
  throw new Error(
    "Please set the REPOSITORIES and GH_TOKEN environment variable",
  );
}

const NUMBERS = Deno.env.get("NUMBERS") || "";
const numbers = parseRawNumbers(NUMBERS);

for (const repository of REPOSITORIES.split(",")) {
  const trimmedRepository = repository.trim();

  if (!trimmedRepository) {
    continue;
  }

  // Remove slashes from repository name
  const sanitizedRepo = trimmedRepository.replaceAll(/[\/\\]/g, "-");

  try {
    const scoreMgr = new ScoreManager(SQLITE_PATH, sanitizedRepo);
    const ghApi = new GithubApi(trimmedRepository, GH_TOKEN);
    const worker = new PrCupWorker(sanitizedRepo, numbers, scoreMgr, ghApi);
    await worker.run();
  } catch (error) {
    console.error(
      `Something went wrong while working on repository ${trimmedRepository}. Error: `,
      error,
    );
  }
}
