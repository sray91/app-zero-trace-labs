'use client'

import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { Bot, LifeBuoy, MessageCircle, Send, X } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/convex/_generated/api'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function MessageBubble({ message }) {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'

  if (isSystem) {
    return (
      <div className="px-6 py-1 text-center text-xs text-muted-foreground">
        {message.text}
      </div>
    )
  }

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-muted text-foreground rounded-bl-sm'
        )}
      >
        {!isUser && (
          <div className="mb-0.5 flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
            {message.role === 'bot' ? (
              <>
                <Bot className="h-3 w-3" /> Assistant
              </>
            ) : (
              <>
                <LifeBuoy className="h-3 w-3" /> {message.authorName || 'Support'}
              </>
            )}
          </div>
        )}
        {message.text}
      </div>
    </div>
  )
}

export function SupportWidget() {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef(null)

  const data = useQuery(api.support.forCurrentUser)
  const sendMessage = useMutation(api.support.sendMessage)
  const requestHuman = useMutation(api.support.requestHuman)

  const messages = data?.messages ?? []
  const status = data?.conversation?.status ?? 'bot'
  const waitingOnBot =
    status === 'bot' &&
    messages.length > 0 &&
    messages[messages.length - 1].role === 'user'

  // Keep the newest message in view.
  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [open, messages.length, waitingOnBot])

  const handleSend = async (e) => {
    e?.preventDefault()
    const text = draft.trim()
    if (!text || sending) return
    setSending(true)
    setDraft('')
    try {
      await sendMessage({ text })
    } catch {
      setDraft(text)
      toast.error("Couldn't send your message. Please try again.")
    } finally {
      setSending(false)
    }
  }

  const handleRequestHuman = async () => {
    try {
      await requestHuman()
    } catch {
      toast.error('Something went wrong. Please try again.')
    }
  }

  return (
    <>
      {/* Launcher */}
      <Button
        size="icon"
        aria-label={open ? 'Close support chat' : 'Open support chat'}
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-50 h-12 w-12 rounded-full shadow-lg"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </Button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-20 right-5 z-50 flex h-[min(70vh,32rem)] w-[min(24rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-xl border bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <div className="text-sm font-semibold">Support</div>
              <div className="text-xs text-muted-foreground">
                {status === 'human'
                  ? 'Connected to our team'
                  : 'Ask us anything about 0TraceLabs'}
              </div>
            </div>
            {status === 'bot' && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={handleRequestHuman}
              >
                <LifeBuoy className="mr-1 h-3.5 w-3.5" />
                Talk to a human
              </Button>
            )}
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            <MessageBubble
              message={{
                role: 'bot',
                text: "Hi! I'm the 0TraceLabs assistant. Ask me anything about scans, removals, or your account — or tap \"Talk to a human\" and our team will jump in.",
              }}
            />
            {messages.map((m) => (
              <MessageBubble key={m._id} message={m} />
            ))}
            {waitingOnBot && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-sm text-muted-foreground">
                  <span className="animate-pulse">Typing…</span>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="flex items-end gap-2 border-t p-3">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              rows={1}
              placeholder="Type a message…"
              className="max-h-28 flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!draft.trim() || sending}
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  )
}
