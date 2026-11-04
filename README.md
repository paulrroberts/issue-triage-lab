# Issue Triage Lab

A small React + TypeScript project for practicing the patterns that come up in frontend interviews. It uses [TanStack Query](https://tanstack.com/query/latest/docs/framework/react/overview) for asynchronous reads and mutations and [TanStack Table](https://tanstack.com/table/latest/docs/framework/react/overview) for sorting and filtering a typed issue list.

## Run it

Requires Node 20.19+ or 22.12+ and npm.

```bash
npm install
npm run dev
```

Open the localhost URL printed by Vite. `npm run typecheck` checks TypeScript; `npm run build` checks types and creates a production bundle. Data is saved in your browser's local storage. No account or external API is needed.

## What to inspect first

1. `src/types.ts` — literal unions (`Status`, `Priority`), interfaces, `Pick`, `Partial`, and a type guard.
2. `src/api.ts` — an asynchronous API boundary and strongly typed input/output. It simulates latency and saves to local storage so the app works offline.
3. `src/App.tsx` — inferred query data, typed mutations, cache invalidation, and typed TanStack Table columns.

## Practice path

Each step is small enough for a focused session. Run `npm run typecheck` after each change.

1. **Add an assignee filter.** Add a select next to the status filter, derive unique owners from the query data, and combine it with the visible row filter. Explain the difference between a union such as `Status | 'All'` and a general `string`.
2. **Add editing.** Let users change an issue title and priority in the detail panel. Reuse `IssueChanges` from `src/types.ts`; widen the update mutation input accordingly. Explain why `Partial<Pick<...>>` is safer than accepting any `Issue` property.
3. **Add optimistic status updates.** Use `onMutate`, `setQueryData<Issue[]>`, rollback in `onError`, and invalidate in `onSettled`. Explain what happens if the request fails.
4. **Replace local storage with an HTTP API.** Keep the same `listIssues`, `createIssue`, and `updateIssue` signatures. Validate response data at runtime (for example, with Zod) before treating it as `Issue[]`.
5. **Add a detail route.** Use TanStack Router with an `/issues/$issueId` route and typed search parameters for filters.

## Interview talking points

- TypeScript catches invalid issue statuses before runtime, but external data still requires runtime validation.
- Query owns fetching, cache freshness, mutation state, and invalidation; components render those states.
- Table owns row modeling and sorting. UI and business rules, such as the status filter, remain explicit in the component.
- The local storage adapter is deliberately replaceable; a real API can use the same typed contract.

The app is a learning starter, not a production backend. Local storage is per browser and is not shared with other users.
