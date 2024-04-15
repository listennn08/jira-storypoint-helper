export interface Ticket {
  key: string
  iconUrl: string
  type: string
  summary: string
  status: string
  assignee: string
  created: string
  updated: string
  story_point: number
  subtasks?: Ticket[]
}

export interface TicketItem {
  key: string
  boardTitle: string[]
  issues: Ticket[]
}

interface Sprint {
  createdDate: string
  endDate: string
  goal: string
  id: number
  name: string
  originBoardId: number
  self: string
  startDate: string
  state: 'future' | 'active' | 'closed'
  issues: Issue[]
}

interface Issue {
  key: string
  fields: {
    issuetype: {
      iconUrl: string
      name: string
    }
    summary: string
    status: {
      name: string
    }
    assignee: {
      displayName: string
    }
    created: string
    updated: string
    customfield_10076: number
    subtasks: Issue[]
  }
}

export interface Filter {
  user: string[]
  board: string[]
  sprint: string[]
}

export interface Board {
  id: string
  name: string
  key: string
  enabled: boolean
}

export interface JiraConfig {
  email: string
  apiKey: string
  baseURL: string
  sprintStartWord: string
  boards: Board[]
}
