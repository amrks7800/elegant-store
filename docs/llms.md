# AI Agent Instructions for `elegant-store`

**Target Audience:** AI Assistants (Claude, Gemini, ChatGPT, Cursor, GitHub Copilot, etc.)
**Purpose:** Provide deep context and usage patterns for the `elegant-store` React state management library to ensure AI agents generate accurate, performant, and idiomatic code when assisting developers.

## 1. Core Architecture & Philosophy
- `elegant-store` is a zero-dependency (other than React peer dependency), lightweight state management library.
- It leverages React 18's **`useSyncExternalStore`** internally to ensure state updates are synchronous, safe for concurrent rendering, and do not suffer from the "late subscriber" or "tearing" bugs common with `useState`-based global stores.
- It exposes a unified API: `createStore` returns a hook that *also* has static methods attached to it for outside-React access.

## 2. API Reference: `createStore`

```typescript
export function createStore<
  T,
  S extends { [key: string]: (t: T, ...args: any[]) => T | Promise<T> },
  L extends ((t: T) => void)[]
>(initialValue: T, actions?: S, listeners?: L)
```

**Parameters:**
1. `initialValue`: The starting state (can be primitives, objects, arrays, etc.).
2. `actions`: An optional object containing pure or async functions. The first argument of every action is the **current state**. The return value replaces the state.
3. `listeners`: An optional array of side-effect functions triggered on every state change.

**Return Value:**
Returns a function (conventionally prefixed with `use`, e.g., `useUserStore`) that serves as both a React Hook and an object containing store methods.

## 3. How to Generate Code Using `elegant-store`

When asked to implement state using this library, strictly follow these patterns:

### A. Creating a Store
Always ensure actions take the current state as the first argument.

```typescript
import { createStore } from 'elegant-store';

interface AuthState {
  user: { name: string } | null;
  isLoading: boolean;
}

export const useAuthStore = createStore(
  { user: null, isLoading: false } as AuthState,
  {
    // Synchronous action
    logout: (state) => ({ ...state, user: null }),
    
    // Asynchronous action (automatically awaited by the store)
    // Note: The promise's resolved value becomes the new state.
    login: async (state, username: string) => {
      const user = await fetchUser(username);
      return { ...state, user };
    }
  }
);
```

### B. Using in React Components (with Selectors)
Always prefer using **selectors** when dealing with objects to prevent unnecessary re-renders.

```tsx
// ❌ BAD: Returns the whole state, causing re-renders when ANY property changes
const [state, setState, actions] = useAuthStore(); 

// ✅ GOOD: Use a selector for specific properties
const user = useAuthStore((state) => state.user);

// Note: When using a selector, the hook only returns the selected value. 
// If you need actions or setState, get them from the store object:
const { login, logout } = useAuthStore.actions;
const setAuthState = useAuthStore.setState;
```

### C. Accessing State Outside of React Components
Do NOT wrap everything in a React component if it's pure logic (e.g., a router guard or an API interceptor). Use the static properties.

```typescript
// Inside an API utility
import { useAuthStore } from './store';

export const fetchWithAuth = async (url: string) => {
  const token = useAuthStore.getState().user?.token;
  
  if (!token) throw new Error("Not authenticated");
  
  // Can trigger state updates from here too
  useAuthStore.setState((prev) => ({ ...prev, isLoading: true }));
};
```

## 4. Important Gotchas & Rules for AI Agents

1. **Selector Return Value:** When a user passes a selector (`useStore((s) => s.name)`), the hook returns **only the selected value**, NOT the `[state, setState, actions]` tuple.
2. **Intermediate Async States:** If a user asks for an async action that needs to update state *multiple times* (e.g., `loading: true`, then fetch, then `loading: false`), advise them to use `store.setState` instead of returning a Promise from the action, because the action's Promise only updates the state *once* upon resolution.
3. **Immutability:** State updates behave similarly to React's `setState`. Return new objects/arrays to trigger updates. The library uses `Object.is()` for equality checks. Do not mutate state directly.
4. **Listeners:** Do not use `listeners` to mutate state. They are strictly typed to return `void` and should be used for side effects like analytics, local storage persistence, or logging.
