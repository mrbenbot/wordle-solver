import { readFileSync } from "fs";
import { IWordle } from "./wordle";

const allWords = readFileSync("./words.txt", "utf-8").split(`\n`);

export type Feedback = "absent" | "present" | "correct" | "tbd";
export type Condition = (
  letter: string,
  i: number
) => (word: string) => boolean;

export const cases: {
  [key in Feedback]: Condition;
} = {
  correct: (a, i) => (b) => a === b[i],
  present: presentChecker(),
  absent: absentChecker(),
  tbd: (a, i) => (b) => a !== b[i],
};

function absentChecker(): Condition {
  const badLetters: string[] = [];
  return (letter: string) => {
    badLetters.push(letter);
    return (potentialWord: string) => {
      return !badLetters.some((letter) => potentialWord.includes(letter));
    };
  };
}

function presentChecker(): Condition {
  const lettersNotAtIndex: string[][] = [[], [], [], [], []];
  return (letter, i) => {
    lettersNotAtIndex[i].push(letter);
    return (potentialWord) => {
      return (
        potentialWord.includes(letter) &&
        !lettersNotAtIndex[i].includes(potentialWord[i])
      );
    };
  };
}

export const emojiMapCustom: { [key in Feedback]: string } = {
  correct: "✅",
  present: "🔥",
  absent: "❌",
  tbd: "🤷‍♂️",
};
export const emojiMap: { [key in Feedback]: string } = {
  correct: "🟩",
  present: "🟨",
  absent: "⬜",
  tbd: "🤷‍♂️",
};

const firstWordOptions = allWords.filter((word) =>
  [...word].every((letter, i) => word.indexOf(letter) === i)
);

export class WordleSolver {
  wordle: IWordle;
  attempts: string[] = [
    firstWordOptions[Math.floor(Math.random() * firstWordOptions.length)],
  ];
  constructor(wordle: IWordle) {
    this.wordle = wordle;
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

      const conditions = feedback.map((result: Feedback, i) => {
        return cases[result](attempt[i], i);
      });

      const nextAttempt = this.getNextAttempt(conditions);

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
      const meetsAllFeedbackConditions = conditions.every((condition) =>
        condition(nextAttempt)
      );

      return meetsAllFeedbackConditions;
    });
  }
}

function emojify(feedback: Feedback[]) {
  return feedback.map((fb: Feedback) => emojiMap[fb]).join("");
}

/*
Wordle 222 1/6

🟩🟩🟩🟩🟩
*/
