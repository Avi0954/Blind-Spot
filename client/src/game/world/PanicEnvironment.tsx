import { useEffect, useState } from "react";
import { PanicPhase } from "@blind-spot/shared";

export function PanicEnvironment({ room }: { room: any }) {
  const [phase, setPhase] = useState(room?.state?.panic?.phase || PanicPhase.IDLE);
  const [flicker, setFlicker] = useState(1);

  useEffect(() => {
    if (!room) return;
    const unsub = room.state.panic.listen("phase", (currentValue: string) => {
      setPhase(currentValue);
    });
    return () => unsub();
  }, [room]);

  useEffect(() => {
    if (phase === PanicPhase.WARNING) {
      const interval = setInterval(() => {
        setFlicker(Math.random() > 0.8 ? 0.5 : 1);
      }, 200);
      return () => clearInterval(interval);
    } else if (phase === PanicPhase.UNSTABLE) {
      const interval = setInterval(() => {
        setFlicker(Math.random() > 0.6 ? 0.3 : 1);
      }, 100);
      return () => clearInterval(interval);
    } else if (phase === PanicPhase.EMERGENCY || phase === PanicPhase.FAILURE) {
      const interval = setInterval(() => {
        // Red flashing effect
        setFlicker(Math.sin(Date.now() / 200) * 0.5 + 0.5);
      }, 50);
      return () => clearInterval(interval);
    } else {
      setFlicker(1);
    }
  }, [phase]);

  const getLightProps = () => {
    if (phase === PanicPhase.EMERGENCY || phase === PanicPhase.FAILURE) {
      return { color: "#ff0000", intensity: 1.0 * flicker, ambient: 0.05 };
    } else if (phase === PanicPhase.UNSTABLE) {
      return { color: "#ff8800", intensity: 1.2 * flicker, ambient: 0.1 };
    } else if (phase === PanicPhase.WARNING) {
      return { color: "#fff1e0", intensity: 1.3 * flicker, ambient: 0.12 };
    }
    return { color: "#fff1e0", intensity: 1.5, ambient: 0.15 };
  };

  const props = getLightProps();

  return (
    <>
      <pointLight position={[0, 3.5, 0]} intensity={props.intensity} color={props.color} castShadow distance={15} decay={2} />
      <ambientLight intensity={props.ambient} />
    </>
  );
}
