import React, { useContext, Fragment, useRef } from "react";
import { SymbologyContext, PluginLibrary } from "../../";
// import { DamaContext } from "../../../../../../store"
import { Menu, Transition, Tab, Dialog } from "@headlessui/react";

//TODO -- this MAYBE needs some combination of these changes:
//Use MapContext if available (otherwise, use SymbologyContext)
function PluginControls() {
  const { state, setState } = React.useContext(SymbologyContext);
  const tabs = Object.keys(state.symbology.plugins)
  return (
    <div className="p-4">
      <div className="bg-white/95 w-[340px] rounded-lg drop-shadow-lg pointer-events-auto min-h-[400px] max-h-[calc(100vh_-_111px)] scroll-xs">
        <Tab.Group>
          <Tab.List>
            {tabs.map(tabName => (
              <Tab  key={tabName} as={Fragment}>
                {({ selected }) => (
                  <button
                    className={`
                      ${selected ? 
                        'text-slate-600 border-b font-medium border-slate-600' : 
                        'text-slate-400'} mx-1 text-sm p-2 cursor-pointer
                    `}
                  >
                    {tabName}
                  </button>
                )}
              </Tab>
            ))}
          </Tab.List>
          <Tab.Panels>
            {Object.keys(state.symbology.plugins).map((pluginName) => {
              const ControlPanelComp = PluginLibrary[pluginName]?.controlPanel;

              return (
                <Tab.Panel key={`plugin_settings_${pluginName}`}>
                  <ControlPanelComp state={state} setState={setState} />
                </Tab.Panel>
              );
            })}
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
}

export default PluginControls;
