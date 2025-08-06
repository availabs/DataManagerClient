import React, {
  useContext,
  useMemo,
  useCallback,
  Fragment,
  useRef,
} from "react";
import { PluginSelector } from "./PluginSelector";
import { SymbologyContext, PluginLibrary } from "../../";
import get from "lodash/get";
import omit from "lodash/omit";
/**
 * TODO
 * - Remove plugin button
 */
function PluginManager(props) {
  const { state, setState } = React.useContext(SymbologyContext);
  const layers = useMemo(() => state.symbology?.layers || {}, [state]);
  //console.log('layers', layers)
  const activePlugins = ["testplugin"];
  console.log("plugin manager state", state);
  return (
    <>
      {/* ------Layer Pane ----------- */}
      <div className="min-h-20 relative p-1">
        <div>
          Add plugin:
          <PluginSelector state={state} setState={setState} />
        </div>
        <div>
          Active Plugins
          {state?.symbology?.plugins &&
            Object.keys(state?.symbology?.plugins).map((d) => {
              let Comp = PluginLibrary[d].comp || (() => <></>);
              return (
                <div>
                  <div class="flex justify-between">
                    <div className="p-1"><b>{d}</b></div>
                    <div
                      onClick={() => {
                        console.log("remove clicked", d);
                        setState((draft) => {
                          console.log("inside set state", JSON.parse(JSON.stringify(draft.symbology.plugins)))
                         draft.symbology.plugins = omit(draft.symbology.plugins, d);
                        });
                      }}
                    >
                      X
                    </div>
                  </div>
                  <Comp state={state} setState={setState} />;
                </div>
              );
            })}
        </div>
      </div>
    </>
  );
}

export default PluginManager;
