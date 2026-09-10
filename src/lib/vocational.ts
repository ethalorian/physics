export const TRADE_LABELS = { electrical: 'Electrical', carpentry: 'Carpentry', plumbing: 'Plumbing' } as const
export type AssignedTrade = keyof typeof TRADE_LABELS
export function isAssignedTrade(value: unknown): value is AssignedTrade { return typeof value === 'string' && Object.hasOwn(TRADE_LABELS, value) }
export interface TradeConnection { directions: string[]; standardRefs: string[]; visual?: { src: string; alt: string } }
