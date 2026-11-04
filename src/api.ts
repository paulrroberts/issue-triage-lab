import type { Issue, IssueChanges, NewIssue } from './types'

const STORAGE_KEY = 'issue-triage-lab:v1'

const seed: Issue[] = [
    {
        id: 'ISS-101',
        title: 'Improve dashboard loading state',
        description: 'Show a clear skeleton while the issue list is loading.',
        status: 'In progress',
        priority: 'High',
        owner: 'Alex',
        createdAt: '2026-10-24',
        updatedAt: '2026-11-02',
    },
    {
        id: 'ISS-102',
        title: 'Investigate duplicate notifications',
        description: 'Users receive two emails after changing an issue status.',
        status: 'Blocked',
        priority: 'Critical',
        owner: 'Morgan',
        createdAt: '2026-10-25',
        updatedAt: '2026-11-03',
    },
    {
        id: 'ISS-103',
        title: 'Add keyboard shortcuts',
        description: 'Make common triage actions available from the keyboard.',
        status: 'Backlog',
        priority: 'Medium',
        owner: 'Taylor',
        createdAt: '2026-10-27',
        updatedAt: '2026-10-27',
    },
    {
        id: 'ISS-104',
        title: 'Review empty search results',
        description: 'Provide a useful message when no issues match the current filters.',
        status: 'Done',
        priority: 'Low',
        owner: 'Sam',
        createdAt: '2026-10-20',
        updatedAt: '2026-10-30',
    },
    {
        id: 'ISS-105',
        title: 'Fix export date formatting',
        description: 'Exported dates should use an unambiguous ISO format.',
        status: 'Backlog',
        priority: 'High',
        owner: 'Alex',
        createdAt: '2026-10-29',
        updatedAt: '2026-10-29',
    },
    {
        id: 'ISS-106',
        title: 'Audit issue detail accessibility',
        description: 'Check headings, labels, and focus order in the detail panel.',
        status: 'In progress',
        priority: 'Medium',
        owner: 'Morgan',
        createdAt: '2026-11-01',
        updatedAt: '2026-11-04',
    },
]

function readIssues(): Issue[] {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
        return seed
    }
    // The storage boundary is untrusted at runtime, even though our app writes typed data.
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) throw new Error('Saved issues are invalid. Clear this site’s storage and reload.')
    return parsed as Issue[]
}

function writeIssues(issues: Issue[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(issues))
}

async function simulateRequest(): Promise<void> {
    await new Promise((resolve) => window.setTimeout(resolve, 300))
}

export async function listIssues(): Promise<Issue[]> {
    await simulateRequest()
    return readIssues()
}

export async function createIssue(input: NewIssue): Promise<Issue> {
    await simulateRequest()
    const issues = readIssues()
    const now = new Date().toISOString().slice(0, 10)
    const issue: Issue = {
        ...input,
        id: `ISS-${Math.max(100, ...issues.map((item) => Number(item.id.replace('ISS-', '')) || 100)) + 1}`,
        status: 'Backlog',
        createdAt: now,
        updatedAt: now,
    }
    writeIssues([issue, ...issues])
    return issue
}

export async function updateIssue(id: string, changes: IssueChanges): Promise<Issue> {
    await simulateRequest()
    const issues = readIssues()
    const index = issues.findIndex((item) => item.id === id)
    if (index === -1) throw new Error(`Issue ${id} was not found`)
    const updated: Issue = {
        ...issues[index],
        ...changes,
        updatedAt: new Date().toISOString().slice(0, 10),
    }
    writeIssues(issues.map((item, position) => (position === index ? updated : item)))
    return updated
}
