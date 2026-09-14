import React from "react";
import { motion, useReducedMotion, HTMLMotionProps, TargetAndTransition } from "motion/react";

export interface AnimatedCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  lift?: boolean;
  scaleHover?: boolean;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  className = "",
  lift = true,
  scaleHover = false,
  ...props
}) => {
  const shouldReduceMotion = useReducedMotion();

  const hoverMotion: TargetAndTransition | undefined = shouldReduceMotion || !lift
    ? undefined
    : {
        y: -4,
        scale: scaleHover ? 1.01 : 1,
        transition: { duration: 0.22, ease: "easeOut" },
      };

  const tapMotion: TargetAndTransition | undefined = shouldReduceMotion
    ? undefined
    : { scale: 0.99, transition: { duration: 0.1 } };

  return (
    <motion.div
      whileHover={hoverMotion}
      whileTap={tapMotion}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedCard;
