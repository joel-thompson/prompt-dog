---
trigger: always_on
description: Use pnpm as my package manager
globs: **/*.ts, **/*.tsx, package.json
---

This project uses the following: 
- next.js 15 with the app router
- clerk for authentication
- vitest for testing
- tailwind 4 for css
- shadcn for component library
- TanStack Query (react-query)

Always use pnpm as my package manager when adding/updating/removing packages

When adding new components, use shadcn when possible

Pages that require authentication go under the (authenticated) route group

Publicly accessible pages go under the (unauthenticated) route