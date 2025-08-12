import React, { useMemo, useEffect, Fragment, useState } from "react";
import { SymbologyContext } from "../..";
import get from "lodash/get";
import set from "lodash/set";

export function SelectControl({ path, params = {} }) {
  //console.log("select control path::", path)
  const { state, setState } = React.useContext(SymbologyContext);
  //console.log('select control', params)

  const defaultValue =
    params.default !== null && params.default !== undefined
      ? params.default
      : params?.options?.[0]?.value;
      
  return (
    <label className="flex w-full">
      <div className="flex w-full items-center">
        <select
          className="w-full py-2 bg-transparent"
          value={get(state, `${path}`, defaultValue)}
          onChange={(e) =>
            setState((draft) => {
              set(draft, `${path}`, e.target.value);
            })
          }
        >
          <option value={""}></option>
          {(params?.options || []).map((opt, i) => {
            return (
              <option key={i} value={opt.value}>
                {opt.name}
              </option>
            );
          })}
        </select>
      </div>
    </label>
  );
}

export function InputControl({ path, params = {} }) {
  //console.log("input control path::", path)
  const { state, setState } = React.useContext(SymbologyContext);
  //console.log('input control', params)

  const defaultValue =
    params.default !== null && params.default !== undefined
      ? params.default
      : params?.options?.[0]?.value;
      
  return (
    <label className="flex w-full">
      <div className="flex w-full items-center">
        <input
          className="w-full py-2 bg-transparent"
          value={get(state, `${path}`, defaultValue)}
          onChange={(e) =>
            setState((draft) => {
              set(draft, `${path}`, e.target.value);
            })
          }
        />
      </div>
    </label>
  );
}

export function RadioControl({ path, params = {} }) {
  const { state, setState } = React.useContext(SymbologyContext);

  const defaultValue =
    params.default !== null && params.default !== undefined
      ? params.default
      : params?.options?.[0]?.value;

  return (
    <label className="flex w-full">
      <div className="flex w-full items-center">
        {params.options.map((opt) => (
          <span key={`${path}_opt_${opt.value}`}>
            <label
              htmlFor={"enableGroupedBy"}
              className="ml-2 text-sm text-gray-900"
            >
              {opt.name}
            </label>
            <input
              name={path}
              checked={get(state, `${path}`) === opt.value}
              type="radio"
              className="w-full py-2 bg-transparent"
              value={opt.value}
              onChange={(e) =>
                setState((draft) => {
                  set(draft, `${path}`, opt.value);
                })
              }
            />
          </span>
        ))}
      </div>
    </label>
  );
}

export const pluginControlTypes = {
  select: SelectControl,
  text: InputControl,
  radio: RadioControl
};
