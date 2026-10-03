import { useEffect, useRef, useState } from 'react'
import { animate, motion, useInView, useReducedMotion } from 'motion/react'
import { formatMs, formatTokens, formatUsd } from '@/lib/format'

interface NodeData {
  id: string
  ms: number
  tokens: number
  cost: number
}

// Illustrative numbers for the diagram only — not a real benchmark, just
// something plausible to animate for the "measuring" beat.
const NODES: NodeData[] = [
  { id: 'MODEL_01', ms: 142, tokens: 612, cost: 0.00021 },
  { id: 'MODEL_02', ms: 398, tokens: 845, cost: 0.00074 },
  { id: 'MODEL_03', ms: 671, tokens: 790, cost: 0.00058 },
  { id: 'MODEL_04', ms: 1240, tokens: 1120, cost: 0.00198 },
]
const FASTEST_ID = NODES.reduce((a, b) => (a.ms < b.ms ? a : b)).id

// Fixed pixel canvas (not fluid) — kept simple and legible by hiding below
// `sm` rather than fighting text overflow at arbitrary container widths.
// Node vertical gap (84px) accounts for the real rendered height of the
// label + box + cost-line stack (~68px) plus breathing room, not just the
// box itself — a tighter gap here previously let adjacent rows overlap.
const W = 460
const H = 360
const PROMPT = { x: 20, y: 174 }
const NODE_CENTER_X = 350
const BOX_W = 112
const BOX_H = 30
const NODE_YS = [48, 132, 216, 300]

const DRAW_DELAY = [0.2, 0.55, 0.9, 1.4]
const DRAW_DURATION = 0.4

// Full sequence finishes reporting the last node by ~2.65s; the rest is a
// pause before the next loop, then a brief fade before remounting to replay.
const CYCLE_MS = 4200
const RESET_FADE_MS = 250
// Plays 3 times total (the initial play-through plus two replays) then
// settles on the final state instead of looping forever.
const MAX_PLAYS = 3

function tracePath(nodeY: number) {
  const startX = PROMPT.x + 6
  const endX = NODE_CENTER_X - BOX_W / 2
  const midX = (startX + endX) / 2
  return `M ${startX} ${PROMPT.y} C ${midX} ${PROMPT.y}, ${midX} ${nodeY}, ${endX} ${nodeY}`
}

export function HeroVisualExplainer() {
  const containerRef = useRef<HTMLDivElement>(null)
  // Not `once` — the loop should pause while scrolled out and pick back up
  // when the diagram re-enters view, rather than only ever playing once.
  const isInView = useInView(containerRef, { amount: 0.5 })
  const prefersReducedMotion = useReducedMotion()
  const instant = !!prefersReducedMotion

  const [cycleKey, setCycleKey] = useState(0)
  const [resetting, setResetting] = useState(false)
  // The initial mount is play #1 — this only counts the replays the
  // interval below triggers, so it persists (via ref, not state) across
  // the hero scrolling out of and back into view without resetting.
  const playsRef = useRef(1)

  useEffect(() => {
    // Reduced motion: play the (instant) end state once and leave it be —
    // a looping animation is exactly what this preference asks to avoid.
    if (!isInView || instant) return
    if (playsRef.current >= MAX_PLAYS) return

    let fadeTimeout: ReturnType<typeof setTimeout> | undefined

    const interval = setInterval(() => {
      if (playsRef.current >= MAX_PLAYS) {
        clearInterval(interval)
        return
      }
      setResetting(true)
      fadeTimeout = setTimeout(() => {
        playsRef.current += 1
        setCycleKey((k) => k + 1)
        setResetting(false)
      }, RESET_FADE_MS)
    }, CYCLE_MS)

    return () => {
      clearInterval(interval)
      if (fadeTimeout) clearTimeout(fadeTimeout)
    }
  }, [isInView, instant])

  return (
    <div
      ref={containerRef}
      className="relative mx-auto hidden sm:block"
      style={{ width: W, height: H }}
    >
      <div
        style={{ opacity: resetting ? 0 : 1, transition: `opacity ${RESET_FADE_MS}ms ease` }}
      >
        <svg
          key={cycleKey}
          viewBox={`0 0 ${W} ${H}`}
          width={W}
          height={H}
          className="absolute inset-0"
          aria-hidden="true"
        >
          <motion.circle
            cx={PROMPT.x}
            cy={PROMPT.y}
            r={5}
            fill="#7c3aed"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={isInView ? { opacity: 1, scale: 1 } : undefined}
            transition={{ duration: instant ? 0 : 0.35 }}
          />
          {NODES.map((node, i) => (
            <motion.path
              key={node.id}
              d={tracePath(NODE_YS[i])}
              fill="none"
              stroke="#7c3aed"
              strokeWidth={1.5}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={isInView ? { pathLength: 1, opacity: 1 } : undefined}
              transition={
                instant ? { duration: 0 } : { duration: DRAW_DURATION, delay: DRAW_DELAY[i], ease: 'easeOut' }
              }
            />
          ))}
        </svg>

        {NODES.map((node, i) => (
          <NodeReadout
            key={`${node.id}-${cycleKey}`}
            node={node}
            y={NODE_YS[i]}
            boxDelay={DRAW_DELAY[i]}
            countDelay={DRAW_DELAY[i] + DRAW_DURATION}
            isInView={isInView}
            instant={instant}
            isFastest={node.id === FASTEST_ID}
          />
        ))}
      </div>
    </div>
  )
}

interface NodeReadoutProps {
  node: NodeData
  y: number
  boxDelay: number
  countDelay: number
  isInView: boolean
  instant: boolean
  isFastest: boolean
}

function NodeReadout({ node, y, boxDelay, countDelay, isInView, instant, isFastest }: NodeReadoutProps) {
  const [displayMs, setDisplayMs] = useState(instant ? node.ms : 0)
  const [showCost, setShowCost] = useState(instant)

  useEffect(() => {
    if (!isInView) return
    if (instant) {
      setDisplayMs(node.ms)
      setShowCost(true)
      return
    }
    const controls = animate(0, node.ms, {
      duration: 0.55,
      delay: countDelay,
      ease: 'easeOut',
      onUpdate: (v) => setDisplayMs(Math.round(v)),
      onComplete: () => setShowCost(true),
    })
    return () => controls.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInView])

  const boxLeft = NODE_CENTER_X - BOX_W / 2
  const boxTop = y - BOX_H / 2

  return (
    <>
      <div
        className="absolute -translate-y-full text-center font-mono text-[9px] uppercase tracking-widest text-ink-faint"
        style={{ left: boxLeft, top: boxTop - 4, width: BOX_W }}
      >
        {node.id}
      </div>

      <motion.div
        className="absolute flex items-center justify-center rounded border border-hairline bg-panel font-mono text-[13px] font-semibold"
        style={{ left: boxLeft, top: boxTop, width: BOX_W, height: BOX_H }}
        initial={{ opacity: 0 }}
        animate={{ opacity: isInView ? 1 : 0 }}
        transition={{ duration: instant ? 0 : 0.25, delay: instant ? 0 : boxDelay }}
      >
        <span className={isFastest ? 'text-secondary' : 'text-ink'}>{formatMs(displayMs)}</span>
      </motion.div>

      <motion.div
        className="absolute text-center font-mono text-[9px] text-ink-faint"
        style={{ left: boxLeft, top: boxTop + BOX_H + 6, width: BOX_W }}
        initial={{ opacity: 0 }}
        animate={{ opacity: showCost ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      >
        {formatTokens(node.tokens)} tok · {formatUsd(node.cost)}
      </motion.div>
    </>
  )
}
