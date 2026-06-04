# React State Management with `elegant-store`

An elegant, zero-dependency, highly performant state management solution for React. 

`elegant-store` combines the simplicity of React hooks with an efficient publish/subscribe pattern. In version 2, we've upgraded the core engine to leverage React 18's `useSyncExternalStore` for concurrent rendering safety and introduced powerful new features like selectors, async actions, and external state access.

## Installation

```bash
npm install elegant-store
```

## Usage

```ts
import { createStore } from "elegant-store";

// Define your store with an initial value and optional actions
const counterStore = createStore(0, {
  increment: (state) => state + 1,
  decrement: (state) => state - 1,
  reset: () => 0,
});

function Counter() {
  const { state: count, setState: setCount, increment, decrement, reset } = counterStore.useStore();

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>Increment</button>
      <button onClick={decrement}>Decrement</button>
      <button onClick={reset}>Reset</button>

      {/* You can still use setCount directly if needed: */}
      <button onClick={() => setCount(10)}>Set to 10</button>
    </div>
  );
}
```

## Features & Upgrades

### Performance & Safety (React 18)
The library now uses `useSyncExternalStore` under the hood. This eliminates tearing during concurrent rendering and ensures that your components always see the most up-to-date state, even if they mount after a state change.

### Selectors (Preventing Re-renders)
If your state is a large object, you can pass a selector function to the hook to only re-render when a specific part of the state changes.

```ts
const userStore = createStore({ name: "Alice", age: 30 });

function UserProfile() {
  // Component will only re-render if `name` changes. Changes to `age` are ignored.
  const { state: name } = userStore.useStore((state) => state.name);

  return <div>Name: {name}</div>;
}
```

### Async Actions Support
Actions can now be asynchronous! Just return a Promise, and the state will be updated when the Promise resolves.

```ts
const authStore = createStore({ user: null }, {
  login: async (state, credentials) => {
    const user = await api.login(credentials);
    return { ...state, user };
  }
});
```

### Accessing State Outside of React Components
You can now read, update, or subscribe to the state outside of React components—perfect for utility files, API callers, or Router guards.

```ts
const tokenStore = createStore({ token: null });

// Outside React
const currentToken = tokenStore.get().token;
tokenStore.setState({ token: "new_token" });
tokenStore.actions.myAction();
tokenStore.subscribe((newState) => console.log(newState));
```

## API

### `createStore<T, S>(initialValue: T, actions?: S, listeners?: ((t: T) => void)[])`

Creates a new store.

**Parameters:**
- `initialValue: T`: The initial value of the store.
- `actions?: S`: An optional object containing action creators. Each action creator takes the current state and returns a new state (or a Promise resolving to a new state).
- `listeners?: ((t: T) => void)[]`: An optional array of callbacks called with the new state value whenever the state changes.

**Returns:**
An object containing:
- `useStore(selector?)`: A hook returning `{ state: selectedValue, setState: setValue, ...boundActions }`
- `get()` / `getState()`: Returns current state.
- `setState(newState)`: Updates current state.
- `actions`: Your bound actions.
- `subscribe(listener)`: Subscribe to state changes.

## AI Agent Instructions
Are you using an AI assistant like Cursor, Claude, or GitHub Copilot? We've created a dedicated markdown file specifically optimized for AI consumption. Feed `docs/llms.md` to your agent to ensure it generates perfect `elegant-store` code with selectors, async actions, and outside-React state access.

## Bundling
This package uses [bunchee](https://github.com/huozhi/bunchee) to automatically build standard ESM/CJS bundles. The main entry point handles strict zero-config TypeScript compilation.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request.

## License
MIT
