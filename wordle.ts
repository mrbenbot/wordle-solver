import { readFileSync } from "fs";
import { Feedback } from "./wordle-solver";

export interface IWordle {
  attempt: (guess: string, num: number) => Promise<Feedback[]>;
  dispose: () => Promise<void>;
}

export class Wordle {
  word: string;

  constructor(word: string = "") {
    this.word = word;
  }

  async attempt(guess: string): Promise<Feedback[]> {
    return [...guess].map((letter, i) => {
      if (this.word[i] === letter) {
        return "correct";
      }

      if (this.word.includes(letter)) {
        return "present";
      }

      return "absent";
    });
  }
}
