import { memo, useEffect, useState } from 'react'
import { Box } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { groupByAssignee } from '../utils'
import { Ticket } from '@renderer/types'

interface StoryPointTableProps {
  tickets: Array<{
    key: string
    boardTitle: string[]
    issues: Ticket[]
  }>
}

interface StoryPointTableData {
  [key: string]: string | number
  assignee: string
}

const StoryPointTable: React.FC<StoryPointTableProps> = ({ tickets }: StoryPointTableProps) => {
  const [tableData, setTableData] = useState<StoryPointTableData[]>([])
  const [tableHeaders, setTableHeaders] = useState<string[]>([])

  useEffect(() => {
    const tableHeaders = tickets.map((ticket) => ticket.key)
    console.log('tableHeaders', tableHeaders)
    const groupByAssigneeObj = groupByAssignee(tickets)
    setTableHeaders(tableHeaders)
    const data = Object.keys(groupByAssigneeObj).map((user: string) => {
      const row: StoryPointTableData = { assignee: user, id: user }
      tableHeaders.forEach((sprintName) => {
        row[sprintName] = groupByAssigneeObj[user][sprintName] || 0
      })
      return row
    })
    setTableData(data)
  }, [tickets])

  return (
    <Box minWidth="800px">
      <DataGrid
        columns={[
          { field: 'assignee', headerName: 'Assignee', width: 100 },
          ...tableHeaders.map((header) => ({ field: header, headerName: header, width: 120 }))
        ]}
        rows={tableData}
        hideFooter
        initialState={{
          sorting: {
            sortModel: [{ field: 'assignee', sort: 'asc' }]
          }
        }}
      />
    </Box>
  )
}

export default memo(StoryPointTable)
