# Code Preview Test Cases

## Test Case 1: Simple React JSX (no imports, no export)
```jsx
<div className="p-4 bg-blue-500 text-white rounded-lg">
  <h1>Hello from Chimera!</h1>
  <p>This is a test component</p>
</div>
```

Expected: Should wrap in `export default function App()` automatically

---

## Test Case 2: React Component with Imports
```jsx
import { useState } from 'react';

const [count, setCount] = useState(0);

<div className="p-4 space-y-4">
  <h2>Counter: {count}</h2>
  <button onClick={() => setCount(count + 1)}>Increment</button>
</div>
```

Expected: Should extract imports and wrap JSX in component

---

## Test Case 3: Full React Component (with export)
```jsx
import { useState } from 'react';

export default function PricingCard() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-sm">
      <h3 className="text-2xl font-bold mb-4">Pro Plan</h3>
      <div className="mb-4">
        <span className="text-4xl font-bold">${isYearly ? '99' : '10'}</span>
        <span className="text-gray-600">/{isYearly ? 'year' : 'month'}</span>
      </div>
      <button
        onClick={() => setIsYearly(!isYearly)}
        className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
      >
        Toggle Billing
      </button>
    </div>
  );
}
```

Expected: Should render as-is

---

## Test Case 4: Code with Markdown Fences
````markdown
```jsx
export default function App() {
  return <div>Hello World</div>;
}
```
````

Expected: Should strip markdown code fences and render correctly

---

## Test Case 5: Invalid/Malformed Code
```jsx
const broken = {
  missing: 'closing brace'
```

Expected: Should show error boundary with "Failed to render preview" message

---

## Test Case 6: Empty Code
```
```

Expected: Should show "No code to preview" message

---

## Integration Test

1. Start the dev server: `pnpm run dev --filter=web`
2. Navigate to `/command-center`
3. Select "React" framework
4. Submit a brief: "Create a pricing card component"
5. Observe:
   - Loading spinner appears in "Live Shot" area while generating
   - Once code is generated, Sandpack preview appears
   - Code is automatically cleaned (markdown fences removed)
   - Preview is interactive and working
   - No editor panel shown (showEditor=false)
   - nightOwl theme applied

## Framework Test

Test each framework option:
- **React**: Default, uses Sandpack React template
- **Vue**: Should use Vue template
- **Svelte**: Should use Svelte template
- **Vanilla JS**: Should use vanilla template

## Error Handling Test

1. Simulate malformed code generation
2. Verify error boundary catches it
3. Verify user sees error message instead of crash
4. Verify console logs error for debugging
