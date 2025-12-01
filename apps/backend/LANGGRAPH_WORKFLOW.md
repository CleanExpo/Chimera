# LangGraph Orchestration Workflow

This document describes the sophisticated multi-step agent orchestration workflow implemented using LangGraph.

## Overview

The LangGraph orchestration workflow provides a structured, multi-phase approach to code generation with built-in review and refinement capabilities.

## Workflow Architecture

```
START
  ↓
[PLAN] - Analyze brief, create implementation plan
  ↓
[GENERATE] - Claude + Gemini generate code in parallel
  ↓
[REVIEW] - Self-review generated code for issues
  ↓
[REFINE] (conditional) - Fix issues if found
  ↓  (loop back to REVIEW if needed)
  ↓
[COMPLETE] - Finalize and return results
```

## Workflow Phases

### 1. PLAN
- Analyzes the user's brief and requirements
- Creates a detailed implementation plan
- Identifies technical approach and patterns
- Uses Claude Sonnet 4.5 for planning

### 2. GENERATE
- Both Anthropic (Claude) and Google (Gemini) generate code
- Can run in parallel or sequentially (configurable)
- Each team follows the implementation plan
- Generates production-ready code with TypeScript and Tailwind CSS

### 3. REVIEW
- Self-reviews generated code for quality and correctness
- Checks for:
  - Correctness and logical errors
  - Best practices and conventions
  - Type safety
  - Error handling
  - Code quality and maintainability
  - Performance issues
- Returns structured review with issues and suggestions

### 4. REFINE (Conditional)
- Runs only if review finds issues
- Addresses all issues mentioned in review
- Can iterate up to max_refinement_iterations times
- After refinement, code is re-reviewed

### 5. COMPLETE
- Finalizes the workflow
- Returns all generated code, reviews, and metadata

## Configuration Options

### Configuration Presets

#### FAST_CONFIG
```python
{
    "max_refinement_iterations": 0,
    "enable_review": False,
    "review_strictness": "low",
    "parallel_generation": True,
    "enable_checkpointing": False,
}
```
**Use for:** Quick prototypes, simple components, when speed is priority

#### BALANCED_CONFIG (Default)
```python
{
    "max_refinement_iterations": 1,
    "enable_review": True,
    "review_strictness": "medium",
    "parallel_generation": True,
    "enable_checkpointing": True,
}
```
**Use for:** Production code, general use, balanced quality and speed

#### THOROUGH_CONFIG
```python
{
    "max_refinement_iterations": 2,
    "enable_review": True,
    "review_strictness": "high",
    "parallel_generation": True,
    "enable_checkpointing": True,
}
```
**Use for:** Critical components, complex logic, when quality is priority

### Custom Configuration

```python
from src.graphs import create_custom_config

config = create_custom_config(
    max_refinement_iterations=2,
    enable_review=True,
    review_strictness="high",
    parallel_generation=True,
    enable_checkpointing=True,
    checkpoint_interval=30,
)
```

## Usage

### Basic Usage

```python
from src.graphs import create_orchestration_workflow, BALANCED_CONFIG

# Create workflow
workflow = create_orchestration_workflow(config=BALANCED_CONFIG)

# Run workflow
result = await workflow.run(
    brief="Create a counter component with increment and decrement buttons",
    framework="react",
)

# Access results
print(f"Status: {result['status']}")
print(f"Anthropic code: {result['anthropic_output']['code']}")
print(f"Google code: {result['google_output']['code']}")
```

### Streaming Usage (Real-time Updates)

```python
workflow = create_orchestration_workflow(config=BALANCED_CONFIG)

async for event in workflow.stream(
    brief="Create a todo list component",
    framework="react",
):
    for node_name, node_state in event.items():
        print(f"Phase: {node_state.get('current_phase')}")
        print(f"Status: {node_state.get('status')}")
```

### With Orchestrator Service

```python
from src.orchestrator.service import OrchestrationService
from src.graphs import THOROUGH_CONFIG

orchestrator = OrchestrationService()

# Use LangGraph workflow
result = await orchestrator.orchestrate_with_langgraph(
    brief="Create a search component with autocomplete",
    target_framework="react",
    config=THOROUGH_CONFIG,
)
```

## State Schema

The workflow state contains:

```python
{
    "job_id": str,                    # Unique job identifier
    "brief": str,                     # User's requirements
    "framework": str,                 # Target framework
    "plan": str | None,              # Implementation plan
    "anthropic_output": CodeOutput,  # Claude's generated code
    "google_output": CodeOutput,     # Gemini's generated code
    "anthropic_review": ReviewResult, # Claude's code review
    "google_review": ReviewResult,   # Gemini's code review
    "needs_refinement": bool,        # Whether refinement is needed
    "refinement_iteration": int,     # Current refinement iteration
    "status": str,                   # Workflow status
    "thoughts": list[ThoughtItem],   # Streaming thoughts
    # ... more fields
}
```

## Features

### Checkpointing
- Enabled by default in most configs
- Allows workflow resumption after failure
- Useful for long-running workflows
- Can retrieve state by job_id

```python
# Get current state of a job
state = workflow.get_state(job_id="abc-123")
```

### Error Handling
- Graceful error handling at each node
- Partial success is possible (one model succeeds, other fails)
- Detailed error messages in state
- Workflow continues even if one model fails

### Thought Streaming
- Real-time updates as workflow progresses
- Each phase emits thoughts explaining what it's doing
- Useful for UI feedback and debugging
- Thoughts include source (planner, anthropic, google, reviewer, refiner)

### Parallel Generation
- Both models generate simultaneously (default)
- Can be disabled for sequential generation
- Reduces latency significantly
- Each model works independently

### Review Strictness Levels

- **Low**: Only catches critical errors
- **Medium**: Balanced - catches important issues
- **High**: Very thorough - catches even minor issues

## File Structure

```
apps/backend/src/graphs/
├── __init__.py                    # Package exports
├── orchestration_state.py         # State schema definitions
├── orchestration_nodes.py         # Node implementations
├── orchestration_edges.py         # Conditional routing logic
├── orchestration_workflow.py      # Main workflow graph
└── config.py                      # Configuration presets
```

## Testing

Run the test script:

```bash
cd apps/backend
python test_workflow.py
```

This will:
1. Test FAST_CONFIG (no review)
2. Test BALANCED_CONFIG (with review)
3. Display thought streams and results
4. Report pass/fail for each test

## Integration with Orchestrator Service

The workflow integrates seamlessly with the existing `OrchestrationService`:

### Simple Mode (Original)
```python
teams = await orchestrator.orchestrate(
    brief="...",
    target_framework="react",
    include_teams=["anthropic", "google"],
)
```

### LangGraph Mode (New)
```python
state = await orchestrator.orchestrate_with_langgraph(
    brief="...",
    target_framework="react",
    config=BALANCED_CONFIG,
)
```

## Best Practices

1. **Use FAST_CONFIG for prototyping**: Quick iterations during development
2. **Use BALANCED_CONFIG for production**: Good balance of quality and speed
3. **Use THOROUGH_CONFIG for critical code**: Maximum quality assurance
4. **Enable checkpointing for long workflows**: Allows resumption after failure
5. **Stream for real-time feedback**: Better UX with live updates
6. **Monitor thought streams**: Helps debug and understand workflow decisions

## Performance Characteristics

| Config | Avg Time | Review | Refinement | Use Case |
|--------|----------|--------|------------|----------|
| FAST   | ~15s     | No     | No         | Prototypes |
| BALANCED | ~30s   | Yes    | 1 iteration | Production |
| THOROUGH | ~45s   | Yes    | 2 iterations | Critical |

*Times are approximate and depend on model latency and code complexity*

## Troubleshooting

### Workflow stuck in error state
- Check API keys in environment variables
- Verify models are accessible
- Check error_message in final state

### No code generated
- Verify at least one model succeeded
- Check anthropic_output and google_output for errors
- Review brief clarity and requirements

### Infinite refinement loop
- Check max_refinement_iterations setting
- Verify review_strictness isn't too high
- Review feedback might be unclear

## Future Enhancements

- [ ] Add support for more frameworks (Angular, Solid)
- [ ] Implement streaming token usage tracking
- [ ] Add cost estimation per workflow run
- [ ] Support custom review criteria
- [ ] Add workflow visualization
- [ ] Implement workflow branching (try different approaches)
- [ ] Add A/B testing of generated outputs
