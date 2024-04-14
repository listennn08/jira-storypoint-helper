import { create } from 'zustand'
import { Ticket } from '@renderer/types'

interface TicketItem {
  key: string
  boardTitle: string[]
  issues: Ticket[]
}

interface TicketState {
  tickets: Array<TicketItem>
  setTickets: (tickets: Array<TicketItem>) => void
}

export const useTicketStore = create<TicketState>((set) => ({
  tickets: [],
  setTickets: (tickets): void => set((state) => ({ ...state, tickets }))
}))
