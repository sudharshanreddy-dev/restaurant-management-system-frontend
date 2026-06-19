import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export function AnimatedCounter({
  value,
  duration = 1,
  prefix = "",
  suffix = "",
  decimals = 0,
}: AnimatedCounterProps) {
  const [isInView, setIsInView] = useState(false);
  const spring = useSpring(0, { duration: duration * 1000 });
  const display = useTransform(spring, (current) =>
    prefix + current.toFixed(decimals) + suffix
  );

  useEffect(() => {
    if (isInView) {
      spring.set(value);
    }
  }, [spring, value, isInView]);

  return (
    <motion.span
      onViewportEnter={() => setIsInView(true)}
      viewport={{ once: true }}
    >
      {display}
    </motion.span>
  );
}
