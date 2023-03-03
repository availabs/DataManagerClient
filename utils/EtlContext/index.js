// SEE: https://moleculer.services/docs/0.14/context.html

// FIXME: Need to decide how to handle getState and setState
//        Simple cloneDeep means cloned/spawned contexts mutate original.

import {
  // useEffect,
  useState,
  useRef,
  useContext,
  // useReducer,
  createContext,
} from "react";

import { assign, cloneDeep, isEqual, merge, omit } from "lodash";
import _ from "lodash";

import EventEmitter from "eventemitter3";
import { pEventIterator } from "p-event";

import { v4 as uuid } from "uuid";

const selectorPrefixLength = "select".length;

export function selectors2props(ctx) {
  const { getState, selectors } = ctx;

  const state = getState();

  const selectorNames = Object.keys(selectors);

  const props = selectorNames.reduce((acc, selName) => {
    const name =
      selName.charAt(selectorPrefixLength).toLowerCase() +
      selName.slice(selectorPrefixLength + 1);

    acc[name] = selectors[selName](state);

    return acc;
  }, {});

  return props;
}

export function extractPropertiesFromEtlCtx(ctx, deps) {
  const { selectors, getState } = ctx;

  const selectorsSet = new Set(Object.keys(selectors));

  const state = getState();

  // CONVENTION: camelCase selectos and deps
  const depProps = deps.reduce((acc, dep) => {
    const depSelector = `select${dep.charAt(0).toUpperCase()}${dep.slice(1)}`;

    if (selectorsSet.has(depSelector)) {
      const selector = selectors[depSelector];
      acc[dep] = selector(state);
    }

    return acc;
  }, {});

  return depProps;
}

export function extractPropertiesFromEtlContextHierarchy(ctx, deps) {
  let curCtx = ctx;

  let unresolvedDeps = deps;

  const props = {};

  while (curCtx && unresolvedDeps.length) {
    const depProps = extractPropertiesFromEtlCtx(curCtx, unresolvedDeps);

    merge(props, depProps);

    unresolvedDeps = unresolvedDeps.filter((dep) => props[dep] === undefined);

    curCtx = curCtx.parentCtx;
  }

  return props;
}

export function createEtlContextPropsProxy(ctx) {
  return new Proxy(
    {},
    {
      get(_target, prop) {
        const { [prop]: value } = extractPropertiesFromEtlContextHierarchy(
          ctx,
          [prop]
        );
        return value;
      },
    }
  );
}

export function useEtlContextDependencies(_ctx, deps) {
  const { current: ctx } = useRef(_ctx);
  const [dependencies] = useState(deps.slice());

  const prevSliceRef = useRef({});
  const { current: prevSlice } = prevSliceRef;

  const newSlice = extractPropertiesFromEtlContextHierarchy(ctx, deps);

  for (const dep of dependencies) {
    if (!isEqual(prevSlice[dep], newSlice[dep])) {
      prevSliceRef.current = newSlice;

      // console.log("ctx", ctx.name, " dep", dep, "changed.");
      // console.log({ old: prevSlice[dep], new: newSlice[dep] });

      return newSlice;
    }
  }

  return prevSlice;
}

export function useEtlContext(_ctx) {
  const { current: ctx } = useRef(_ctx);
  const { current: dependencies } = useRef(new Set());

  const prevSliceRef = useRef(null);

  // The first time useEtlContext is used, we collect all the properties accessed.
  if (prevSliceRef.current === null) {
    // Need a non-proxied object because the proxy always has the context's current state.
    //   This means the prevSlice/newSlice comparison never finds a difference when prevSlice is proxy.
    const initialSlice = {};
    prevSliceRef.current = initialSlice;

    const proxy = new Proxy(
      {},
      {
        get(_target, prop) {
          dependencies.add(prop);

          const { [prop]: value } = extractPropertiesFromEtlContextHierarchy(
            ctx,
            [prop]
          );

          // If the prop has never been set, set it.
          if (!(prop in initialSlice)) {
            initialSlice[prop] = value;
          }

          return value;
        },
      }
    );

    return proxy;
  }

  const { current: prevSlice } = prevSliceRef;

  const newSlice = extractPropertiesFromEtlContextHierarchy(ctx, [
    ...dependencies,
  ]);

  for (const dep of dependencies) {
    if (!isEqual(prevSlice[dep], newSlice[dep])) {
      prevSliceRef.current = newSlice;

      // console.log("useEtlContext for", ctx.name, "dependency", dep, "changed");
      return newSlice;
    }
  }

  return prevSliceRef.current;
}

/*

  NOTE: useEtlContext2 appears to works in React functional components.
        However, we should improve it a bit.

  But, we can replace this:

      const ctx = useContext(EtlContextReact);

      const {
        dataState,
        dataMinDate,
        dataMaxDate,
        dataStartDate,
        dataEndDate,
        expandedMap,
        requestStatus,
      } = useEtlContext(ctx);

      const {
        dispatch,
        actions: {
          updateDataState,
          updateDataStartDate,
          updateDataEndDate,
          updateExpandedMap,
        },
      } = ctx;

  With this;

      const {
        dispatchers: {
          updateDataState,
          updateDataStartDate,
          updateDataEndDate,
          updateExpandedMap,
        },
        // The subset of state that triggers renders aux useEtlContext
        state: {
          dataState,
          dataMinDate,
          dataMaxDate,
          dataStartDate,
          dataEndDate,
          expandedMap,
          requestStatus,
        }
      } = useEtlContext2();

    Where the overall object return by useEtlContext2 changes
      IFF any state props change as with useEtlContext.

export function useEtlContext2() {
  const ctx = useContext(EtlContextReact);
  return useEtlContext(ctx);
}
*/

/* // This currently doesn't work
export function useEtlContextFactory(store, parentCtx, initialArg) {
  const { default: reducer, init } = store;

  const [state, dispatch] = useReducer(
    reducer,
    // Fixme: maxSeenEventId belongs on damaEtlAdmin
    initialArg,
    init
  );

  const { __taskName__ } = state;

  const { current: ctx } = useRef(
    new EtlContext({
      name: __taskName__,
      ...store,
      dispatch,
      parentCtx,
    })
  );

  ctx.setState(state);

  useEffect(() => {
    if (parentCtx) {
      parentCtx.dispatch({
        type: `${__taskName__}:STATE_UPDATE`,
        payload: state,
      });
    }
  }, [parentCtx, state, __taskName__]);

  return ctx;
}
*/

// CONSIDER: should this be an abstract class that must be extended.
export default class EtlContext {
  constructor(config) {
    assign(
      this,
      // TODO: Warn if reserved words used in config.
      omit(config, [
        "getState",
        "setState",
        "assignMeta",
        "operations",
        "dispatchers",
        "state",
      ])
    );

    // NOTE:  For use in operations, NOT React components.
    //        DOES NOT replace useEtlContext.
    //          Getting properties from this.state will not trigger re-renders
    //          when the state changes.
    this.state = createEtlContextPropsProxy(this);

    if (config.operations) {
      const boundOperations = Object.keys(config.operations).reduce(
        (acc, op) => {
          acc[op] = config.operations[op].bind(this);
          return acc;
        },
        {}
      );

      this.operations = boundOperations;
    }

    if (config.dispatch && config.actions) {
      this.dispatchers = Object.keys(config.actions).reduce((acc, act) => {
        const action = config.actions[act];
        acc[act] = (...args) => config.dispatch(action(...args));
        return acc;
      }, {});
    }

    this.id = uuid();

    this.meta = this.meta || (this.parentCtx && this.parentCtx.meta) || {};

    this.getState = this.getState.bind(this);
    this.setState = this.setState.bind(this);

    this._stateUpdateEventEmitter = new EventEmitter();
  }

  _resetNextStatePromise() {
    this._nextState = new Promise((resolve) => {
      this._resolveNextState = resolve;
    });
  }

  getState() {
    return this.state;
  }

  // state MUST be immutable
  setState(state) {
    this.state = state;
    this._stateUpdateEventEmitter.emit("data", state);
  }

  //  Returns an event emitter that emits when any of the dependencies change.
  makeDependenciesChangeEventEmitter(deps) {
    const emitter = new EventEmitter();

    let oldSlice = extractPropertiesFromEtlContextHierarchy(this, deps);

    const fn = () => {
      const newSlice = extractPropertiesFromEtlContextHierarchy(this, deps);

      for (const dep of deps) {
        if (!isEqual(oldSlice[dep], newSlice[dep])) {
          emitter.emit("data", newSlice);
          break;
        }
      }

      oldSlice = newSlice;
    };

    this._stateUpdateEventEmitter.on("data", fn);

    const finish = () => {
      emitter.removeAllListeners();
      this._stateUpdateEventEmitter.removeListener("data", fn);
    };

    return { emitter, finish };
  }

  //  This takes an array of dependencies and returns an iterator
  //    that yields only when any of the dependencies change.
  async *makeDependenciesChangeAsyncIterator(deps) {
    const { emitter, finish } = this.makeDependenciesChangeEventEmitter(deps);

    try {
      const iter = pEventIterator(emitter, "data");

      for await (const slice of iter) {
        yield slice;
      }
    } finally {
      finish();
    }
  }

  // Currently meta is mutable. This allow spawned ctx to get updates by reference.
  // Should meta also be immutable?

  // From lodash docs:
  //    _.assign: Assigns own enumerable string keyed properties of source objects to
  //              the destination object. Source objects are applied from left to right.
  //              Subsequent sources overwrite property assignments of previous sources.
  //
  assignMeta(meta) {
    _.assign(this.meta, meta);
  }

  clone() {
    return new EtlContext({ ...this });
  }

  spawn(config) {
    const etlCtx = new EtlContext();

    assign(etlCtx, { ...config, state: cloneDeep(this.state) });

    if (!config.meta) {
      etlCtx.meta = this.meta;
    }

    etlCtx.parentCtx = this;

    return etlCtx;
  }
}

export const EtlContextReact = createContext(null);
