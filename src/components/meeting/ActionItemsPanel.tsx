import { useState } from 'react'
import { useMeetingStore } from '@/stores/meetingStore'
import { CheckSquare, Copy, Check, User, Calendar, Tag } from 'lucide-react'
import type { Meeting, ActionItem } from '@/types'

interface Props { meeting: Meeting }

type Filter = 'all' | 'pending' | 'done'

const PRIORITY_COLORS: Record<string, string> = {
  high:   'var(--priority-high)',
  medium: 'var(--priority-medium)',
  low:    'var(--priority-low)',
}

const PRIORITY_BG: Record<string, string> = {
  high:   'var(--error-light)',
  medium: 'var(--warning-light)',
  low:    'var(--success-light)',
}

export default function ActionItemsPanel({ meeting }: Props) {
  const { updateActionItemComplete } = useMeetingStore()
  const [filter, setFilter] = useState<Filter>('all')
  const [copied, setCopied] = useState(false)

  const items = meeting.actionItems.filter((a) => {
    if (filter === 'pending') return !a.isCompleted
    if (filter === 'done') return a.isCompleted
    return true
  })

  const copyAll = () => {
    const text = meeting.actionItems.map((a) =>
      `- [${a.isCompleted ? 'x' : ' '}] ${a.task}${a.owner ? ` (@${a.owner})` : ''}${a.deadline ? ` — Due: ${a.deadline}` : ''}`
    ).join('\n')
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const pending = meeting.actionItems.filter((a) => !a.isCompleted).length
  const done    = meeting.actionItems.filter((a) => a.isCompleted).length

  return (
    <div>
      {/* Summary */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, padding: '12px 16px', background: 'var(--error-light)', borderRadius: 'var(--radius)', textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--priority-high)' }}>{pending}</div>
          <div style={{ fontSize: 11, color: 'var(--priority-high)', fontWeight: 500 }}>Pending</div>
        </div>
        <div style={{ flex: 1, padding: '12px 16px', background: 'var(--success-light)', borderRadius: 'var(--radius)', textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--priority-low)' }}>{done}</div>
          <div style={{ fontSize: 11, color: 'var(--priority-low)', fontWeight: 500 }}>Done</div>
        </div>
      </div>

      {/* Filter + Copy */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
        <div className="tabs" style={{ flex: 1 }}>
          {(['all', 'pending', 'done'] as Filter[]).map((f) => (
            <button
              key={f}
              className={`tab${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button
          className="btn btn-sm btn-secondary"
          onClick={copyAll}
          id="copy-actions"
        >
          {copied ? <Check size={13} color="var(--success)" /> : <Copy size={13} />}
          {copied ? 'Copied!' : 'Copy All'}
        </button>
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <div className="empty-state" style={{ padding: '40px 16px' }}>
          <div className="empty-icon"><CheckSquare size={22} /></div>
          <h3>{filter === 'done' ? 'No completed tasks' : 'No action items'}</h3>
          <p>Action items extracted from the transcript will appear here.</p>
        </div>
      ) : (
        items.map((item) => <ActionCard key={item.id} item={item} onToggle={updateActionItemComplete} />)
      )}
    </div>
  )
}

function ActionCard({ item, onToggle }: { item: ActionItem; onToggle: (id: string, v: boolean) => void }) {
  return (
    <div
      className="action-card"
      style={{ opacity: item.isCompleted ? 0.6 : 1 }}
    >
      <div
        className="priority-dot"
        style={{ background: PRIORITY_COLORS[item.priority] }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          className="action-task"
          style={{ textDecoration: item.isCompleted ? 'line-through' : 'none' }}
        >
          {item.task}
        </p>

        <div className="action-meta">
          {item.owner && (
            <span className="badge badge-indigo">
              <User size={10} /> {item.owner}
            </span>
          )}
          {item.deadline && (
            <span className="badge badge-sky">
              <Calendar size={10} /> {item.deadline}
            </span>
          )}
          <span
            className="badge"
            style={{
              background: PRIORITY_BG[item.priority],
              color: PRIORITY_COLORS[item.priority],
            }}
          >
            <Tag size={10} /> {item.priority}
          </span>
        </div>

        {item.context && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>
            {item.context}
          </p>
        )}
      </div>

      <button
        onClick={() => onToggle(item.id, !item.isCompleted)}
        style={{
          width: 22, height: 22, borderRadius: 'var(--radius-sm)',
          border: `2px solid ${item.isCompleted ? 'var(--success)' : 'var(--border)'}`,
          background: item.isCompleted ? 'var(--success)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', flexShrink: 0, marginTop: 2, transition: 'var(--transition)',
          color: 'white',
        }}
        aria-label={item.isCompleted ? 'Mark incomplete' : 'Mark complete'}
      >
        {item.isCompleted && <Check size={13} />}
      </button>
    </div>
  )
}
