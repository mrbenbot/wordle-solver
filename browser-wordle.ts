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
    // await this.screenshot(`./images/attempt-${attempt}`);
    return await this.getFeedback(guess, attempt);
  }

  async dispose() {
    await (await this.getPage()).browser().close();
  }

  async getFeedback(guess: string, attempt: number) {
    const page = await this.getPage();
    const elements = await page.evaluate(selectElements, attempt);
    return normaliseFeedback(
      guess,
      elements.map(({ _state }) => _state)
    );
  }

  async enterInfo(guess: string) {
    const page = await this.getPage();
    await page.type("body", guess);
    await page.keyboard.press("Enter");
    await wait(2000); // wait for animation to finish
  }

  async screenshot(fileName: string) {
    const page = await this.getPage();
    await page.screenshot({ path: `./images/${fileName}.png` });
  }

  async getPage(): Promise<Page> {
    if (!this.page) {
      this.page = await pageFactory();
    }
    return this.page;
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

function normaliseFeedback(
  guess: string,
  feedback: (Feedback | "tbd")[]
): Feedback[] {
  if (feedback.includes("tbd")) {
    throw Error(`"${guess}" not in word list`);
  }

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
  }) as Feedback[];
}

function selectElements(attempt: number) {
  return [
    ...(document
      ?.querySelector("body > game-app")
      ?.shadowRoot?.querySelector(`#board > game-row:nth-child(${attempt})`)
      ?.shadowRoot?.querySelectorAll("div > game-tile") ?? []),
  ] as any as { _state: Feedback }[];
}

async function pageFactory() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto("https://www.powerlanguage.co.uk/wordle/");

  await wait(1000); // wait for modal to load

  // click to get to game
  await page.mouse.move(0, 0);
  await page.mouse.down();
  await page.mouse.up();

  return page;
}
