"use client"

import { createContext, useContext } from 'react'

// True when a simulation is being rendered INSIDE a lesson (sim_embed block),
// so the sim's own page chrome (assignment editor, etc.) can hide itself.
export const SimEmbedContext = createContext(false)
export const useSimEmbedded = () => useContext(SimEmbedContext)
