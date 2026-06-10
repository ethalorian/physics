"use client"

// Living scene banners — one per chapter, reacting to the current story beat.
// Composed from the sprite library on a PixelStage with a mood-matched sky.

import { PixelSprite, PixelStage, At, Stars } from './pixel'
import {
  CLOUD, HILL_TREE, TOWN_DAY, TOWN_EVENING,
  STALL, MERCHANT_CART, TRICOLOR,
  SURVEYOR, MOUNTAIN, PLATINUM_BAR,
  BALLOON,
  FLASK, BALANCE_TILT, BALANCE_LEVEL, CUBE_EMPTY, CUBE_FULL,
  CLOCK_CASE, PENDULUM, COURIER,
  ARCHIVES, FIREWORK, QUILL_DESK,
} from './sprites'

function DriftingClouds({ n = 2 }: { n?: number }) {
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <At key={i} x={-12} y={10 + i * 22} anim="drift" dur={26 + i * 9} delay={-i * 11}>
          <PixelSprite sprite={CLOUD} scale={i % 2 ? 2 : 3} />
        </At>
      ))}
    </>
  )
}

/* ---------------------------- Ch0: the market ----------------------------- */

export function Ch0Scene({ step }: { step: number }) {
  // 0–1: traveling to Lille (day). 2–3: Paris at dusk. 4–5: the Revolution answers.
  const phase = step <= 1 ? 'lille' : step <= 3 ? 'paris' : 'revolution'
  return (
    <PixelStage
      mood={phase === 'paris' ? 'dusk' : phase === 'revolution' ? 'dawn' : 'day'}
      label={
        phase === 'lille' ? 'Pixel art: a merchant pulls a cart toward a market stall in Lille'
          : phase === 'paris' ? 'Pixel art: a Paris street market at dusk'
            : 'Pixel art: tricolor flags wave over town at dawn'
      }
    >
      <DriftingClouds />
      <At x={4} bottom={20}>
        <PixelSprite sprite={phase === 'paris' ? TOWN_EVENING : TOWN_DAY} scale={3} />
      </At>
      <At x={62} bottom={20}>
        <PixelSprite sprite={STALL} scale={4} />
      </At>
      {phase === 'lille' && (
        <At x={38} bottom={18} anim="bob-sm" dur={1.2}>
          <PixelSprite sprite={MERCHANT_CART} scale={3} />
        </At>
      )}
      {phase === 'revolution' && (
        <>
          <At x={48} bottom={58}>
            <PixelSprite sprite={TRICOLOR} scale={3} />
          </At>
          <At x={90} bottom={50}>
            <PixelSprite sprite={TRICOLOR} scale={2} />
          </At>
        </>
      )}
    </PixelStage>
  )
}

/* --------------------------- Ch1: the expedition --------------------------- */

export function Ch1Scene({ step }: { step: number }) {
  // 0: the Academy decides (night, stars — the Earth as standard).
  // 1–4: the survey (day, mountains, telescope sweeping).
  // 5: the platinum bar at dusk.
  const phase = step === 0 ? 'academy' : step <= 4 ? 'survey' : 'bar'
  return (
    <PixelStage
      mood={phase === 'academy' ? 'night' : phase === 'bar' ? 'dusk' : 'day'}
      label={
        phase === 'academy' ? 'Pixel art: a town under a starry night sky'
          : phase === 'survey' ? 'Pixel art: a surveyor sweeps a telescope across mountain peaks'
            : 'Pixel art: the platinum meter bar rests on a cushion at dusk'
      }
    >
      {phase === 'academy' && (
        <>
          <Stars count={10} />
          <At x={8} bottom={20}>
            <PixelSprite sprite={TOWN_EVENING} scale={3} />
          </At>
        </>
      )}
      {phase === 'survey' && (
        <>
          <DriftingClouds />
          <At x={55} bottom={20}>
            <PixelSprite sprite={MOUNTAIN} scale={4} />
          </At>
          <At x={78} bottom={20}>
            <PixelSprite sprite={HILL_TREE} scale={3} />
          </At>
          <At x={12} bottom={20}>
            <PixelSprite sprite={SURVEYOR} scale={4} />
          </At>
        </>
      )}
      {phase === 'bar' && (
        <>
          <Stars count={4} />
          <At x="50%" bottom={34}>
            <div style={{ transform: 'translateX(-50%)' }}>
              <PixelSprite sprite={PLATINUM_BAR} scale={5} />
            </div>
          </At>
        </>
      )}
    </PixelStage>
  )
}

/* --------------------------- Ch2: the balloon ride ------------------------- */

export function Ch2Scene({ step }: { step: number }) {
  // The Montgolfier balloon (1783 — period-correct!) rides the ladder:
  // high among clouds early, descending toward town and treetop as the
  // student works down through the rungs and drills.
  const alt = step <= 1 ? 14 : step <= 3 ? 44 : 72 // px from top
  return (
    <PixelStage mood="day" label="Pixel art: a hot-air balloon drifts over the countryside, lower as the chapter advances">
      <DriftingClouds n={3} />
      <At x={6} bottom={20}>
        <PixelSprite sprite={TOWN_DAY} scale={2} />
      </At>
      <At x={72} bottom={20}>
        <PixelSprite sprite={HILL_TREE} scale={3} />
      </At>
      <At x={48} y={alt} anim="bob" dur={3.4}>
        <PixelSprite sprite={BALLOON} scale={3} />
      </At>
    </PixelStage>
  )
}

/* ------------------------------ Ch3: the lab ------------------------------- */

export function Ch3Scene({ step }: { step: number }) {
  // 0–1: flask bubbling, cube empty, balance tipped.
  // 2–3: cube filled with water.
  // 4–5: balance level — the system locks together.
  const full = step >= 2
  const level = step >= 4
  return (
    <PixelStage mood="lab" height={130} label="Pixel art: a laboratory bench with a bubbling flask, a water cube, and a balance scale">
      <At x={8} bottom={22}>
        <PixelSprite sprite={FLASK} scale={4} />
      </At>
      <At x={40} bottom={22}>
        <PixelSprite sprite={full ? CUBE_FULL : CUBE_EMPTY} scale={4} />
      </At>
      <At x={66} bottom={22}>
        <PixelSprite sprite={level ? BALANCE_LEVEL : BALANCE_TILT} scale={4} />
      </At>
    </PixelStage>
  )
}

/* ----------------------------- Ch4: the clocks ----------------------------- */

export function Ch4Scene({ step }: { step: number }) {
  // 0–3: a clockmaker's street at dusk, pendulum swinging.
  // 4: the courier gallops past (speed enters the story).
  // 5: night falls; the second survives.
  const phase = step === 4 ? 'courier' : step >= 5 ? 'night' : 'street'
  return (
    <PixelStage
      mood={phase === 'night' ? 'night' : 'dusk'}
      label={
        phase === 'courier' ? 'Pixel art: a courier on horseback gallops past town'
          : 'Pixel art: a clockmaker street with a standing clock, its pendulum swinging'
      }
    >
      {phase === 'night' && <Stars count={8} />}
      <At x={6} bottom={20}>
        <PixelSprite sprite={TOWN_EVENING} scale={3} />
      </At>
      <At x={70} bottom={20}>
        <PixelSprite sprite={CLOCK_CASE} scale={4} />
      </At>
      {/* pendulum swings inside the case, hinged at its top */}
      <At x={70} bottom={28}>
        <div style={{ marginLeft: 30, transformOrigin: 'top center', animation: 'moat-sway 1.8s ease-in-out infinite' }}>
          <PixelSprite sprite={PENDULUM} scale={3} />
        </div>
      </At>
      {phase === 'courier' && (
        <At x={0} bottom={18} anim="ride" dur={7}>
          <PixelSprite sprite={COURIER} scale={3} />
        </At>
      )}
    </PixelStage>
  )
}

/* ---------------------------- Ch5: the Archives ---------------------------- */

export function Ch5Scene({ phase, mastery }: { phase: 'brief' | 'run' | 'done'; mastery: boolean }) {
  const celebrate = phase === 'done' && mastery
  return (
    <PixelStage
      mood={phase === 'done' ? 'night' : 'dawn'}
      label={
        celebrate ? 'Pixel art: fireworks burst over the National Archives'
          : phase === 'run' ? 'Pixel art: an inspector’s desk before the National Archives'
            : 'Pixel art: the National Archives at dawn, flags waving'
      }
    >
      {phase === 'done' && <Stars count={6} />}
      <At x="50%" bottom={20}>
        <div style={{ transform: 'translateX(-50%)' }}>
          <PixelSprite sprite={ARCHIVES} scale={4} />
        </div>
      </At>
      <At x={12} bottom={56}>
        <PixelSprite sprite={TRICOLOR} scale={3} />
      </At>
      <At x={84} bottom={56}>
        <PixelSprite sprite={TRICOLOR} scale={3} />
      </At>
      {phase === 'run' && (
        <At x={8} bottom={20}>
          <PixelSprite sprite={QUILL_DESK} scale={3} />
        </At>
      )}
      {celebrate && (
        <>
          <At x={22} y={14}>
            <PixelSprite sprite={FIREWORK} scale={4} />
          </At>
          <At x={62} y={8}>
            <PixelSprite sprite={FIREWORK} scale={5} />
          </At>
          <At x={82} y={26}>
            <PixelSprite sprite={FIREWORK} scale={3} />
          </At>
        </>
      )}
    </PixelStage>
  )
}
