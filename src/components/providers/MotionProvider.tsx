"use client";
import { MotionConfig, useReducedMotion } from "framer-motion";

export default function MotionProvider({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  
  return (
    <MotionConfig reducedMotion={reduced ? "always" : "never"}>
      {children}
    </MotionConfig>
  );
}
