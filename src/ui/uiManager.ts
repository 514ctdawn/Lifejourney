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
      { id: "I", label: "智力", value: snapshot.attributes.I },
      { id: "R", label: "體能", value: snapshot.attributes.R },
      { id: "A", label: "靈感", value: snapshot.attributes.A },
      { id: "L", label: "運氣", value: snapshot.attributes.L },
      { id: "money", label: "金錢", value: snapshot.lifeStatus.money },
      { id: "stress", label: "壓力", value: snapshot.lifeStatus.stress },
      { id: "happiness", label: "快樂", value: snapshot.lifeStatus.happiness },
      { id: "integrity", label: "誠信", value: snapshot.lifeStatus.integrity },
    ];
  }

  buildLifeWheel(segments = 6) {
    return Array.from({ length: segments }, (_, index) => ({
      id: `segment-${index + 1}`,
      label: `${index + 1}`,
    }));
  }
}
