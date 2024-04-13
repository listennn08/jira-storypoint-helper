import { Dispatch, SetStateAction, useContext, useEffect, useMemo, useState } from 'react'
import { Buffer } from 'buffer'
import { from, mergeMap, reduce } from 'rxjs'
import _ from 'lodash'
import { orderKeyBySprint, groupByAssignee, sortTickets } from './utils'
import AppContext from './context/AppContext'

import { Issue, Sprint, Ticket, Filter, Board } from './types'

const CACHE_TIME = 1000 * 60 * 5 // 5 minutes

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
  const { jiraConfig, loadedConfig } = useContext(AppContext)
  const [boardMap, setBoardMap] = useState<
    Record<
      string,
      {
        key: string
        name: string
      }
    >
  >({})
  const [loading, setLoading] = useState(true)
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

  const [tickets, setTickets] = useState<
    Array<{
      key: string
      boardTitle: string[]
      issues: Ticket[]
    }>
  >([])
  const filteredTickets = useMemo(() => {
    return _.chain(tickets)
      .filter((ticket) => {
        if (filter.sprint?.length && !filter.sprint.includes(ticket.key)) {
          return false
        }
        if (
          filter.board.length &&
          !filter.board.some((board) => ticket.boardTitle.includes(board))
        ) {
          return false
        }
        return true
      })
      .value()
  }, [tickets, filter])

  const userOptions = useMemo(() => _.keys(groupByAssignee(filteredTickets)), [filteredTickets])
  const boardOptions = useMemo(() => Object.keys(boardMap), [boardMap])
  const sprintOptions = useMemo(
    () => filteredTickets.map((ticket) => ticket.key),
    [filteredTickets]
  )

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
          // setSprintIdMap((sprintIdMap) => {
          //   sprintIdMap[sprint.name] = sprint.id
          //   return sprintIdMap
          // })
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
    setLoadingText(`Processing data for <b>${boardMap[board.boardId]}</b>...`)
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
    setLoadingText('Fetching data...')
    setLoading(true)

    let sprintObj: Record<string, Sprint> = {}
    const $subscriber = from(boards).pipe(
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
        sprintObj = data
      },
      complete: () => {
        const sortedSprintObject = orderKeyBySprint(
          sprintObj,
          Object.values(boardMap).map((board) => board.key),
          jiraConfig.sprintStartWord
        )

        setTickets(sortedSprintObject)
        setLoading(false)
        localStorage.setItem('tickets', JSON.stringify(sortedSprintObject))
        localStorage.setItem('ttl', (Date.now() + CACHE_TIME).toString())
      },
      error: (e) => {
        setError(e.message)
        console.error(e)
      }
    })
  }

  useEffect(() => {
    if (!loadedConfig) return
    if (jiraConfig.email && jiraConfig.apiKey && jiraConfig.baseURL) {
      const ttl = Number(localStorage.getItem('ttl'))
      const ticketsString = localStorage.getItem('tickets')
      if (ticketsString && ticketsString !== 'undefined') {
        const tickets = JSON.parse(ticketsString)
        if (!_.isEmpty(tickets) && ttl > Date.now()) {
          console.log('loading data from cache')
          setTickets(tickets)
          setLoading(false)
          return
        }
      }
      getBoardData()
    }
  }, [loadedConfig, jiraConfig])

  useEffect(() => {
    if (_.isEmpty(boardMap)) return
    fetchData()
  }, [boardMap])

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