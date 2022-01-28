// import { Wordle } from "./wordle";
import { BrowserWordle as Wordle } from "./browser-wordle";
import { WordleSolver } from "./wordle-solver";

async function playWordle() {
  const wordle = new Wordle();

  const solver = new WordleSolver(wordle);

  const hasSolved = await solver.solve();

  console.log(hasSolved ? "SOLVED 🎉" : "NOT SOLVED 🥲");
  console.log(solver.attempts.join(" => "));
}

playWordle();
