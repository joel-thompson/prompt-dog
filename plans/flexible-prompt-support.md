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

## Implementation Checklist

### Phase 1: Handler Pattern Foundation

#### Core Types and Utilities
- [ ] **Create `src/types/promptHandler.ts`**
  - [ ] Define `MultiplePromptResults` type (if not already exported)
  - [ ] Define `PromptHandler` type with execute function signature
  - [ ] Export types for use across components

- [ ] **Create `src/utils/createDbPromptHandler.ts`**
  - [ ] Import `PromptTemplate` type from existing schema
  - [ ] Import `multipleBasicPrompts` server action
  - [ ] Create utility function that converts PromptTemplate to PromptHandler
  - [ ] Follow handler ID convention: `db-${template.id}`

#### Component Updates

- [ ] **Update `src/components/BasicPromptWrapper.tsx`**
  - [ ] Import new types and utility function
  - [ ] Convert mock PromptTemplate data to PromptHandler array
  - [ ] Pass handlers array to BasicPrompt instead of templates
  - [ ] Maintain existing data fetching logic

- [ ] **Update `src/components/BasicPrompt.tsx`**
  - [ ] Update props interface: `promptHandlers: PromptHandler[]` instead of `promptTemplates`
  - [ ] Change state: `selectedHandlerId: string` instead of `selectedPromptId: number`
  - [ ] Update Select component to use `handler.id` and `handler.name`
  - [ ] Update form submission to call `selectedHandler.execute({ input, runCount })`
  - [ ] Ensure error handling works with new handler pattern

- [ ] **Test Phase 1 Implementation**
  - [ ] Verify existing mock data still works
  - [ ] Test prompt selection and execution
  - [ ] Verify multiple runs still work correctly
  - [ ] Check error states display properly

### Phase 2: Advanced Handler Examples

#### JSON Response Handler
- [ ] **Create `src/server/handlers/jsonResponseHandler.ts`**
  - [ ] Import `basicPromptJson` server action
  - [ ] Implement handler following the plan specification
  - [ ] Test error handling and multiple runs
  - [ ] Format response with Answer/Reasoning sections

- [ ] **Add handler to BasicPromptWrapper**
  - [ ] Import jsonResponseHandler
  - [ ] Add to handlers array alongside database handlers
  - [ ] Test dropdown shows both basic and advanced prompts

#### UI Enhancements
- [ ] **Add handler descriptions/tooltips**
  - [ ] Update Select component to show handler descriptions
  - [ ] Consider adding category badges (basic/advanced)
  - [ ] Improve visual distinction between handler types

- [ ] **Additional Advanced Handlers (Optional)**
  - [ ] Create placeholder handlers for future development
  - [ ] Add handler for chained prompts example
  - [ ] Add handler for API integration example

#### Testing and Polish
- [ ] **Comprehensive Testing**
  - [ ] Test all handler types work correctly
  - [ ] Verify error messages are consistent
  - [ ] Test multiple runs for both basic and advanced handlers
  - [ ] Check loading states work properly

- [ ] **Code Quality**
  - [ ] Run linting: `pnpm lint`
  - [ ] Ensure TypeScript compilation passes
  - [ ] Add JSDoc comments to new functions
  - [ ] Follow object parameter patterns from cursor rules

#### Phase 3: Database Migration (Excluded - For Later)
- ⏸️ **Database Schema** (Skip for now)
- ⏸️ **Real Database Integration** (Skip for now)  
- ⏸️ **CRUD Operations** (Skip for now)
- ⏸️ **User Authentication Integration** (Skip for now)

## Implementation Notes

### Breaking Changes Tracking
- [ ] **Component Interface Changes**
  - BasicPrompt props change from `promptTemplates` to `promptHandlers`
  - State management changes from numeric IDs to string IDs
  - All existing functionality should work the same from user perspective

### Files to Create
- `src/types/promptHandler.ts`
- `src/utils/createDbPromptHandler.ts` 
- `src/server/handlers/jsonResponseHandler.ts`

### Files to Modify
- `src/components/BasicPromptWrapper.tsx`
- `src/components/BasicPrompt.tsx`

### Testing Strategy
After each phase, test that:
1. Dropdown populates correctly
2. Basic prompts execute as before
3. Advanced prompts return structured results
4. Error handling works consistently
5. Multiple runs work for all handler types

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

### JSON Response Handler (First Advanced Example)
```typescript
const jsonResponseHandler: PromptHandler = {
  id: 'json-response', // Hard-coded descriptive ID
  name: 'Structured JSON Response',
  category: 'advanced',
  description: 'Returns structured answer with reasoning using JSON schema',
  execute: async ({ input, runCount }) => {
    const results = [];
    for (let i = 0; i < runCount; i++) {
      try {
        const jsonResponse = await basicPromptJson(input);
        results.push({
          success: true,
          content: `**Answer:** ${jsonResponse.answer}\n\n**Reasoning:** ${jsonResponse.reasoning}`,
          error: null,
        });
      } catch (error) {
        results.push({
          success: false,
          content: null,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        });
      }
    }
    return { results };
  }
};
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
