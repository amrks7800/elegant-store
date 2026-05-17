var react = require('react');

const createSubscribable = ()=>{
    const subscribers = new Set();
    const subscribe = (fn)=>{
        subscribers.add(fn);
        return ()=>subscribers.delete(fn);
    };
    const unsubscribe = (fn)=>{
        subscribers.delete(fn);
    };
    const publish = (value)=>{
        subscribers.forEach((fn)=>fn(value));
    };
    return {
        subscribe,
        publish,
        unsubscribe
    };
};
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
 **/ function createStore(initialValue, actions, listeners) {
    const subscribable = createSubscribable();
    let currentValue = initialValue;
    const getState = ()=>currentValue;
    const setState = (newValue)=>{
        const nextValue = newValue instanceof Function ? newValue(currentValue) : newValue;
        if (!Object.is(currentValue, nextValue)) {
            currentValue = nextValue;
            subscribable.publish(currentValue);
            if (listeners) {
                listeners.forEach((listener)=>listener(currentValue));
            }
        }
    };
    const boundActions = {};
    if (actions) {
        for(const actionName in actions){
            boundActions[actionName] = (...args)=>{
                const result = actions[actionName](getState(), ...args);
                if (result instanceof Promise) {
                    return result.then(setState);
                } else {
                    setState(result);
                }
            };
        }
    }
    function useStore(selector) {
        const state = react.useSyncExternalStore(subscribable.subscribe, getState, getState);
        const selectedState = selector ? selector(state) : state;
        return [
            selectedState,
            setState,
            boundActions
        ];
    }
    useStore.getState = getState;
    useStore.setState = setState;
    useStore.actions = boundActions;
    useStore.subscribe = subscribable.subscribe;
    return useStore;
}

exports.createStore = createStore;
