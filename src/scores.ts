import type { Score } from "./types.ts";

export class ScoreManager {
  private scores: Score[];

  constructor(private filepath: string) {
    this.scores = this.readScores();
  }

  private readScores(): Score[] {
    const data = Deno.readTextFileSync(this.filepath);
    return JSON.parse(data);
  }

  private writeScores(scores: Score[]): void {
    Deno.writeTextFileSync(this.filepath, JSON.stringify(scores));
  }

  public getScores(): Score[] {
    return this.scores;
  }

  public addScore(score: Score): void {
    const newScores = this.getScores();
    newScores.push(score);
    this.writeScores(newScores);
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
