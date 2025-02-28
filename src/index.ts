import { Dispatch, SetStateAction, useEffect, useState } from "react";

export type Action<T> = Dispatch<SetStateAction<T>>;

const createSubscribable = <T>() => {
  const subscribers = new Set<Action<T>>();

  const subscribe = (fn: Action<T>) => {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
  };

  const unsubscribe = (fn: Action<T>) => {
    subscribers.delete(fn);
  };

  const publish = (value: T) => {
    subscribers.forEach((fn) => fn(value));
  };

  return {
    subscribe,
    publish,
    unsubscribe,
  };
};

/**
 * Creates a store with initial value and optional actions.
 * The store is a combination of a state, an updater function, and bound action creators.
 * The state is managed using React's useState hook, and the updater function is used to update the state.
 * Bound action creators are created from the provided actions, and they update the state using the updater function.
 * The store also uses a subscribable pattern to notify subscribers whenever the state changes.
 *
 * @template T - The type of the initial value.
 * @template S - The type of the actions object.
 *
 * @param initialValue - The initial value of the store.
 * @param actions - An optional object containing action creators. Each action creator is a function that takes the current state and returns a new state.
 *
 * @returns A function that returns an array containing the current state, the updater function, and the bound action creators.
 **/
export function createStore<
  T,
  S extends { [key: string]: (t: T, ...args: any[]) => T },
  L extends ((t: T) => T)[]
>(initialValue: T, actions?: S, listeners?: L) {
  const subscribable = createSubscribable<T>();

  return () => {
    const [value, setValue] = useState(initialValue);

    useEffect(() => subscribable.subscribe(setValue) as () => void, []);

    useEffect(() => {
      subscribable.publish(value);
    }, [value]);

    useEffect(() => {
      if (!listeners) return;
      listeners.forEach((listener) => {
        subscribable.subscribe(listener as Action<T>);
      });

      return () => {
        listeners.forEach((listener) => {
          subscribable.unsubscribe(listener as Action<T>);
        });
      };
    }, []);

    type BoundActions = {
      [K in keyof S]: S[K] extends (t: T, ...args: infer P) => T
        ? (...args: P) => void
        : never;
    };

    const boundActions = {} as BoundActions;

    if (actions) {
      for (const actionName in actions) {
        boundActions[actionName] = ((...args: any[]) => {
          setValue((prevState) => {
            const newState = actions[actionName](prevState, ...args);
            return newState;
          });
        }) as BoundActions[typeof actionName];
      }
    }

    return [value, setValue, boundActions] as [T, Action<T>, BoundActions];
  };
}
