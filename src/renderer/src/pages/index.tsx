import { memo, useContext, useEffect, useState } from 'react'
import { Box } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { groupByAssignee } from '@renderer/utils'
import TicketContext from '@renderer/context/TicketContext'

interface StoryPointTableData {
  [key: string]: string | number
  assignee: string
}

const index: React.FC = () => {
  const { tickets } = useContext(TicketContext)
  const [tableData, setTableData] = useState<StoryPointTableData[]>([])
  const [tableHeaders, setTableHeaders] = useState<string[]>([])

  useEffect(() => {
    if (!tickets) return
    const tableHeaders = tickets.map((ticket) => ticket.key)
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
        autoHeight
        columns={[
          { field: 'assignee', headerName: 'Assignee', width: 150 },
          ...tableHeaders.map((header) => ({
            field: header,
            headerName: header,
            width: 150,
            renderCell: (params) => (
              <span style={{ opacity: params.value === 0 ? '0.5' : '1' }}>{params.value}</span>
            )
          }))
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

export default memo(index)
