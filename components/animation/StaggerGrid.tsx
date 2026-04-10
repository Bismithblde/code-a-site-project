"use client";

import { motion } from "motion/react";
import { type ReactNode, Children } from "react";

interface StaggerGridProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

const container = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

export function StaggerGrid({
  children,
  className,
  staggerDelay,
}: StaggerGridProps) {
  const containerVariants = staggerDelay
    ? {
        ...container,
        visible: {
          transition: { staggerChildren: staggerDelay },
        },
      }
    : container;

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
    >
      {Children.map(children, (child) => (
        <motion.div variants={item}>{child}</motion.div>
      ))}
    </motion.div>
  );
}
