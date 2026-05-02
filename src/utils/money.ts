export interface SplitAmount {
  amount: number
  cents: number
}

export function splitAmount(value: number): SplitAmount {
  const amount = Math.floor(value)
  const cents = Math.round((value - amount) * 100)
  return { amount, cents }
}

