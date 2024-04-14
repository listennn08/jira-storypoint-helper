import { memo, useState } from 'react'
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel
} from '@mui/material'

const DownloadDialog = ({
  open,
  handleClose,
  handleConfirm
}: {
  open: boolean
  handleClose: () => void
  handleConfirm: (exportPrivateKeys: boolean) => void
}): JSX.Element => {
  const [exportPrivateKeys, setExportPrivateKeys] = useState(false)

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Download Dialog</DialogTitle>
      <DialogContent>
        <FormControlLabel
          control={
            <Checkbox
              checked={exportPrivateKeys}
              onChange={(e) => setExportPrivateKeys(e.target.checked)}
            />
          }
          label="Export private keys"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={() => {
            handleClose()
            handleConfirm(exportPrivateKeys)
          }}
        >
          Download
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default memo(DownloadDialog)
