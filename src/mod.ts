import { parseRawNumbers } from "./utils.ts";
import { PrCupWorker } from "./worker.ts";
import { ScoreManager } from "./scores.ts";
import GithubApi from "./GithubApi.ts";

const BASE_DIR = Deno.env.get("BASE_DIR");
const REPOSITORIES = Deno.env.get("REPOSITORIES");
const GH_TOKEN = Deno.env.get("GH_TOKEN");
const NUMBERS = Deno.env.get("NUMBERS") || "";

if (!BASE_DIR || !REPOSITORIES || !GH_TOKEN) {
  throw new Error(
    "Please set the BASE_DIR, REPOSITORIES and GH_TOKEN environment variable",
  );
}

const numbers = parseRawNumbers(NUMBERS);

for (const repository of REPOSITORIES.split(",")) {
  const scoreMgr = new ScoreManager(`${BASE_DIR}/data`, repository);
  const ghApi = new GithubApi(repository, GH_TOKEN);
  const worker = new PrCupWorker(numbers, scoreMgr, ghApi);
  await worker.run();
}
