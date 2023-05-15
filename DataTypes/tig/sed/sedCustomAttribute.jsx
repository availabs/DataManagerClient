import React from "react";
import { Input } from "~/modules/avl-components/src";

export const CustomYears = ({ state, dispatch }) => {
  let {
    customViewAttributes: { years },
  } = state || {};

  const setOnChange = (value, index) => {
    const updatedYears = [...years];
    updatedYears[index] = value;
    years = updatedYears;
    dispatch({ type: "update", payload: { customViewAttributes: { years } } });
  };

  const isAlreadyExist = (index, years) => {
    const selectedElement = years[index];
    for (let i = 0; i < years.length; i++) {
      if (i !== index && Number(years[i]) === Number(selectedElement)) {
        return true;
      }
    }
    return false;
  };

  const setAddNewColumn = () => {
    const newYear = Math.max(Math.max(...years), 1995);
    years = [...years, `${newYear + 5}`];
    dispatch({ type: "update", payload: { customViewAttributes: { years } } });
  };

  const setDeleteColumn = (ind) => {
    years?.splice(ind, 1);
    dispatch({ type: "update", payload: { customViewAttributes: { years } } });
  };

  return (
    <>
      <button
        onClick={() => setAddNewColumn()}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
      >
        Add a new year{" "}
        <span className="my-2 mx-2 cursor-pointer">
          <i className="fa fa-plus" />
        </span>
      </button>

      <div className="grid grid-cols-3 gap-4 my-2">
        {years &&
          (years || []).map((year, i) => (
            <>
              <div key={i} className="pt-2 pr-8">
                <Input
                  type="number"
                  className="p-2 flex-1 px-2 shadow bg-grey-50 focus:bg-blue-100 border-gray-300 "
                  value={year}
                  onChange={(val) => setOnChange(val, i)}
                />
                <>
                  <button
                    onClick={() => setDeleteColumn(i)}
                    className="mx-3 my-3 text-white bg-red-700 hover:bg-red-800 focus:outline-none focus:ring-4 focus:ring-red-300 font-medium rounded-full text-sm px-5 py-2.5 text-center mr-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900"
                  >
                    <span className=" cursor-pointer">
                      <i className="fa fa-trash" />
                    </span>
                  </button>
                </>
                <br />
                {isAlreadyExist(i, years) ? (
                  <span className="text-rose-800">
                    {`Year ${year} is already available`}
                  </span>
                ) : null}
              </div>
            </>
          ))}
      </div>
    </>
  );
};

export const SedCustomAttribute = ({ state, dispatch }) => {
  return (
    <React.Fragment>
      <CustomYears state={state} dispatch={dispatch} />
    </React.Fragment>
  );
};
