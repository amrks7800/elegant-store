import { Dispatch, SetStateAction } from 'react';

type Action<T> = Dispatch<SetStateAction<T>>;
/**
 * Creates a store with initial value and optional actions.
 * The store is a combination of a state, an updater function, and bound action creators.
 * The state is managed using React's useSyncExternalStore hook for optimal performance.
 * Bound action creators are created from the provided actions, and they update the state using the updater function.
 * The store also uses a subscribable pattern to notify subscribers whenever the state changes.
 *
 * @template T - The type of the initial value.
 * @template S - The type of the actions object.
 *
 * @param initialValue - The initial value of the store.
 * @param actions - An optional object containing action creators. Each action creator takes the current state and returns a new state or a Promise.
 *
 * @returns A hook function that returns an array containing the current state, the updater function, and the bound action creators.
 **/
declare function createStore<T, S extends {
    [key: string]: (t: T, ...args: any[]) => T | Promise<T>;
}, L extends ((t: T) => void)[]>(initialValue: T, actions?: S, listeners?: L): {
    (): [T, Action<T>, { [K in keyof S]: S[K] extends (t: T, ...args: infer P) => infer R ? (...args: P) => R extends Promise<any> ? Promise<void> : void : never; }];
    <R>(selector: (state: T) => R): [R, Action<T>, { [K in keyof S]: S[K] extends (t: T, ...args: infer P) => infer R_1 ? (...args: P) => R_1 extends Promise<any> ? Promise<void> : void : never; }];
    getState: () => T;
    setState: (newValue: T | ((prev: T) => T)) => void;
    actions: { [K in keyof S]: S[K] extends (t: T, ...args: infer P) => infer R ? (...args: P) => R extends Promise<any> ? Promise<void> : void : never; };
    subscribe: (fn: (value: T) => void) => () => boolean;
};

export { createStore };
export type { Action };
