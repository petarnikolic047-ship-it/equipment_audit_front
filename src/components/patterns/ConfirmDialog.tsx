import type { ReactNode } from 'react'
import { Dialog } from '../primitives/Dialog'
import { Button } from '../primitives/Button'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  intent?: 'danger' | 'default'
  onConfirm: () => void
  onClose: () => void
  footerNote?: ReactNode
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  intent = 'default',
  onConfirm,
  onClose,
  footerNote,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title={title} description={description}>
      <div className="flex items-center justify-between gap-3 pt-2">
        <div>{footerNote}</div>
        <div className="flex gap-2">
          <Button onClick={onClose}>{cancelText}</Button>
          <Button variant={intent === 'danger' ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmText}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
