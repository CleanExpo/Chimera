# LangGraph Orchestration Workflow - Visual Diagram

## High-Level Flow

```mermaid
graph TD
    START([START]) --> PLAN[PLAN Node]
    PLAN --> |Plan Created| GENERATE[GENERATE Node]
    PLAN --> |Error| ERROR[ERROR Handler]

    GENERATE --> |Review Enabled| REVIEW[REVIEW Node]
    GENERATE --> |Review Disabled| COMPLETE[COMPLETE Node]
    GENERATE --> |Error| ERROR

    REVIEW --> |Issues Found & Iterations < Max| REFINE[REFINE Node]
    REVIEW --> |No Issues or Max Iterations| COMPLETE
    REVIEW --> |Error| ERROR

    REFINE --> |Refinement Done| REVIEW
    REFINE --> |Error| ERROR

    COMPLETE --> END([END])
    ERROR --> END
```

## Detailed Phase Breakdown

### Phase 1: PLAN
```mermaid
graph LR
    A[User Brief] --> B[Plan Node]
    B --> C{Claude Sonnet 4.5}
    C --> D[Implementation Plan]
    D --> E[Strategy Document]
    E --> F[Next: GENERATE]
```

**Outputs:**
- `plan`: Detailed implementation strategy
- `implementation_strategy`: Technical approach
- `thoughts`: Planning reasoning

---

### Phase 2: GENERATE (Parallel Mode)
```mermaid
graph TD
    A[Plan + Brief] --> B{Parallel Mode?}
    B --> |Yes| C[Anthropic Team]
    B --> |Yes| D[Google Team]
    B --> |No| C
    C --> |Complete| D

    C --> E[Claude Sonnet 4.5]
    D --> F[Gemini 2.0 Flash]

    E --> G[Code Output A]
    F --> H[Code Output G]

    G --> I[Next: REVIEW]
    H --> I
```

**Outputs:**
- `anthropic_output`: Code from Claude
- `google_output`: Code from Gemini
- Each includes: code, model_used, token_count, error

---

### Phase 3: REVIEW
```mermaid
graph TD
    A[Generated Code] --> B{Review Enabled?}
    B --> |No| C[Skip to COMPLETE]
    B --> |Yes| D[Review Both Outputs]

    D --> E[Claude Reviews Anthropic Code]
    D --> F[Claude Reviews Google Code]

    E --> G{Has Issues?}
    F --> H{Has Issues?}

    G --> |Yes| I[anthropic_review]
    G --> |No| J[No Issues]

    H --> |Yes| K[google_review]
    H --> |No| J

    I --> L{Iterations < Max?}
    K --> L
    J --> M[Next: COMPLETE]

    L --> |Yes| N[Next: REFINE]
    L --> |No| M
```

**Review Criteria:**
- Correctness
- Best practices
- Type safety
- Error handling
- Code quality
- Performance

**Outputs:**
- `anthropic_review`: ReviewResult with issues/suggestions
- `google_review`: ReviewResult with issues/suggestions
- `needs_refinement`: Boolean flag

---

### Phase 4: REFINE (Conditional)
```mermaid
graph TD
    A[Review Feedback] --> B[Refine Node]
    B --> C{Anthropic Has Issues?}
    B --> D{Google Has Issues?}

    C --> |Yes| E[Refine Anthropic Code]
    D --> |Yes| F[Refine Google Code]

    E --> G[Claude Sonnet 4.5]
    F --> H[Claude Sonnet 4.5]

    G --> I[Updated Code A]
    H --> J[Updated Code G]

    I --> K[Increment Iteration]
    J --> K

    K --> L[Next: REVIEW Again]
```

**Refinement Loop:**
- Addresses specific issues from review
- Updates code in-place
- Increments iteration counter
- Goes back to REVIEW phase
- Max iterations prevents infinite loops

---

### Phase 5: COMPLETE
```mermaid
graph LR
    A[All Phases Done] --> B[Complete Node]
    B --> C[Set status = complete]
    B --> D[Set current_phase = complete]
    B --> E[Add final thoughts]
    E --> F[Return State]
```

**Final State Contains:**
- All generated code
- All reviews
- Complete thought stream
- Iteration count
- Status and phase info

---

## State Flow Diagram

```mermaid
stateDiagram-v2
    [*] --> initialized: Create State
    initialized --> planning: Start Workflow

    planning --> generating: Plan Success
    planning --> error: Plan Failure

    generating --> reviewing: Review Enabled
    generating --> complete: Review Disabled
    generating --> error: Generation Failure

    reviewing --> refining: Issues Found
    reviewing --> complete: No Issues
    reviewing --> error: Review Failure

    refining --> reviewing: Iteration < Max
    refining --> complete: Iteration = Max
    refining --> error: Refinement Failure

    complete --> [*]
    error --> [*]
```

---

## Conditional Edge Logic

### after PLAN
```python
if state["status"] == "error":
    return "error"
if not state["plan"]:
    return "error"
return "generate"
```

### after GENERATE
```python
if state["status"] == "error":
    return "error"
if not (anthropic_ok or google_ok):
    return "error"
if state["enable_review"]:
    return "review"
return "complete"
```

### after REVIEW
```python
if state["status"] == "error":
    return "error"
if not state["needs_refinement"]:
    return "complete"
if state["refinement_iteration"] >= state["max_refinement_iterations"]:
    return "complete"
return "refine"
```

### after REFINE
```python
if state["status"] == "error":
    return "error"
if state["refinement_iteration"] >= state["max_refinement_iterations"]:
    return "complete"
return "review"
```

---

## Data Flow Example

### Input
```json
{
  "brief": "Create a counter component",
  "framework": "react",
  "config": "BALANCED_CONFIG"
}
```

### After PLAN
```json
{
  "status": "planning",
  "plan": "1. Create state with useState...",
  "thoughts": [{"text": "Starting planning...", "source": "planner"}]
}
```

### After GENERATE
```json
{
  "status": "generating",
  "anthropic_output": {
    "code": "import React...",
    "model_used": "claude-sonnet-4-5-20250929",
    "token_count": 523
  },
  "google_output": {
    "code": "import React...",
    "model_used": "gemini-2.0-flash-exp",
    "token_count": 489
  }
}
```

### After REVIEW
```json
{
  "status": "reviewing",
  "anthropic_review": {
    "has_issues": true,
    "issues": ["Missing prop validation"],
    "confidence": 0.85
  },
  "needs_refinement": true
}
```

### After REFINE
```json
{
  "status": "refining",
  "refinement_iteration": 1,
  "anthropic_output": {
    "code": "import React...\ninterface Props {...}",
    "token_count": 567
  }
}
```

### Final Output
```json
{
  "status": "complete",
  "current_phase": "complete",
  "refinement_iteration": 1,
  "anthropic_output": {...},
  "google_output": {...},
  "thoughts": [...all thoughts from entire workflow...]
}
```

---

## Configuration Impact

| Config | PLAN | GENERATE | REVIEW | REFINE | Total Time |
|--------|------|----------|--------|--------|------------|
| FAST | ✅ | ✅ (parallel) | ❌ | ❌ | ~15s |
| BALANCED | ✅ | ✅ (parallel) | ✅ | ✅ (1x) | ~30s |
| THOROUGH | ✅ | ✅ (parallel) | ✅ | ✅ (2x) | ~45s |
| SEQUENTIAL | ✅ | ✅ (serial) | ✅ | ✅ (1x) | ~35s |
| DEBUG | ✅ | ✅ (serial) | ❌ | ❌ | ~20s |

---

## Error Handling Flow

```mermaid
graph TD
    A[Node Execution] --> B{Error Occurred?}
    B --> |No| C[Continue to Next Node]
    B --> |Yes| D[Set status = error]
    D --> E[Set error_message]
    E --> F[Add error thought]
    F --> G[Route to ERROR node]
    G --> H[Log error]
    H --> I[Return final state]
    I --> J[END]
```

**Error Recovery:**
- Partial success is possible (one model succeeds)
- Graceful degradation
- Detailed error messages
- Complete state preserved
- Can resume from checkpoint (if enabled)
