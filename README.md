# React State Management with `Elegant-store`

This package provides a simple and lightweight way to manage state in your React applications using a custom `createStore` function. It combines the simplicity of `useState` with a publish/subscribe pattern for efficient updates and provides a clean way to define and use actions to modify your state.

## Installation

```bash
npm install elegant-store
```

## Usage

```ts
import { createStore } from "elegant-store";

// Define your store with an initial value and optional actions
const useCounterStore = createStore(0, {
  increment: (state) => state + 1,
  decrement: (state) => state - 1,
  reset: () => 0,
});

function Counter() {
  const [count, setCount, actions] = useCounterStore();

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={actions.increment}>Increment</button>
      <button onClick={actions.decrement}>Decrement</button>
      <button onClick={actions.reset}>Reset</button>

      {/* You can still use setCount directly if needed: */}
      <button onClick={() => setCount(10)}>Set to 10</button>
    </div>
  );
}

export default Counter;
```

# API

## `createStore<T, S>(initialValue: T, actions?: { [key in keyof S]: (t: T) => T })`

Creates a new store.

**Parameters:**

- `initialValue: T`: The initial value of the store. `T` represents the type of the initial value.
- `actions?: { [key in keyof S]: (t: T) => T }`: An optional object containing action creators. Each action creator is a function that takes the current state (`t: T`) and returns a new state. `S` represents the type of the actions object.

**Returns:**

A function that, when called within a React component, returns a tuple:

`[value: T, setValue: Action<T>, boundActions: { [key in keyof S]: () => void }]`

- `value: T`: The current value of the state.
- `setValue: Action<T>`: The standard React `setState` function for directly updating the state. This can be used to bypass the defined actions if needed.
- `boundActions: { [key in keyof S]: () => void }`: An object containing the bound action creators. Each bound action is a function that, when called, will update the state using the corresponding action creator. These bound actions close over the internal `setValue` function.

# Key Features

- Simple and Lightweight: Easy to integrate into any React project.
- Type-Safe: Uses generics for type safety, ensuring that your state and actions are correctly typed.
- Centralized State Management: Provides a central place to manage your application's state.
- Action Creators: Encourages a clean and organized way to update state using action creators.
- Publish/Subscribe Pattern: Efficiently updates components whenever the state changes.
- Flexibility: You can use the provided actions or use setValue directly for updates.

# Example with More Complex State

TypeScript

```ts
interface User {
  name: string;
  age: number;
}

const useUserStore = createStore<
  User,
  { updateName: (user: User, newName: string) => User }
>(
  { name: "Alice", age: 30 },
  {
    updateName: (user, newName) => ({ ...user, name: newName }),
  }
);

function UserProfile() {
  const [user, setUser, actions] = useUserStore();

  return (
    <div>
      <p>Name: {user.name}</p>
      <p>Age: {user.age}</p>
      <button onClick={() => actions.updateName(user, "Bob")}>
        Update Name
      </button>
      {/* Direct state update: */}
      <button onClick={() => setUser({ ...user, age: 35 })}>Update Age</button>
    </div>
  );
}
```

Contributing
Contributions are welcome! Please open an issue or submit a pull request.

License
MIT
