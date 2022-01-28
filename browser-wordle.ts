import puppeteer, { Page } from "puppeteer";
import { IWordle } from "./wordle";
import { Feedback } from "./wordle-solver";

export class BrowserWordle implements IWordle {
  page: Page | null;

  constructor() {
    this.page = null;
  }

  async attempt(guess: string, attempt: number): Promise<Feedback[]> {
    await this.enterInfo(guess);
    await this.screenshot(`has-typed-attempt${attempt}`);
    const feedback = await this.getFeedback(guess, attempt);

    const isWordNotInList = feedback.includes("tbd");

    if (isWordNotInList) {
      throw Error(`${attempt} not in word list`);
    }

    return feedback;
  }

  async dispose() {
    await (await this.getPage()).browser().close();
  }

  async getFeedbackForAttempt(attempt: number) {
    const page = await this.getPage();

    const elements = await page.evaluate((attempt) => {
      return [
        ...(document
          ?.querySelector("body > game-app")
          ?.shadowRoot?.querySelector(`#board > game-row:nth-child(${attempt})`)
          ?.shadowRoot?.querySelectorAll("div > game-tile") ?? []),
      ] as any as { _state: Feedback }[];
    }, attempt);

    return elements.map(({ _state }) => _state);
  }

  async getFeedback(guess: string, attempt: number) {
    const feedback = await this.getFeedbackForAttempt(attempt);
    return normaliseFeedback(guess, feedback);
  }

  async enterInfo(guess: string) {
    const page = await this.getPage();
    await page.type("body", guess);
    await page.keyboard.press("Enter");
    await wait(2000); // wait for animation to finish
  }
  async screenshot(fileName: string) {
    const page = await this.getPage();
    await page.screenshot({ path: `${fileName}.png` });
  }

  async getPage(): Promise<Page> {
    if (this.page) {
      return this.page;
    }

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto("https://www.powerlanguage.co.uk/wordle/");

    await wait(1000); // wait for modal to load

    // click to get to game
    await page.mouse.move(0, 0);
    await page.mouse.down();
    await page.mouse.up();

    this.page = page;
    return page;
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

function normaliseFeedback(guess: string, feedback: Feedback[]) {
  return feedback.map((fb, i) => {
    const feedbackForLettersOfType = feedback.filter(
      (_, j) => guess[j] === guess[i]
    );

    if (
      fb === "absent" &&
      ["present", "correct"].some((presentOrCorrect) =>
        feedbackForLettersOfType.includes(presentOrCorrect as Feedback)
      )
    ) {
      return "present";
    }
    return fb;
  });
}
