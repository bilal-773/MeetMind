import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'
import type { Meeting } from '@/types'
import { Copy, Check, Printer, ChevronUp, ChevronDown } from 'lucide-react'

interface Props { meeting: Meeting }

// Section metadata for TOC rendering
const SECTION_ICONS: Record<string, string> = {
  'Executive Summary': '📋',
  'Agenda': '📌',
  'Detailed Discussion': '💬',
  'Decisions Made': '✅',
  'Action Items': '🎯',
  'Open Issues': '⚠️',
  'Next Steps': '🚀',
}

// Detect which "section" a heading belongs to
function getSectionIcon(text: string): string {
  for (const [key, icon] of Object.entries(SECTION_ICONS)) {
    if (text.toLowerCase().includes(key.toLowerCase())) return icon
  }
  return '📄'
}

const customComponents: Components = {
  // h1 — document title
  h1: ({ children }) => (
    <h1 className="minutes-h1">{children}</h1>
  ),
  // h2 — main sections (numbered)
  h2: ({ children }) => {
    const text = String(children)
    const icon = getSectionIcon(text)
    return (
      <h2 className="minutes-h2">
        <span className="minutes-section-icon">{icon}</span>
        {children}
      </h2>
    )
  },
  // h3 — subsections
  h3: ({ children }) => (
    <h3 className="minutes-h3">{children}</h3>
  ),
  // Paragraphs
  p: ({ children }) => (
    <p className="minutes-p">{children}</p>
  ),
  // Strong text
  strong: ({ children }) => (
    <strong className="minutes-strong">{children}</strong>
  ),
  // Unordered list
  ul: ({ children }) => (
    <ul className="minutes-ul">{children}</ul>
  ),
  // Ordered list
  ol: ({ children }) => (
    <ol className="minutes-ol">{children}</ol>
  ),
  // List item
  li: ({ children }) => (
    <li className="minutes-li">{children}</li>
  ),
  // Horizontal rule — section divider
  hr: () => <div className="minutes-divider" />,
  // Blockquote — used for "No items" notices
  blockquote: ({ children }) => (
    <blockquote className="minutes-blockquote">{children}</blockquote>
  ),
  // Table
  table: ({ children }) => (
    <div className="minutes-table-wrap">
      <table className="minutes-table">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="minutes-thead">{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr className="minutes-tr">{children}</tr>,
  th: ({ children }) => <th className="minutes-th">{children}</th>,
  td: ({ children }) => {
    const text = String(children)
    // Colour-code priority cells
    let cls = 'minutes-td'
    if (text === 'High') cls += ' priority-high'
    else if (text === 'Medium') cls += ' priority-medium'
    else if (text === 'Low') cls += ' priority-low'
    else if (text === 'Open') cls += ' status-open'
    return <td className={cls}>{children}</td>
  },
  // Inline code (e.g. env vars)
  code: ({ children }) => (
    <code className="minutes-code">{children}</code>
  ),
}

export default function MinutesPanel({ meeting }: Props) {
  const minutes = meeting.minutesEn
  const [copied, setCopied] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const handleCopy = async () => {
    if (!minutes) return
    await navigator.clipboard.writeText(minutes)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow || !minutes) return
    printWindow.document.write(`
      <html><head><title>${meeting.title} — Minutes</title>
      <style>
        body { font-family: 'Inter', system-ui, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #1e293b; line-height: 1.7; }
        h1 { font-size: 22px; font-weight: 800; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 24px; }
        h2 { font-size: 17px; font-weight: 700; color: #4f46e5; margin: 28px 0 10px; }
        h3 { font-size: 14px; font-weight: 600; margin: 18px 0 6px; }
        p, li { font-size: 13px; color: #475569; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; margin: 14px 0; }
        th { background: #f1f5f9; padding: 8px 12px; text-align: left; font-weight: 600; border: 1px solid #e2e8f0; }
        td { padding: 8px 12px; border: 1px solid #e2e8f0; }
        blockquote { border-left: 3px solid #c7d2fe; padding: 8px 14px; color: #64748b; background: #f8fafc; margin: 10px 0; }
        code { background: #f1f5f9; padding: 1px 5px; border-radius: 3px; font-family: monospace; font-size: 11px; }
        hr { border: none; border-top: 1px solid #e2e8f0; margin: 20px 0; }
      </style></head><body>
      <pre style="white-space:pre-wrap;font-family:inherit">${meeting.title} — Meeting Minutes</pre>
    `)
    printWindow.document.write('</body></html>')
    printWindow.document.close()
    printWindow.print()
  }

  if (!minutes) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📋</div>
        <h3>No Minutes Available</h3>
        <p>Meeting minutes will appear here once the AI processing is complete.</p>
      </div>
    )
  }

  return (
    <div className="minutes-panel">
      {/* Toolbar */}
      <div className="minutes-toolbar">
        <div className="minutes-toolbar-left">
          <span className="minutes-toolbar-label">AI-Generated Minutes</span>
          <span className="minutes-toolbar-badge">Markdown</span>
        </div>
        <div className="minutes-toolbar-right">
          <button
            className="minutes-tool-btn"
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            {collapsed ? 'Expand' : 'Collapse'}
          </button>
          <button className="minutes-tool-btn" onClick={handlePrint} title="Print">
            <Printer size={14} />
            Print
          </button>
          <button
            className={`minutes-tool-btn${copied ? ' copied' : ''}`}
            onClick={handleCopy}
            title="Copy to clipboard"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Content */}
      {!collapsed && (
        <div className="minutes-content" dir="ltr">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={customComponents}
          >
            {minutes}
          </ReactMarkdown>
        </div>
      )}
    </div>
  )
}
