import React, { useState } from "react";
import type { IntroProfile } from "./engine/types";
import { IntroModule } from "./ui/components/IntroModule";
import { GameScreen } from "./ui/components/GameScreen";
import "./ui/styles.css";

export default function App() {
  const [introComplete, setIntroComplete] = useState(false);
  const [profile, setProfile] = useState<IntroProfile | null>(null);

  if (!introComplete) {
    return (
      <IntroModule
        onComplete={(p) => {
          setProfile(p);
          setIntroComplete(true);
        }}
      />
    );
  }

  return <GameScreen profile={profile ?? undefined} />;
}
