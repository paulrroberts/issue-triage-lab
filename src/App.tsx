import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    useReactTable,
    type SortingState,
} from '@tanstack/react-table'
import { createIssue, listIssues, updateIssue } from './api'
import { isStatus, priorities, statuses, type Issue, type NewIssue, type Status } from './types'

const issueKey = ['issues'] as const
const column = createColumnHelper<Issue>()

function displayError(error: unknown): string {
    return error instanceof Error ? error.message : 'Something went wrong. Please try again.'
}

export function App() {
    const queryClient = useQueryClient()
    const issuesQuery = useQuery({ queryKey: issueKey, queryFn: listIssues })
    const createMutation = useMutation({
        mutationFn: createIssue,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: issueKey }),
    })
    const updateMutation = useMutation({
        mutationFn: ({ id, changes }: { id: string; changes: { status: Status } }) => updateIssue(id, changes),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: issueKey }),
    })
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<Status | 'All'>('All')
    const [assigneeFilter, setAssigneeFilter] = useState<string>('')
    const [sorting, setSorting] = useState<SortingState>([{ id: 'updatedAt', desc: true }])
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [showForm, setShowForm] = useState(false)
    const [draft, setDraft] = useState<NewIssue>({
        title: '',
        description: '',
        priority: 'Medium',
        owner: '',
    })

    const issues = issuesQuery.data ?? []
    const assignees = [...new Set(issues.map((issue) => issue.owner))].sort()
    const selected = issues.find((issue) => issue.id === selectedId)
    const counts = {
        total: issues.length,
        active: issues.filter((issue) => issue.status === 'In progress').length,
        blocked: issues.filter((issue) => issue.status === 'Blocked').length,
        done: issues.filter((issue) => issue.status === 'Done').length,
    }

    const columns = useMemo(
        () => [
            column.accessor('id', {
                header: 'ID',
                cell: (info) => <span className="issue-id">{info.getValue()}</span>,
            }),
            column.accessor('title', {
                header: 'Issue',
                cell: (info) => <strong>{info.getValue()}</strong>,
            }),
            column.accessor('status', {
                header: 'Status',
                cell: (info) => <span className={`pill status-${info.getValue().toLowerCase().replace(' ', '-')}`}>{info.getValue()}</span>,
            }),
            column.accessor('priority', {
                header: 'Priority',
                cell: (info) => (
                    <span className={`priority priority-${info.getValue().toLowerCase()}`}>
                        <span aria-hidden="true">●</span> {info.getValue()}
                    </span>
                ),
            }),
            column.accessor('owner', { header: 'Owner' }),
            column.accessor('updatedAt', { header: 'Updated' }),
        ],
        [],
    )

    const table = useReactTable({
        data: issues,
        columns,
        state: { sorting, globalFilter: search },
        onSortingChange: setSorting,
        onGlobalFilterChange: setSearch,
        globalFilterFn: (row, _columnId, value: string) =>
            `${row.original.id} ${row.original.title} ${row.original.owner} ${row.original.description}`
                .toLowerCase()
                .includes(value.toLowerCase()),
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
    })
    const visibleRows = table
        .getRowModel()
        .rows.filter(
            (row) =>
                (statusFilter === 'All' || row.original.status === statusFilter) &&
                (assigneeFilter === '' || row.original.owner === assigneeFilter),
        )

    async function submitIssue(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (!draft.title.trim() || !draft.owner.trim()) return
        try {
            const created = await createMutation.mutateAsync({
                title: draft.title.trim(),
                description: draft.description.trim(),
                priority: draft.priority,
                owner: draft.owner.trim(),
            })
            setSelectedId(created.id)
            setDraft({ title: '', description: '', priority: 'Medium', owner: '' })
            setShowForm(false)
        } catch {
            /* Error is shown by the mutation state. */
        }
    }

    return (
        <div className="shell">
            <aside className="sidebar">
                <div className="brand">
                    <span className="brand-mark">◈</span>
                    <span>
                        TRIAGE<span className="brand-light">LAB</span>
                    </span>
                </div>
                <div className="side-label">WORKSPACE</div>
                <div className="side-link active">
                    <span>▦</span> Overview
                </div>
                <div className="side-link">
                    <span>◫</span> Issues <span className="side-count">{counts.total}</span>
                </div>
                <div className="sidebar-bottom">
                    <span className="avatar">TS</span>
                    <div>
                        <strong>TypeScript practice</strong>
                        <small>Local workspace</small>
                    </div>
                </div>
            </aside>

            <main className="main">
                <header className="topbar">
                    <div className="breadcrumb">
                        Workspace <span>/</span> Issues
                    </div>
                    <span className="topbar-tag">● Practice project</span>
                </header>
                <section className="content">
                    <div className="heading">
                        <div>
                            <div className="eyebrow">YOUR WORKSPACE</div>
                            <h1>Issue overview</h1>
                            <p>Track, prioritize, and move work forward.</p>
                        </div>
                        <button className="primary-button" onClick={() => setShowForm(true)}>
                            ＋ New issue
                        </button>
                    </div>

                    <div className="stats">
                        <Stat label="Total issues" value={counts.total} icon="▦" />
                        <Stat label="In progress" value={counts.active} icon="◷" />
                        <Stat label="Blocked" value={counts.blocked} icon="◇" />
                        <Stat label="Completed" value={counts.done} icon="✓" />
                    </div>

                    <section className="panel">
                        <div className="panel-heading">
                            <div>
                                <h2>All issues</h2>
                                <p>Explore your team's work and update its status.</p>
                            </div>
                            <span className="result-count">{visibleRows.length} results</span>
                        </div>
                        <div className="toolbar">
                            <label className="search">
                                <span aria-hidden="true">⌕</span>
                                <input
                                    aria-label="Search issues"
                                    placeholder="Search issues, people, or IDs..."
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                />
                            </label>
                            <label className="filter">
                                Status{' '}
                                <select
                                    value={statusFilter}
                                    onChange={(event) => {
                                        const value = event.target.value
                                        setStatusFilter(isStatus(value) ? value : 'All')
                                    }}
                                >
                                    <option>All</option>
                                    {statuses.map((status) => (
                                        <option key={status}>{status}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="filter">
                                Assignee{' '}
                                <select value={assigneeFilter} onChange={(event) => setAssigneeFilter(event.target.value)}>
                                    <option value="">All owners</option>
                                    {assignees.map((assignee) => (
                                        <option key={assignee} value={assignee}>
                                            {assignee}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        {issuesQuery.isPending ? (
                            <div className="message">Loading issues…</div>
                        ) : issuesQuery.isError ? (
                            <div className="message error">
                                {displayError(issuesQuery.error)} <button onClick={() => issuesQuery.refetch()}>Retry</button>
                            </div>
                        ) : (
                            <div className="table-wrap">
                                <table>
                                    <thead>
                                        {table.getHeaderGroups().map((group) => (
                                            <tr key={group.id}>
                                                {group.headers.map((header) => (
                                                    <th key={header.id}>
                                                        <button className="sort-button" onClick={header.column.getToggleSortingHandler()}>
                                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                                            <span className="sort-indicator">
                                                                {header.column.getIsSorted() === 'asc'
                                                                    ? ' ↑'
                                                                    : header.column.getIsSorted() === 'desc'
                                                                      ? ' ↓'
                                                                      : ' ↕'}
                                                            </span>
                                                        </button>
                                                    </th>
                                                ))}
                                            </tr>
                                        ))}
                                    </thead>
                                    <tbody>
                                        {visibleRows.map((row) => (
                                            <tr
                                                key={row.id}
                                                className={selectedId === row.original.id ? 'selected-row' : ''}
                                                onClick={() => setSelectedId(row.original.id)}
                                            >
                                                {row.getVisibleCells().map((cell) => (
                                                    <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {visibleRows.length === 0 && <div className="message">No issues match these filters.</div>}
                            </div>
                        )}
                    </section>

                    {selected && (
                        <section className="detail panel">
                            <div>
                                <div className="eyebrow">
                                    {selected.id} · {selected.priority} PRIORITY
                                </div>
                                <h2>{selected.title}</h2>
                                <p>{selected.description || 'No description yet.'}</p>
                                <div className="detail-meta">
                                    Owner: <strong>{selected.owner}</strong> <span>·</span> Updated {selected.updatedAt}
                                </div>
                            </div>
                            <label>
                                Move to{' '}
                                <select
                                    value={selected.status}
                                    disabled={updateMutation.isPending}
                                    onChange={(event) => {
                                        if (isStatus(event.target.value))
                                            updateMutation.mutate({
                                                id: selected.id,
                                                changes: { status: event.target.value },
                                            })
                                    }}
                                >
                                    {statuses.map((status) => (
                                        <option key={status}>{status}</option>
                                    ))}
                                </select>
                            </label>
                            {updateMutation.isError && <div className="error">{displayError(updateMutation.error)}</div>}
                        </section>
                    )}
                </section>
            </main>

            {showForm && (
                <div
                    className="modal-backdrop"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) setShowForm(false)
                    }}
                >
                    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
                        <div className="modal-heading">
                            <div>
                                <div className="eyebrow">NEW WORK</div>
                                <h2 id="modal-title">Create an issue</h2>
                            </div>
                            <button className="close-button" aria-label="Close" onClick={() => setShowForm(false)}>
                                ×
                            </button>
                        </div>
                        <form onSubmit={submitIssue}>
                            <label>
                                Title
                                <input
                                    autoFocus
                                    required
                                    maxLength={120}
                                    placeholder="What needs to be done?"
                                    value={draft.title}
                                    onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                                />
                            </label>
                            <label>
                                Description
                                <textarea
                                    rows={4}
                                    placeholder="Add helpful context…"
                                    value={draft.description}
                                    onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                                />
                            </label>
                            <div className="form-grid">
                                <label>
                                    Priority
                                    <select
                                        value={draft.priority}
                                        onChange={(event) =>
                                            setDraft({
                                                ...draft,
                                                priority: event.target.value as NewIssue['priority'],
                                            })
                                        }
                                    >
                                        {priorities.map((priority) => (
                                            <option key={priority}>{priority}</option>
                                        ))}
                                    </select>
                                </label>
                                <label>
                                    Owner
                                    <input
                                        required
                                        maxLength={60}
                                        placeholder="Name"
                                        value={draft.owner}
                                        onChange={(event) => setDraft({ ...draft, owner: event.target.value })}
                                    />
                                </label>
                            </div>
                            {createMutation.isError && <div className="error">{displayError(createMutation.error)}</div>}
                            <div className="form-actions">
                                <button type="button" className="secondary-button" onClick={() => setShowForm(false)}>
                                    Cancel
                                </button>
                                <button className="primary-button" disabled={createMutation.isPending}>
                                    {createMutation.isPending ? 'Creating…' : 'Create issue'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

function Stat({ label, value, icon }: { label: string; value: number; icon: string }) {
    return (
        <div className="stat">
            <span className="stat-icon">{icon}</span>
            <span className="stat-label">{label}</span>
            <strong>{value}</strong>
        </div>
    )
}
