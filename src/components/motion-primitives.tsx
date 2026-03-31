"use client"

import { useRef, useState, useEffect } from "react"
import { motion, useInView, useSpring, AnimatePresence } from "motion/react"
import type { ReactNode } from "react"

// ─── Shared easing ───────────────────────────────────────────
const ease: [number, number, number, number] = [0.16, 1, 0.3, 1]

// ─── FadeIn ──────────────────────────────────────────────────
// Fades in + translates from a direction. Default: rises up.
export function FadeIn({
  children,
  delay = 0,
  duration = 0.6,
  direction = "up",
  distance = 24,
  once = true,
  className = "",
}: {
  children: ReactNode
  delay?: number
  duration?: number
  direction?: "up" | "down" | "left" | "right" | "none"
  distance?: number
  once?: boolean
  className?: string
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once, margin: "-40px" })

  const offsets = {
    up: { y: distance, x: 0 },
    down: { y: -distance, x: 0 },
    left: { x: -distance, y: 0 },
    right: { x: distance, y: 0 },
    none: { x: 0, y: 0 },
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...offsets[direction] }}
      animate={inView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ duration, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── ScaleIn ─────────────────────────────────────────────────
// Pops in with scale + optional spring bounce. Great for badges.
export function ScaleIn({
  children,
  delay = 0,
  className = "",
  spring = false,
}: {
  children: ReactNode
  delay?: number
  className?: string
  spring?: boolean
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-40px" })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={
        spring
          ? { type: "spring", stiffness: 200, damping: 15, delay }
          : { duration: 0.5, delay, ease }
      }
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── SlideIn ─────────────────────────────────────────────────
export function SlideIn({
  children,
  from = "left",
  delay = 0,
  className = "",
}: {
  children: ReactNode
  from?: "left" | "right"
  delay?: number
  className?: string
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-40px" })
  const x = from === "left" ? -30 : 30

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── StaggerList ─────────────────────────────────────────────
// Staggers children entrance. Wrap direct children in motion.div.
export function StaggerList({
  children,
  stagger = 0.08,
  className = "",
}: {
  children: ReactNode
  stagger?: number
  className?: string
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-40px" })

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease },
  },
}

export const staggerScaleItem = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease },
  },
}

// ─── AnimatedNumber ──────────────────────────────────────────
// Spring-based countup. Extracted from landing page pattern.
export function AnimatedNumber({
  value,
  suffix = "",
  className = "",
}: {
  value: number
  suffix?: string
  className?: string
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-50px" })
  const spring = useSpring(0, { stiffness: 60, damping: 20 })

  const [display, setDisplay] = useState("0")

  useEffect(() => {
    if (inView) spring.set(value)
  }, [inView, spring, value])

  useEffect(() => {
    const unsub = spring.on("change", (v: number) => {
      setDisplay(Math.round(v).toString())
    })
    return unsub
  }, [spring])

  return (
    <span ref={ref} className={className}>
      {display}
      {suffix}
    </span>
  )
}

// ─── ProgressRing ────────────────────────────────────────────
// SVG circular progress indicator. Fills clockwise from top.
export function ProgressRing({
  progress,
  size = 64,
  strokeWidth = 5,
  trackColor = "#e5e7eb",
  fillColor = "#10b981",
  className = "",
  children,
}: {
  progress: number // 0–100
  size?: number
  strokeWidth?: number
  trackColor?: string
  fillColor?: string
  className?: string
  children?: ReactNode
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(progress, 100) / 100) * circumference

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={fillColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  )
}

// ─── PageTransition ──────────────────────────────────────────
// Wraps page content with a single fade-up on mount.
export function PageTransition({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Re-export AnimatePresence for convenience
export { AnimatePresence, motion }
