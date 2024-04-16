import { ChangeEvent, memo } from 'react'
import { Grid, TextField, IconButton } from '@mui/material'
import { Board } from '@renderer/types'
import { Delete } from '@mui/icons-material'

interface BoardItemProps {
  boards: Board[]
  board: Board
  index: number
  onBoardChange: (boards: Board[]) => void
}

const BoardItem: React.FC<BoardItemProps> = (props: BoardItemProps) => {
  const { boards, board, index, onBoardChange } = props

  function handleChange(event: ChangeEvent): void {
    const target = event.target as HTMLInputElement
    boards[index].name = target.value
    onBoardChange(boards)
  }

  function handleRemove(): void {
    boards.splice(index, 1)
    onBoardChange(boards)
  }

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
          onChange={handleChange}
        />
      </Grid>
      {/* TODO: change active or inactive */}
      <Grid item xs={1}>
        <IconButton color="error" onClick={handleRemove}>
          <Delete />
        </IconButton>
      </Grid>
    </Grid>
  )
}

export default memo(BoardItem)
