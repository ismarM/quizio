import { expect, type Locator, type Page } from "@playwright/test";

export type QuestionInput = {
  text: string;
  points: string;
  answers: string[];
  /** Index of the correct answer. */
  correct: number;
};

/** Page object for the admin "Create quiz" form (/admin/quizzes/new). */
export class QuizForm {
  readonly title: Locator;
  readonly description: Locator;
  readonly category: Locator;
  readonly timeLimit: Locator;
  readonly questions: Locator;
  readonly save: Locator;
  readonly cancel: Locator;

  constructor(readonly page: Page) {
    this.title = page.getByPlaceholder("Example: Science Fundamentals");
    this.description = page.getByPlaceholder("Shortly explain what this quiz is about…");
    this.category = page.locator("select").first();
    this.timeLimit = page.getByPlaceholder("15", { exact: true });
    this.questions = page.locator("form article");
    this.save = page.getByRole("button", { name: "Save draft" });
    this.cancel = page.getByRole("link", { name: "Cancel" });
  }

  async open() {
    await this.page.goto("/admin/quizzes/new");
    await expect(this.page.getByRole("heading", { name: "Create quiz" })).toBeVisible();
  }

  question(index: number) {
    return this.questions.nth(index);
  }

  questionText(index: number) {
    return this.question(index).getByPlaceholder("Example: Which planet is known as the Red Planet?");
  }

  points(index: number) {
    return this.question(index).locator('input[type="number"]');
  }

  answers(index: number) {
    return this.question(index).getByPlaceholder(/^Answer \d+ text or image URL$/);
  }

  radios(index: number) {
    return this.question(index).getByRole("radio");
  }

  /** The "Add question" button in the questions toolbar (the first one in the DOM). */
  async addQuestion() {
    await this.page.getByRole("button", { name: "Add question" }).first().click();
  }

  async removeQuestion(index: number) {
    await this.question(index).getByRole("button", { name: "Remove" }).first().click();
  }

  async fillQuestion(index: number, input: QuestionInput) {
    await this.questionText(index).fill(input.text);
    await this.points(index).fill(input.points);

    while ((await this.answers(index).count()) < input.answers.length) {
      await this.question(index).getByRole("button", { name: "Add answer" }).click();
    }
    for (const [i, text] of input.answers.entries()) {
      await this.answers(index).nth(i).fill(text);
    }
    await this.radios(index).nth(input.correct).check();
  }

  /** Fills title, time limit and a single valid question. */
  async fillMinimal(title: string, timeLimit = "1") {
    await this.title.fill(title);
    await this.timeLimit.fill(timeLimit);
    await this.fillQuestion(0, { text: "2+2?", points: "1", answers: ["3", "4"], correct: 1 });
  }

  /** Clicks "Save draft" and returns the response of the create request. */
  async submit() {
    const [response] = await Promise.all([
      this.page.waitForResponse(
        (r) => new URL(r.url()).pathname === "/api/proxy/quizzes" && r.request().method() === "POST"
      ),
      this.save.click(),
    ]);
    return response;
  }

  /** Records POST requests to the create endpoint (to assert that none was sent). */
  trackCreateRequests() {
    const sent: string[] = [];
    this.page.on("request", (r) => {
      if (new URL(r.url()).pathname === "/api/proxy/quizzes" && r.method() === "POST") {
        sent.push(r.url());
      }
    });
    return sent;
  }
}
