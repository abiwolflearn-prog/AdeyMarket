import React from "react";
import { motion, useReducedMotion, HTMLMotionProps, TargetAndTransition } from "motion/react";

export interface AnimatedButtonProps extends HTMLMotionProps<"button"> {
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "ghost";
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  className = "",
  variant = "primary",
  disabled,
  ...props
}) => {
  const shouldReduceMotion = useReducedMotion();

  const hoverMotion: TargetAndTransition | undefined = shouldReduceMotion || disabled
    ? undefined
    : variant === "primary"
    ? { y: -1, transition: { duration: 0.15, ease: "easeOut" } }
    : { transition: { duration: 0.15 } };

  const tapMotion: TargetAndTransition | undefined = shouldReduceMotion || disabled
    ? undefined
    : { scale: 0.96, transition: { duration: 0.1, ease: "easeInOut" } };

  return (
    <motion.button
      disabled={disabled}
      whileHover={hoverMotion}
      whileTap={tapMotion}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export default AnimatedButton;
