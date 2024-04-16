import { Ticket } from '@renderer/types'

export function orderKeyBySprint<T extends Record<string, unknown>>(
  sprintObj: T,
  sprintItemOrder?: string[],
  sprintStartWord: string = ''
): Array<{
  key: string
  boardKey: string[]
  boardTitle: string[]
  issues: Ticket[]
}> {
  const sprintKeys = Object.keys(sprintObj).sort((a, b) => {
    if (!sprintItemOrder) return 0
    const [aBoard, , aSprint] = a.split(' ')
    const [bBoard, , bSprint] = b.split(' ')
    if (sprintItemOrder.indexOf(aBoard) === -1) return 1
    if (sprintItemOrder.indexOf(bBoard) === -1) return -1
    if (aBoard !== bBoard) {
      return sprintItemOrder.indexOf(aBoard) - sprintItemOrder.indexOf(bBoard)
    }

    const aSprintNumber = Number(aSprint.replace(sprintStartWord, ''))
    const bSprintNumber = Number(bSprint.replace(sprintStartWord, ''))
    return aSprintNumber - bSprintNumber
  })

  const sprintItems: {
    key: string
    boardKey: string[]
    boardTitle: string[]
    issues: Ticket[]
  }[] = []

  for (const key of sprintKeys) {
    sprintItems.push({
      key,
      ...(sprintObj[key] as {
        boardKey: string[]
        boardTitle: string[]
        issues: Ticket[]
      })
    })
  }

  return sprintItems
}

// a little function to help us with reordering the result
export function reorder<T>(list: T[], startIndex: number, endIndex: number): T[] {
  const result = Array.from(list)
  const [removed] = result.splice(startIndex, 1)
  result.splice(endIndex, 0, removed)

  return result
}

export function groupByAssignee(
  sprintItems: Array<{
    key: string
    boardTitle: string[]
    issues: Ticket[]
  }>
): Record<string, Record<string, number>> {
  const assigneeStoryPointsBySprint: Record<string, Record<string, number>> = {}
  const ignoreStatus = ['Done', 'Blocked', 'Closed', 'Abandoned']
  for (const sprintItem of sprintItems) {
    const tickets = sprintItem.issues

    for (const ticket of tickets) {
      if (!ticket.assignee || ignoreStatus.includes(ticket.status)) {
        continue
      }

      if (ticket.subtasks) {
        // if the ticket has subtasks, we need to sum the story points of the subtasks
        for (const subtask of ticket.subtasks) {
          if (!subtask.assignee || ignoreStatus.includes(subtask.status)) {
            continue
          }
          if (!assigneeStoryPointsBySprint[subtask.assignee]) {
            assigneeStoryPointsBySprint[subtask.assignee] = {}
          }
          if (!assigneeStoryPointsBySprint[subtask.assignee][sprintItem.key]) {
            assigneeStoryPointsBySprint[subtask.assignee][sprintItem.key] = 0
          }
          assigneeStoryPointsBySprint[subtask.assignee][sprintItem.key] += subtask.story_point || 0
        }
      } else {
        if (!assigneeStoryPointsBySprint[ticket.assignee]) {
          assigneeStoryPointsBySprint[ticket.assignee] = {}
        }
        if (!assigneeStoryPointsBySprint[ticket.assignee][sprintItem.key]) {
          assigneeStoryPointsBySprint[ticket.assignee][sprintItem.key] = 0
        }
        assigneeStoryPointsBySprint[ticket.assignee][sprintItem.key] += ticket.story_point || 0
      }
    }
  }

  return assigneeStoryPointsBySprint
}

export function sortTickets(a: Ticket, b: Ticket): number {
  const typeOrder = ['Story', 'Task', 'Bug', 'Operation']
  if (a.type === b.type) {
    return Number(a.key.split('-')[1]) - Number(b.key.split('-')[1])
  }
  return typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type)
}
