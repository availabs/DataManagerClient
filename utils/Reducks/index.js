import get from "lodash.get";

export const createSimpleIdentityAction = (type) => (payload) => ({
  type,
  payload,
});

export const createSimpleSelector = (path) => (state) => get(state, path);
