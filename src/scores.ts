import type { Score } from "./types.ts";

export class ScoreManager {
  private scores: Score[];
  private filename: string;
  private filepath: string;

  constructor(private dataDirectory: string, private repository: string) {
    this.filename = `${
      this.repository.replaceAll("/", "-").toLowerCase()
    }.json`;
    this.filepath = `${this.dataDirectory}/${this.filename}`;
    this.scores = this.readScores();
  }

  private readScores(): Score[] {
    let data: string;

    try {
      data = Deno.readTextFileSync(this.filepath);
    } catch (_err) {
      data = "[]";
      Deno.writeTextFileSync(this.filepath, JSON.stringify(data));
    }

    return JSON.parse(data);
  }

  public writeScores(): void {
    Deno.writeTextFileSync(this.filepath, JSON.stringify(this.scores, null, 2));
  }

  public getScores(): Score[] {
    return this.scores;
  }

  public getScoreByNumber(number: number): Score | undefined {
    return this.getScores().find((s) => s.number === number);
  }

  public addScore(score: Score): void {
    console.log("Adding score", score);
    this.scores.push(score);
  }

  public updateScore(score: Score): void {
    const oldScore = this.getScoreByNumber(score.number);
    if (!oldScore) {
      console.warn(`Item #${score.number} does not exists in Scores.`);
      return;
    }
    Object.assign(oldScore, score);
  }

  public scoreExistsForItem(number: number): boolean {
    for (const score of this.scores) {
      if (score.number === number) {
        return true;
      }
    }
    return false;
  }
}
