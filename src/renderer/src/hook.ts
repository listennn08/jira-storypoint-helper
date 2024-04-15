import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router'
import { Buffer } from 'buffer'
import { from, mergeMap, reduce } from 'rxjs'
import _ from 'lodash'
import { orderKeyBySprint, groupByAssignee, sortTickets } from './utils'
import { CACHE_TIME } from './constants'

import { Issue, Sprint, Ticket, Filter, Board } from './types'
import { useAppStore } from './store/appStore'

interface UseFetchDataReturn {
  loading: boolean
  error: string
  boardMap: Record<
    string,
    {
      key: string
      name: string
    }
  >
  userOptions: string[]
  sprintOptions: string[]
  boardOptions: string[]
  filteredTickets: Array<{
    key: string
    boardTitle: string[]
    issues: Ticket[]
  }>
  loadingText: string
  filter: {
    user: string[]
    board: string[]
    sprint: string[]
  }
  fetchData: () => void
  setFilter: Dispatch<SetStateAction<Filter>>
}

export default function useFetchData(): UseFetchDataReturn {
  const location = useLocation()
  const jiraConfig = useAppStore((state) => state.jiraConfig)
  const loadedConfig = useAppStore((state) => state.loadedConfig)
  const addAlerts = useAppStore((state) => state.addAlerts)
  const [boardMap, setBoardMap] = useState<
    Record<
      string,
      {
        key: string
        name: string
      }
    >
  >({})
  const [loading, setLoading] = useState(false)
  const [loadingText, setLoadingText] = useState('Fetching data...')
  const [error, setError] = useState('')

  const [filter, setFilter] = useState<{
    user: string[]
    board: string[]
    sprint: string[]
  }>({
    user: [],
    board: [],
    sprint: []
  })

  const [boards, setBoards] = useState<{ sprints: Sprint[]; boardId: string; boardName: string }[]>(
    []
  )
  const filteredBoards = useMemo(() => {
    return boards.filter((board) => {
      if (filter.board.length) {
        return filter.board.includes(board.boardName)
      }
      return true
    })
  }, [boards, filter.board])

  const [tickets, setTickets] = useState<
    Array<{
      key: string
      boardTitle: string[]
      issues: Ticket[]
    }>
  >([])
  const filteredTickets = useMemo(() => {
    return _.chain(tickets)
      .cloneDeep()
      .map((sprint) => {
        if (filter.user.length) {
          sprint.issues = sprint.issues.map((issue) => ({
            ...issue,
            subtasks: issue.subtasks?.filter((subtask) =>
              filter.user.includes(subtask.assignee || '')
            )
          }))
          sprint.issues = sprint.issues.filter((issue) => {
            if (filter.user.includes(issue.assignee || '')) return true
            if (issue.subtasks && issue.subtasks.length > 0) return true
            return false
          })
        }
        return sprint
      })
      .filter((sprint) => {
        if (filter.sprint?.length && !filter.sprint.includes(sprint.key)) {
          return false
        }
        if (
          filter.board.length &&
          !filter.board.some((board) => sprint.boardTitle.includes(board))
        ) {
          return false
        }
        return true
      })
      .value()
  }, [tickets, filter])

  const userOptions = useMemo(
    () =>
      _.chain(groupByAssignee(tickets))
        .keys()
        .sort((a, b) => {
          const aLower = a.toLowerCase()
          const bLower = b.toLowerCase()
          return aLower.localeCompare(bLower)
        })
        .value(),
    [tickets]
  )
  const boardOptions = useMemo(() => Object.keys(boardMap), [boardMap])
  const sprintOptions = useMemo(() => {
    return tickets
      .filter((ticket) => {
        if (filter.board.length) {
          return filter.board.some((board) => ticket.boardTitle.includes(board))
        }
        return true
      })
      .map((ticket) => ticket.key)
  }, [tickets, filter.board])

  async function request<T>(url: string): Promise<T> {
    const { email, apiKey, baseURL } = jiraConfig
    const params = new URLSearchParams({ maxResults: '1000' })

    return await window.electron.ipcRenderer.invoke(
      'request',
      `${baseURL}${url}?${params.toString()}`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${email}:${apiKey}`).toString('base64')}`
        }
      }
    )
  }

  async function getBoardData(): Promise<
    {
      sprints: Sprint[]
      boardId: string
      boardName: string
    }[]
  > {
    const boardMap = jiraConfig.boards.reduce(
      (
        acc: Record<
          string,
          {
            key: string
            name: string
          }
        >,
        board: Board
      ) => {
        acc[board.id] = {
          key: board.key,
          name: board.name
        }
        return acc
      },
      {} as Record<
        string,
        {
          key: string
          name: string
        }
      >
    )
    const boards = await Promise.all(
      Object.keys(boardMap).map(async (boardId) => {
        const resp = await request<{ values: Sprint[] }>(`/rest/agile/1.0/board/${boardId}/sprint`)
        return {
          sprints: resp.values.filter(
            (sprint: Sprint) => sprint.state === 'active' || sprint.state === 'future'
          ),
          boardId,
          boardName: boardMap[boardId].name
        }
      })
    )

    setBoardMap(boardMap)
    setBoards(boards)
    return boards
  }

  function verifyConfig(): boolean {
    if (!jiraConfig.email || !jiraConfig.apiKey || !jiraConfig.baseURL) {
      return false
    }
    return true
  }

  async function fetchSprintData(boardId: string, sprintId: number): Promise<Issue[]> {
    const resp = await request<{
      issues: Issue[]
    }>(`/rest/agile/1.0/board/${boardId}/sprint/${sprintId}/issue`)
    return resp.issues
  }

  async function getSprintData(board: {
    boardId: string
    boardName: string
    sprints: Sprint[]
  }): Promise<{
    boardId: string
    sprints: Sprint[]
  }> {
    setLoadingText(`Fetching data for ${board.boardName}...`)
    const { boardId, sprints } = board

    return {
      boardId,
      sprints: await Promise.all(
        sprints.map(async (sprint: Sprint) => {
          return {
            ...sprint,
            issues: await fetchSprintData(boardId, sprint.id)
          }
        })
      )
    }
  }

  function processTickets(
    tickets: Issue[],
    originalTickets?: Issue[],
    flag: boolean = false
  ): Ticket[] {
    return tickets.map((ticket) => {
      let subtasks: Ticket[] | undefined = undefined

      if (ticket.fields.subtasks?.length) {
        subtasks = processTickets(ticket.fields.subtasks, tickets, true).sort(sortTickets)
      }

      if (flag) {
        ticket = originalTickets?.find((t: Issue) => t.key === ticket.key) as Issue
      }

      return _.omitBy<Ticket>(
        {
          key: ticket.key,
          iconUrl: ticket.fields.issuetype.iconUrl,
          type: ticket.fields.issuetype.name,
          summary: ticket.fields.summary,
          status: ticket.fields.status.name,
          assignee: ticket.fields.assignee?.displayName,
          created: ticket.fields.created,
          updated: ticket.fields.updated,
          story_point: ticket.fields.customfield_10076,
          subtasks
        },
        _.isUndefined
      )
    }) as Ticket[]
  }

  async function processSprintData(board: { boardId: string; sprints: Sprint[] }): Promise<
    {
      sprint: string
      boardTitle: string
      issues: Ticket[]
    }[]
  > {
    setLoadingText(`Processing data for <b>${boardMap[board.boardId].name}</b>...`)
    return board.sprints.map((sprint) => {
      const tickets = processTickets(sprint.issues)
        .filter((ticket) => ticket.type !== 'Sub-task')
        .sort(sortTickets)

      return {
        sprint: sprint.name,
        boardTitle: boardMap[board.boardId].name,
        issues: tickets
      }
    })
  }

  async function fetchData(): Promise<void> {
    if (!verifyConfig()) {
      setError('Please set Jira configuration first')
      return
    }
    setLoadingText('Fetching data...')
    setLoading(true)

    if (_.isEmpty(boardMap)) {
      await getBoardData()
      setLoading(false)
      return
    }

    let sprintObj: Record<string, Sprint> = {}
    const $subscriber = from(filteredBoards).pipe(
      mergeMap(getSprintData),
      mergeMap(processSprintData),
      mergeMap((data) => from(data)),
      reduce((acc, result) => {
        const key = result.sprint
        acc[key] = {
          boardTitle: (acc[key]?.boardTitle || []).concat([result.boardTitle]),
          issues: (acc[key]?.issues || []).concat(result.issues)
        }

        return acc
      }, {})
    )

    $subscriber.subscribe({
      next: (data) => {
        console.log(data)
        if (filter.board.length) {
          sprintObj = {
            ...JSON.parse(localStorage.getItem('sprint-obj') || '{}'),
            ...data
          }
        } else {
          sprintObj = data
        }
      },
      complete: () => {
        const sortedSprintObject = orderKeyBySprint(
          sprintObj,
          Object.values(boardMap).map((board) => board.key),
          jiraConfig.sprintStartWord
        )

        setTickets(sortedSprintObject)
        setLoading(false)

        localStorage.setItem('sprint-obj', JSON.stringify(sprintObj))
        localStorage.setItem('tickets', JSON.stringify(sortedSprintObject))
        localStorage.setItem('ttl', (Date.now() + CACHE_TIME).toString())
      },
      error: (e) => {
        setError(e.message)
        console.error(e)
      }
    })
  }

  function checkCache(): boolean {
    const ttl = Number(localStorage.getItem('ttl'))
    const ticketsString = localStorage.getItem('tickets')
    if (ticketsString && ticketsString !== 'undefined' && ttl > Date.now()) {
      return true
    }
    return false
  }
  async function getData(): Promise<void> {
    if (!loadedConfig) return
    if (!verifyConfig()) {
      setLoading(false)
      return
    }
    if (checkCache()) {
      const tickets = JSON.parse(localStorage.getItem('tickets')!)
      if (!_.isEmpty(tickets)) {
        if (location.pathname !== '/settings') {
          addAlerts({
            severity: 'info',
            message: 'Data loaded from cache'
          })
        }
        setTickets(tickets)
        setLoading(false)
        return
      }
    }
    getBoardData()
  }

  useEffect(() => {
    getData()
  }, [loadedConfig, jiraConfig])

  useEffect(() => {
    if (checkCache()) return
    fetchData()
  }, [boards])

  return {
    loading,
    error,
    boardMap,
    userOptions,
    sprintOptions,
    boardOptions,
    filteredTickets,
    loadingText,
    filter,
    fetchData,
    setFilter
  }
}
