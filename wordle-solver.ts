import { readFileSync } from "fs";
import { IWordle } from "./wordle";

const allWords = readFileSync("./words.txt", "utf-8").split(`\n`);

export type Feedback = "absent" | "present" | "correct";
export type Condition = (
  letter: string,
  i: number
) => (word: string) => boolean;

export const conditionMap: {
  [key in Feedback]: Condition;
} = {
  correct: (letter, i) => (word) => letter === word[i],
  present: (letter, i) => (word) => word.includes(letter) && letter !== word[i],
  absent: (letter) => (word) => !word.includes(letter),
};

export const emojiMap: { [key in Feedback]: string } = {
  correct: "🟩",
  present: "🟨",
  absent: "⬜",
};

function getFirstWord() {
  const firstWordOptions = allWords.filter((word) =>
    [...word].every((letter, i) => word.indexOf(letter) === i)
  );
  return firstWordOptions[Math.floor(Math.random() * firstWordOptions.length)];
}

export class WordleSolver {
  wordle: IWordle;
  attempts: string[];
  conditions: ((word: string) => boolean)[];
  constructor(wordle: IWordle) {
    this.wordle = wordle;
    this.attempts = [getFirstWord()];
    this.conditions = [];
  }

  async solve(): Promise<boolean> {
    try {
      const attempt = this.attempts[this.attempts.length - 1];

      const feedback = await this.wordle.attempt(attempt, this.attempts.length);

      console.log(`${emojify(feedback)}`);

      if (feedback.every((letterFeeback) => letterFeeback === "correct")) {
        await this.wordle.dispose();
        return true;
      }

      this.conditions.push(
        ...feedback.map((result: Feedback, i) => {
          return conditionMap[result](attempt[i], i);
        })
      );

      const nextAttempt = this.getNextAttempt(this.conditions);

      if (nextAttempt) {
        if (this.attempts.length > 5) {
          throw new Error(`-- max attempts reached --`);
        }
        this.attempts.push(nextAttempt);
        return this.solve();
      }

      throw new Error("could not find a word to match conditions");
    } catch (err: any) {
      console.log(err.message);
      await this.wordle.dispose();
      return false;
    }
  }

  getNextAttempt(conditions: ((word: string) => boolean)[]) {
    return allWords.find((nextAttempt) => {
      return conditions.every((condition) => condition(nextAttempt));
    });
  }
}

function emojify(feedback: Feedback[]) {
  return feedback.map((fb: Feedback) => emojiMap[fb]).join("");
}
