import { falcorGraph as fg } from "modules/avl-components/src"
import { API_HOST } from 'config'

export const falcorGraph = fg(API_HOST);

export const UPDATE = 'avl-falcor/UPDATE';

export const falcorReducer = (state = {}, action) => {
  switch (action.type) {
    case UPDATE:
      return { ...action.payload };
    default:
      return state;
  }
}

export const updateFalcor = falcorCache => ({
  type: UPDATE,
  payload: falcorCache
})
