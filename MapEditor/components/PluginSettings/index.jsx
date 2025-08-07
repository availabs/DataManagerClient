import React, { useContext, Fragment, useRef } from "react";
import { SymbologyContext, PluginLibrary } from "../../";
// import { DamaContext } from "../../../../../../store"
import { Menu, Transition, Tab, Dialog } from "@headlessui/react";

function PluginSettings() {
  const { state, setState } = React.useContext(SymbologyContext);
  return (
    <div className="p-4">
      <div className="bg-white/95 w-[340px] rounded-lg drop-shadow-lg pointer-events-auto min-h-[400px] max-h-[calc(100vh_-_111px)] scroll-xs">
        <Tab.Group>
          <Tab.Panels>
            {Object.keys(state.symbology.plugins).map((pluginName) => {
              const SettingsComp = PluginLibrary[pluginName].settingsPanel;

              return (
                <Tab.Panel>
                  <SettingsComp state={state} setState={setState} />
                </Tab.Panel>
              );
            })}
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
}

export default PluginSettings;
