import { memo, useContext, useMemo, useState } from 'react'
import { Box, Tab, Tabs } from '@mui/material'
import { SimpleTreeView, TreeItem } from '@mui/x-tree-view'
import TreeLabel from '@renderer/components/TreeLabel'
import TicketContext from '@renderer/context/TicketContext'

const TicketTabs = (): JSX.Element => {
  const { tickets } = useContext(TicketContext)
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
        .map((ticket) => {
          if (ticket.subtasks) {
            return ticket.key
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
      {tickets.map((ticket, index) => (
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
                {ticket.issues.map((ticket) => (
                  <TreeItem
                    label={<TreeLabel ticket={ticket} key={`label-${ticket.key}`} />}
                    key={`${ticket.key}`}
                    itemId={`${ticket.key}`}
                  >
                    {ticket.subtasks?.map((subtask) => (
                      <TreeItem
                        label={<TreeLabel ticket={subtask} key={`label-${subtask.key}`} />}
                        key={subtask.key}
                        itemId={subtask.key}
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
