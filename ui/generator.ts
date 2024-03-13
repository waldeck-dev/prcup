import { nunjucks, path } from "../dep.ts";
import { UserScores } from "../src/types.ts";

const BASE_DIR = path.join(Deno.cwd(), "ui");
const TEMPLATE_DIR = path.join(BASE_DIR, "templates");
const OUTPUT_DIR = path.join(BASE_DIR, "out");

type TEMPLATES = "scores.njk";

type GeneratorData = { nextTarget: number | null; rankedScores: UserScores };

export class PageGenerator {
  constructor(
    private repository: string,
    private templateDir: string = TEMPLATE_DIR,
    private outDir: string = OUTPUT_DIR,
  ) {
  }

  private writePage(filePath: string, content: string) {
    Deno.writeTextFileSync(filePath, content);
  }

  public generatePage(
    template: TEMPLATES,
    data: GeneratorData,
  ) {
    const renderedTemplate = nunjucks.render(
      path.join(this.templateDir, template),
      { ...data, rankedScores: this.prepareScoreData(data.rankedScores) },
    );
    this.writePage(
      path.join(this.outDir, `${this.repository}.html`),
      renderedTemplate,
    );
    console.info(
      `Generated template "${template}" for repository "${this.repository}"`,
    );
  }

  private prepareScoreData(data: UserScores) {
    const newData: UserScores = new Map();

    for (const [position, items] of data.entries()) {
      const newItems = [];

      for (const item of items) {
        newItems.push({
          user: item.user,
          emoji: this.getEmoji(position),
          totalScore: item.scores.reduce((sum, score) => sum + score.score, 0),
          scores: item.scores,
        });
      }

      newData.set(position, newItems);
    }

    return newData;
  }

  private getEmoji(position: number): string | null {
    switch (position) {
      case 1:
        return "🏆";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return null;
    }
  }
}
