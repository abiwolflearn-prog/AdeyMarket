import React from "react";
import { motion, useReducedMotion } from "motion/react";

export type AnimationType = "fade-up" | "fade-down" | "fade-left" | "fade-right" | "scale";

export interface ScrollRevealProps {
  children: React.ReactNode;
  type?: AnimationType;
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
  id?: string;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  type = "fade-up",
  delay = 0,
  duration = 0.4,
  className = "",
  once = true,
  id,
}) => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div id={id} className={className}>
        {children}
      </div>
    );
  }

  const getInitial = () => {
    switch (type) {
      case "fade-down":
        return { opacity: 0, y: -24 };
      case "fade-left":
        return { opacity: 0, x: -24 };
      case "fade-right":
        return { opacity: 0, x: 24 };
      case "scale":
        return { opacity: 0, scale: 0.96 };
      case "fade-up":
      default:
        return { opacity: 0, y: 24 };
    }
  };

  const getTarget = () => {
    switch (type) {
      case "scale":
        return { opacity: 1, scale: 1 };
      default:
        return { opacity: 1, x: 0, y: 0 };
    }
  };

  return (
    <motion.div
      id={id}
      initial={getInitial()}
      whileInView={getTarget()}
      viewport={{ once, margin: "-30px" }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1], // natural easeOut curve
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default ScrollReveal;
