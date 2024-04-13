import { memo, useMemo, useState } from 'react'
import { Box, Tab, Tabs } from '@mui/material'
import { SimpleTreeView, TreeItem } from '@mui/x-tree-view'
import TreeLabel from './TreeLabel'
import { Ticket } from '@renderer/types'

interface TicketTabsProps {
  tickets: Array<{
    key: string
    boardTitle: string[]
    issues: Ticket[]
  }>
}
const TicketTabs = (props: TicketTabsProps): JSX.Element => {
  const { tickets } = props
  const [sprint, setSprint] = useState(0)

  function a11yProps(index: number): {
    id: string
    'aria-controls': string
  } {
    return {
      id: `tab-${index}`,
      'aria-controls': `tabpanel-${index}`
    }
  }

  const defaultExpandedItems = useMemo(() => {
    return tickets.flatMap((ticket) =>
      ticket.issues
        .map((ticket, index) => {
          if (ticket.subtasks) {
            return index.toString()
          }
          return null
        })
        .filter((el) => el !== null)
    ) as string[]
  }, [tickets])

  function handleChange(_event: React.SyntheticEvent, newValue: number): void {
    setSprint(newValue)
  }

  return (
    <>
      <Box minWidth={800}>
        <Tabs value={sprint} variant="scrollable" scrollButtons="auto" onChange={handleChange}>
          {tickets.map((ticket, index) => (
            <Tab label={ticket.key} key={ticket.key} {...a11yProps(index)} />
          ))}
        </Tabs>
      </Box>
      {Object.keys(tickets).map((sprintName, index) => (
        <div
          role="tabpanel"
          key={`tabpanel-${index}`}
          hidden={sprint !== index}
          id={`tabpanel-${index}`}
          aria-labelledby={`tab-${index}`}
        >
          {sprint === index && (
            <Box sx={{ py: 1 }}>
              <SimpleTreeView defaultExpandedItems={defaultExpandedItems}>
                {tickets[sprintName].issues.map((ticket, index) => (
                  <TreeItem
                    label={<TreeLabel ticket={ticket} key={`label-${index}`} />}
                    key={`${index}`}
                    itemId={`${index}`}
                  >
                    {ticket.subtasks?.map((subtask: Ticket, subIndex: number) => (
                      <TreeItem
                        label={<TreeLabel ticket={subtask} key={`label-${index}${subIndex}`} />}
                        key={`xxxasdasd-${index}${subIndex}`}
                        itemId={`xxxasdasd-${index}${subIndex}`}
                      />
                    ))}
                  </TreeItem>
                ))}
              </SimpleTreeView>
            </Box>
          )}
        </div>
      ))}
    </>
  )
}

export default memo(TicketTabs)
