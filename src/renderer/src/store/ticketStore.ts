import { create } from 'zustand'
import { TicketItem } from '@renderer/types'

interface TicketState {
  tickets: Array<TicketItem>
  setTickets: (tickets: Array<TicketItem>) => void
}

export const useTicketStore = create<TicketState>((set) => ({
  tickets: [],
  setTickets: (tickets): void => set((state) => ({ ...state, tickets }))
}))
