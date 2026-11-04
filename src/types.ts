export const statuses = ['Backlog', 'In progress', 'Blocked', 'Done'] as const
export const priorities = ['Low', 'Medium', 'High', 'Critical'] as const

export type Status = (typeof statuses)[number]
export type Priority = (typeof priorities)[number]

export interface Issue {
    id: string
    title: string
    description: string
    status: Status
    priority: Priority
    owner: string
    createdAt: string
    updatedAt: string
}

export type NewIssue = Pick<Issue, 'title' | 'description' | 'priority' | 'owner'>
export type IssueChanges = Partial<Pick<Issue, 'title' | 'description' | 'status' | 'priority' | 'owner'>>

export function isStatus(value: string): value is Status {
    return statuses.some((status) => status === value)
}
