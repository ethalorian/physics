'use client'
import { createContext, useContext } from 'react'
import type { AssignedTrade } from '@/lib/vocational'
export const TradeContext = createContext<AssignedTrade | null>(null)
export function useAssignedTrade() { return useContext(TradeContext) }
