# Flexible Prompt Support Plan

## Overview

Transform the BasicPrompt component to support both simple database-stored prompts and complex function-based prompt chains through a unified handler pattern. This will enable mixing basic prompts with advanced workflows (chained prompts, API calls, tool usage) in the same UI.

## Current State

- Mock data in `src/server/db/promptTemplates.ts` returns sample `PromptTemplate` objects
- BasicPrompt component directly consumes these mock templates
- Limited to simple string-based prompts with `{{INPUT}}` substitution

## Goal Architecture

### Handler Pattern
Create a unified interface that abstracts prompt execution:

```typescript
type PromptHandler = {
  id: string; // For React keys and selection tracking
  name: string;
  description?: string;
  category: 'basic' | 'advanced';
  execute: (params: { 
    input: string; 
    runCount: number; 
  }) => Promise<MultiplePromptResults>;
};
```

### Component Responsibilities

**BasicPromptWrapper:**
- Fetches database prompt templates (currently mock data)
- Converts DB templates to PromptHandler functions
- Adds hardcoded complex prompt handlers
- Provides unified array to BasicPrompt

**BasicPrompt:**
- Pure UI component, agnostic to prompt source
- Renders dropdown from handler names
- Calls `handler.execute()` on submit
- Handles loading/error states uniformly

## Database Design (Future Implementation)

### Schema Addition
```sql
CREATE TABLE prompt_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(256) NOT NULL,
  description TEXT,
  text TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'basic',
  user_id VARCHAR(256), -- For user-specific prompts (Clerk integration)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_prompt_templates_user_id ON prompt_templates(user_id);
CREATE INDEX idx_prompt_templates_category ON prompt_templates(category);
```

### Drizzle Schema
```typescript
export const promptTemplates = createTable(
  "prompt_template",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    name: varchar("name", { length: 256 }).notNull(),
    description: text("description"),
    text: text("text").notNull(),
    category: varchar("category", { length: 50 }).default('basic'),
    userId: varchar("user_id", { length: 256 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date()
    ),
  },
  (table) => [
    index(indexName("prompt_template_user_id")).on(table.userId),
    index(indexName("prompt_template_category")).on(table.category),
  ]
);
```

## Breaking Changes Required

### UI Component State Changes
Current BasicPrompt uses numeric prompt IDs:
```typescript
const [selectedPromptId, setSelectedPromptId] = useState<number>(1);
```

New BasicPrompt will use string handler IDs:
```typescript
const [selectedHandlerId, setSelectedHandlerId] = useState<string>('db-1');
```

### Props Interface Change
```typescript
// Current
interface BasicPromptProps {
  promptTemplates: PromptTemplate[];
}

// New
interface BasicPromptProps {
  promptHandlers: PromptHandler[];
}
```

## Implementation Plan

### Phase 1: Handler Pattern Foundation
1. Create `src/types/promptHandler.ts` with PromptHandler type
2. Create `src/utils/createDbPromptHandler.ts` utility function
3. Update BasicPromptWrapper:
   - Fetch mock data as before
   - Convert to handlers using utility
   - Pass handlers to BasicPrompt
4. Update BasicPrompt:
   - Change props interface to accept handlers
   - Update state from `selectedPromptId` to `selectedHandlerId`
   - Update Select component to use handler.id and handler.name
   - Update submit to call `selectedHandler.execute()`
5. Test with existing mock data

### Phase 2: Complex Handler Examples
1. Create sample complex prompt handlers (chains, API calls, etc.)
2. Add handler descriptions/tooltips
3. Test error handling (all handlers return basic error messages)

### Phase 3: Database Migration (When Ready)
1. Create database migration for prompt_templates table
2. Update mock data service to use real database
3. Add CRUD operations for prompt templates
4. User authentication integration for user-specific prompts

## Benefits

### Flexibility
- Mix simple DB prompts with complex function chains
- Easy to add new prompt types without UI changes
- Consistent user experience regardless of complexity

### Maintainability
- Clear separation of concerns
- Testable handler functions
- Gradual migration path from mock to database

### Scalability
- Support for user-specific prompts
- Category-based organization
- Clear path for future sharing features

## Example Handler Implementations

### Server Action Strategy

Database prompt handlers will use the existing `multipleBasicPrompts` action directly:

```typescript
// Use existing multipleBasicPrompts action in handlers
execute: ({ input, runCount }) => multipleBasicPrompts({
  promptId: template.id,
  input,
  runCount
})
```

### Handler ID Conventions

**Database Prompts**: `db-${template.id}` (e.g., `db-1`, `db-2`)

**Complex Handlers**: Hard-coded descriptive strings (e.g., `research-analysis`, `web-scraper`, `code-reviewer`)

### Database Prompt Handler
```typescript
const createDbPromptHandler = (template: PromptTemplate): PromptHandler => ({
  id: `db-${template.id}`,
  name: template.name,
  category: 'basic',
  execute: ({ input, runCount }) => multipleBasicPrompts({
    promptId: template.id,
    input,
    runCount
  })
});
```

### Complex Chain Handler
```typescript
const researchChainHandler: PromptHandler = {
  id: 'research-analysis', // Hard-coded descriptive ID
  name: 'Research & Analysis Chain',
  category: 'advanced',
  description: 'Performs web search, analysis, and summary generation',
  execute: async ({ input, runCount }) => {
    // 1. Search for information
    // 2. Analyze findings
    // 3. Generate comprehensive report
    // Returns same format as basic prompts
  }
};
```

## Migration Strategy

1. **Phase 1**: Implement handler pattern with existing mock data (breaking changes to component interface)
2. **Phase 2**: Add complex handlers alongside mock data
3. **Phase 3**: Replace mock data with database when ready

This approach ensures a clear progression from mock data to flexible handlers to eventual database storage.
