import React from "react";
import { Input } from "~/modules/avl-components/src";
import { Select } from "./../create/singleSelect";

export const AcsCustomAttribute = ({
  customAcsSelection,
  onChange,
  options,
}) => {
  const setAddNewColumn = () => {
    const vals = Object.keys(customAcsSelection || {});
    const newYear = Math.max(Math.max(...vals), 2010);
    customAcsSelection = Object.assign({}, customAcsSelection, {
      [newYear + 10]: options && options[0],
    });
    onChange(customAcsSelection);
  };

  const setUpdateViewSelection = (year, viewOption) => {
    customAcsSelection = Object.assign({}, customAcsSelection, {
      [year]: viewOption,
    });
    onChange(customAcsSelection);
  };

  const setDeleteColumn = (year) => {
    const updatedSelection = { ...customAcsSelection };

    if (updatedSelection.hasOwnProperty(year)) {
      delete updatedSelection[year];
      onChange(updatedSelection);
    }
  };

  return (
    <>
      <button
        onClick={() => setAddNewColumn()}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
      >
        Add a new track{" "}
        <span className="my-2 mx-2 cursor-pointer">
          <i className="fa fa-plus" />
        </span>
      </button>

      <div className="grid grid-cols-1 my-2">
        {Object.keys(customAcsSelection || {}) &&
          (Object.keys(customAcsSelection || {}) || []).map((year, i) => (
            <>
              <div key={year} className="pt-2 pr-8">
                <Input
                  type="number"
                  className="p-2 flex-1 px-2 shadow bg-grey-50 focus:bg-blue-100 border-gray-300 "
                  value={year}
                  readonly
                />
                <Select
                  selectedOption={customAcsSelection[year]}
                  options={options}
                  setSelecteOptions={(e) => setUpdateViewSelection(year, e)}
                />
                {Object.keys(customAcsSelection || {}) &&
                Object.keys(customAcsSelection || {}).length > 1 ? (
                  <>
                    <button
                      onClick={() => setDeleteColumn(year)}
                      className="mx-3 my-3 text-white bg-red-700 hover:bg-red-800 focus:outline-none focus:ring-4 focus:ring-red-300 font-medium rounded-full text-sm px-5 py-2.5 text-center mr-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900"
                    >
                      <span className=" cursor-pointer">
                        <i className="fa fa-trash" />
                      </span>
                    </button>
                  </>
                ) : null}
              </div>
            </>
          ))}
      </div>
    </>
  );
};
