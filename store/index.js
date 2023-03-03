import { createSlice } from "@reduxjs/toolkit";

import get from "lodash.get";

const sliceName = "data_manager";

const defaultPgEnv = "npmrds";

const lclStoKeys = {
  pgEnv: `redux.${sliceName}.pgEnv`,
};

const onLoadPgEnv = localStorage.getItem(lclStoKeys.pgEnv) || defaultPgEnv;


export const datamanagerSlice = createSlice({
  name: sliceName,
  initialState: {
    pgEnv: onLoadPgEnv,
  },
  reducers: {
    setPgEnv: (state, action) => {
      localStorage.setItem(lclStoKeys.pgEnv, action.payload);
      state.pgEnv = action.payload
    },
  }
});

export const {
  actions: { setPgEnv },
} = datamanagerSlice;

export const selectIsPwrUsr = (state) => {
  const { user } = state;
  const isPwrUsr =
    user && Array.isArray(user.groups) && user.groups.includes("AVAIL");
  return isPwrUsr;
};

export const selectUserId = (state) => {
  const { user } = state;
  return user ? user.id : null;
};

export const selectPgEnv = (state) => {
  return get(state, [sliceName, "pgEnv"], defaultPgEnv);
};

export const queryPgEnvs = () => ["dama-info", "pgEnvs"];

export default datamanagerSlice.reducer;

