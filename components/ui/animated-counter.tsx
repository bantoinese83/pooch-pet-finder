import { motion } from "framer-motion"
import React from "react"

export function AnimatedCounter({ value, className = "" }: { value: number, className?: string }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      key={value}
      className={className + " inline-block"}
    >
      {value}
    </motion.span>
  )
} 