/** The ARC palette: 0 black, 1 blue, 2 red, 3 green, 4 yellow, 6 magenta. */
export const ARC = { black: "#000000", blue: "#0074D9", red: "#FF4136", green: "#2ECC40", yellow: "#FFDC00", magenta: "#F012BE", grid: "#3a3a3a" };

/** A cell's colour by its age in generations: new yellow, then green, then blue, the old magenta. */
export const byAge = (age: number) => (age <= 1 ? ARC.yellow : age <= 4 ? ARC.green : age <= 24 ? ARC.blue : ARC.magenta);

