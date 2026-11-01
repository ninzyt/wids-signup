import { useRef, useState, type ReactNode } from 'react'
import * as Dialog from '@radix-ui/react-dialog'

export function EventModal({ title, description, children, onClose, busy = false }: {
  title: string; description: string; children: ReactNode; onClose: () => void; busy?: boolean
}) {
  // Capture the trigger before Radix moves focus into its portal.
  const [opener] = useState(() => document.activeElement as HTMLElement | null)
  const content = useRef<HTMLDivElement>(null)
  return <Dialog.Root open onOpenChange={open => { if (!open && !busy) onClose() }}>
    <Dialog.Portal><Dialog.Overlay className="modal-overlay" />
      <Dialog.Content ref={content} className="event-modal" onOpenAutoFocus={event => {
        const input = content.current?.querySelector('input')
        if (input) { event.preventDefault(); input.focus() }
      }} onCloseAutoFocus={event => { event.preventDefault(); opener?.focus() }}
        onEscapeKeyDown={event => { if (busy) event.preventDefault() }}
        onPointerDownOutside={event => { if (busy) event.preventDefault() }}>
        <div className="window-bar"><span>wids / event-notes.txt</span><Dialog.Close asChild><button className="modal-close" aria-label="Close dialog" disabled={busy}>×</button></Dialog.Close></div>
        <div className="modal-body"><Dialog.Title className="modal-title">{title}</Dialog.Title>
          <Dialog.Description className="modal-description">{description}</Dialog.Description>{children}</div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
}

