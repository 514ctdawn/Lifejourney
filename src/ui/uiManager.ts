import { PlayerSnapshot } from "../engine/types";

export type UiMood = "normal" | "haggard" | "scandal";

export class UIManager {
  getMood(snapshot: PlayerSnapshot): UiMood {
    if (snapshot.scandal === "max" || snapshot.scandal === "warning") {
      return "scandal";
    }
    if (snapshot.haggard === "haggard") {
      return "haggard";
    }
    return "normal";
  }

  getHudBars(snapshot: PlayerSnapshot) {
    return [
      { id: "I", label: "Intelligence", value: snapshot.attributes.I },
      { id: "R", label: "Physical", value: snapshot.attributes.R },
      { id: "A", label: "Inspiration", value: snapshot.attributes.A },
      { id: "L", label: "Luck", value: snapshot.attributes.L },
      { id: "money", label: "Money", value: snapshot.lifeStatus.money },
      { id: "stress", label: "Stress", value: snapshot.lifeStatus.stress },
      { id: "happiness", label: "Happiness", value: snapshot.lifeStatus.happiness },
      { id: "integrity", label: "Integrity", value: snapshot.lifeStatus.integrity },
    ];
  }

  buildLifeWheel(segments = 6) {
    return Array.from({ length: segments }, (_, index) => ({
      id: `segment-${index + 1}`,
      label: `${index + 1}`,
    }));
  }
}
