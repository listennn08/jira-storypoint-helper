import { memo, useContext } from 'react'
import { Grid, TextField, IconButton } from '@mui/material'
import { Board } from '@renderer/types'
import { Delete } from '@mui/icons-material'
import AppContext from '@renderer/context/AppContext'

interface BoardItemProps {
  board: Board
  index: number
}

const BoardItem: React.FC<BoardItemProps> = ({ board, index }: BoardItemProps) => {
  const { setJiraConfig } = useContext(AppContext)
  return (
    <Grid container item xs={12} gap={1} py={1} alignItems="center">
      <Grid item xs={2}>
        <TextField key={`board-id-${index}`} label="Board ID" value={board.id} fullWidth disabled />
      </Grid>
      <Grid item xs={2}>
        <TextField label="Board Key" value={board.key} fullWidth disabled />
      </Grid>
      <Grid item xs={5}>
        <TextField
          key={`board-name-${index}`}
          label="Board Name"
          value={board.name}
          fullWidth
          disabled
        />
      </Grid>
      {/* TODO: change active or inactive */}
      <Grid item xs={1}>
        <IconButton
          color="error"
          onClick={() => {
            setJiraConfig((prev) => {
              const newBoards = [...prev.boards]
              newBoards.splice(index, 1)
              return {
                ...prev,
                boards: newBoards
              }
            })
          }}
        >
          <Delete />
        </IconButton>
      </Grid>
    </Grid>
  )
}

export default memo(BoardItem)
