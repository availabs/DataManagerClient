import { useState, useMemo, useContext } from "react";
import { useNavigate } from "react-router";
import { Button } from "~/modules/avl-components/src";
import { DamaContext } from "../../../../store";
import { PluginLibrary } from "../../../";

import { Dialog } from "@headlessui/react";

export const PluginSelector = ({ state, setState }) => {
  const { baseUrl } = useContext(DamaContext);
  const navigate = useNavigate();
  console.log("PluginSelector",state);
  return (
    <select
      className="w-full py-2 bg-transparent"
      value={""}
      onChange={(e) => {
        console.log("plugin selected::", e);
        //register plugin
        setState((draft) => {
          if (!draft.symbology.plugins) {
            draft.symbology.plugins = {};
          }
          console.log("add plug library value::",PluginLibrary[e.target.value])
          draft.symbology.plugins[e.target.value] =
            PluginLibrary[e.target.value];
        });
      }}
    >
      <option key={-1} value={""}></option>
      {(Object.keys(PluginLibrary) || [])
        .filter(
          (pluginName) =>
            !(Object.keys(state?.symbology?.plugins) || []).includes(pluginName)
        )
        .map((pluginName, i) => (
          <option key={i} value={pluginName}>
            {pluginName}
          </option>
        ))}
    </select>
  );
};
