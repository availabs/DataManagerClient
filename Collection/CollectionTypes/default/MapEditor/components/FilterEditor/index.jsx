import React, { useContext, useMemo, useState } from "react";
import { Button } from "~/modules/avl-components/src";
import { SymbologyContext } from "../../";
import { ExistingFilterList, FilterBuilder } from "./FilterControls";
import get from "lodash/get";
import set from "lodash/set";

function FilterEditor(props) {
  const { state, setState } = useContext(SymbologyContext);
  const [displayBuilder, setDisplayBuilder] = useState(false);
  const [activeColumn, setActiveColumn] = useState();
  const existingFilter = get(
    state,
    `symbology.layers[${state.symbology.activeLayer}].filter`
  );

  return (
    <div className="pb-4 w-full max-h-[calc(100vh_-_251px)] scrollbar-xs overflow-x-hidden overflow-y-auto">
      <div className="w-full mt-1 mx-4 text-slate-500 text-[14px] tracking-wide min-h-[32px] flex items-center mx">
        Filters
      </div>
      <div className="mx-4">
        <ExistingFilterList
          removeFilter={(columnName) => {
            setActiveColumn(null);
            setDisplayBuilder(false);
            setState((draft) => {
              const newFilter = Object.keys(existingFilter).reduce((a, c) => {
                if (c !== columnName) {
                  a[c] = existingFilter[c];
                }
                return a;
              }, {});
              set(
                draft,
                `symbology.layers[${state.symbology.activeLayer}].filter`,
                newFilter
              );
            });
          }}
          activeColumn={activeColumn}
          setActiveColumn={setActiveColumn}
        />
      </div>
      <div className="m-4">
        <Button
          className="p-1"
          themeOptions={{ size: "sm", color: "transparent" }}
          onClick={() => {
            setDisplayBuilder(true);
            setActiveColumn(null);
          }}
        >
          Add Filter
        </Button>
      </div>
      {(activeColumn || displayBuilder) && (
        <FilterBuilder
          path={`['filter']`}
          params={{ activeColumn, setActiveColumn }}
        />
      )}
    </div>
  );
}

export default FilterEditor;
