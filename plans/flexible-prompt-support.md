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

### Phase 1: Handler Pattern Foundation ✅ COMPLETED

#### Core Types and Utilities
- [x] **Create `src/types/promptHandler.ts`** ✅
  - [x] Consolidate existing duplicate types:
    - `PromptResult` (consolidated from `basicPrompt.ts` and `MultiplePromptResponse.tsx`)
      - ✅ Used the more flexible `string | object` version to support JSON responses
      - **ENHANCEMENT**: Made `prompt` optional for advanced handlers that may not have meaningful prompts
    - `MultiplePromptResults` (consolidated from both files)
    - `PromptTemplate` (moved from `promptTemplates.ts`)
  - [x] Define new `PromptHandler` type with execute function signature
  - [x] **ADDITION**: Added `AdvancedResponse` type for advanced handler return format
  - [x] Export all types for use across components
  - [x] Update imports in existing files to use consolidated types

- [x] **Create `src/utils/createDbPromptHandler.ts`** ✅
  - [x] Import `PromptTemplate` type from consolidated types file
  - [x] Import `multipleBasicPrompts` server action
  - [x] Create utility function that converts PromptTemplate to PromptHandler
  - [x] Follow handler ID convention: `db-${template.id}`

#### Component Updates

- [x] **Update `src/components/BasicPromptWrapper.tsx`** ✅
  - [x] Import new types and utility function
  - [x] **ARCHITECTURE CHANGE**: Reverted to pass `promptTemplates` to avoid server/client serialization issues
  - [x] Handler creation moved to client side in BasicPrompt component
  - [x] Maintain existing data fetching logic

- [x] **Update `src/components/BasicPrompt.tsx`** ✅
  - [x] Update props interface: `promptTemplates: PromptTemplate[]` (changed from original plan due to serialization)
  - [x] Create handlers on client side using `useMemo` to avoid serialization issues
  - [x] Change state: `selectedHandlerId: string` instead of `selectedPromptId: number`
  - [x] Update Select component to use `handler.id` and `handler.name`
  - [x] Update form submission to call `selectedHandler.execute({ input, runCount })`
  - [x] Ensure error handling works with new handler pattern

- [x] **Test Phase 1 Implementation** ✅
  - [x] Verify existing mock data still works
  - [x] Test prompt selection and execution
  - [x] Verify multiple runs still work correctly
  - [x] Check error states display properly
  - [x] Verify type consolidation doesn't break existing functionality
  - [x] **RESOLVED**: Fixed server/client component serialization error

### Phase 2: Advanced Handler Examples ✅ COMPLETED

#### JSON Response Handler
- [x] **~~Create `src/server/handlers/jsonResponseHandler.ts`~~** ✅ (REFACTORED)
  - [x] **ARCHITECTURAL IMPROVEMENT**: Created generic `src/utils/createAdvancedHandler.ts` instead
  - [x] Generic utility that can wrap ANY async function into a PromptHandler
  - [x] Much more flexible and reusable than specific handlers
  - [x] Supports optional prompt return from advanced functions

- [x] **Add advanced handler to BasicPrompt** ✅
  - [x] Use `createAdvancedHandler` with `basicPromptJson` function
  - [x] Added to handlers array alongside database handlers
  - [x] Test dropdown shows both basic and advanced prompts

- [x] **Modified `basicPromptJson` to return enhanced format** ✅
  - [x] Now returns `{ response: object, prompt: string }` instead of just object
  - [x] Shows actual prompt sent to AI model in UI
  - [x] Proper JSON display in response component

#### UI Enhancements
- [x] **Add handler descriptions/tooltips** ✅
  - [x] **UI CHANGE**: Show descriptions below dropdown instead of inline for cleaner design
  - [x] Category badges implemented (BASIC=blue, ADVANCED=purple)
  - [x] Visual distinction between handler types achieved

- [x] **Enhanced Prompt Display** ✅
  - [x] **MAJOR IMPROVEMENT**: Made prompts optional in `PromptResult` interface
  - [x] Conditional display - only show "Prompt Sent" section when prompt exists
  - [x] Advanced handlers can choose whether to expose internal prompts
  - [x] Removed misleading `promptLabel` parameter for cleaner API

- [ ] **Additional Advanced Handlers (Optional)**
  - [ ] Create placeholder handlers for future development *(deferred)*
  - [ ] Add handler for chained prompts example *(deferred)*
  - [ ] Add handler for API integration example *(deferred)*

#### Testing and Polish
- [x] **Comprehensive Testing** ✅
  - [x] Test all handler types work correctly
  - [x] Verify error messages are consistent
  - [x] Test multiple runs for both basic and advanced handlers
  - [x] Check loading states work properly

- [x] **Code Quality** ✅
  - [x] Run linting: `pnpm lint` (passes)
  - [x] Ensure TypeScript compilation passes
  - [x] Added JSDoc comments to new functions
  - [x] Follow object parameter patterns from cursor rules

#### Phase 3: Database Migration (Excluded - For Later)
- ⏸️ **Database Schema** (Skip for now)
- ⏸️ **Real Database Integration** (Skip for now)  
- ⏸️ **CRUD Operations** (Skip for now)
- ⏸️ **User Authentication Integration** (Skip for now)

## Implementation Notes

### Major Architectural Improvements Made ✅

#### 1. **Generic Advanced Handler Pattern** (Major Enhancement)
- **Original Plan**: Create specific handlers for each advanced function
- **Implemented**: Created `createAdvancedHandler` utility that wraps ANY async function
- **Benefits**: 
  - Reusable for any advanced function
  - Consistent error handling, timing, multiple runs
  - Much cleaner than one-off handler files

#### 2. **Optional Prompt Display** (User Experience Enhancement)
- **Original Plan**: Always show prompts with fallback labels
- **Implemented**: Made prompts optional in `PromptResult` interface
- **Benefits**:
  - Cleaner UI - only shows prompts when meaningful
  - Advanced functions can choose whether to expose internal prompts
  - No misleading placeholder text

#### 3. **Server/Client Serialization Solution** (Technical Fix)
- **Issue**: Cannot pass functions from server to client components
- **Solution**: Moved handler creation to client side using `useMemo`
- **Result**: Clean separation while maintaining performance

#### 4. **Enhanced Response Format** (Better User Experience)
- **Original Plan**: Format responses in handlers
- **Implemented**: Advanced functions return `{ response, prompt }` format
- **Benefits**:
  - Shows actual prompts sent to AI models
  - Proper JSON display in response component
  - Functions have control over what prompts to expose

### Breaking Changes Tracking ✅
- [x] **Component Interface Changes**
  - ~~BasicPrompt props change from `promptTemplates` to `promptHandlers`~~ (reverted due to serialization)
  - BasicPrompt creates handlers on client side from templates
  - State management changes from numeric IDs to string IDs
  - All existing functionality works the same from user perspective

### Files Created ✅
- ✅ `src/types/promptHandler.ts` (consolidated types + PromptHandler + AdvancedResponse)
- ✅ `src/utils/createDbPromptHandler.ts` (database handler utility)
- ✅ `src/utils/createAdvancedHandler.ts` (generic advanced handler utility - **architectural improvement**)
- ❌ ~~`src/server/handlers/jsonResponseHandler.ts`~~ (replaced by generic utility)

### Files Modified ✅
- ✅ `src/components/BasicPromptWrapper.tsx` (reverted to pass templates due to serialization)
- ✅ `src/components/BasicPrompt.tsx` (handler creation on client side, enhanced UI)
- ✅ `src/server/actions/basicPrompt.ts` (removed duplicate types, import from central)
- ✅ `src/components/MultiplePromptResponse.tsx` (removed duplicate types, conditional prompt display)
- ✅ `src/server/db/promptTemplates.ts` (removed PromptTemplate interface, import from central)
- ✅ `src/server/actions/basicPromptJson.ts` (enhanced to return { response, prompt } format)

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

---

## ✅ IMPLEMENTATION COMPLETE - SUMMARY

**Both Phase 1 and Phase 2 have been successfully completed!** The flexible prompt support system is now fully functional with several architectural improvements beyond the original plan.

### What We Built

1. **Unified Handler System**: Database prompts and advanced functions now work through the same dropdown interface
2. **Generic Advanced Handler**: Any async function can be easily wrapped into a prompt handler
3. **Smart Prompt Display**: Only shows prompts when they exist and are meaningful
4. **Enhanced JSON Support**: Proper JSON display with actual prompts shown to users
5. **Type-Safe Architecture**: Consolidated types with proper TypeScript enforcement

### Key Benefits Achieved

- **Flexibility**: Easy to add new advanced handlers without UI changes
- **Consistency**: All handlers follow the same execution patterns appropriate to their type
- **User Experience**: Clean UI with proper JSON display and contextual prompts
- **Maintainability**: Generic utilities instead of one-off handler files
- **Extensibility**: Clear path for future complex AI workflows

### Current Capabilities

**Users can now:**
- Select from basic database prompts (blue BASIC badges)
- Select from advanced structured prompts (purple ADVANCED badges)
- See handler descriptions below the dropdown
- View actual prompts sent to AI models (when provided)
- Get proper JSON responses with syntax highlighting
- Run multiple executions of any handler type

### Ready for Future Extensions

The architecture now supports easy addition of:
- Research & Analysis chains
- API integration handlers
- Multi-step workflows
- Tool-calling handlers
- Any custom async function as a prompt handler

**The system successfully mixes simple database prompts with complex advanced functions through a clean, unified interface!** 🎉
