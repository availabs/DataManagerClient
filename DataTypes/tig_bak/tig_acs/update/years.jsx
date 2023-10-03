import React, { useState, useMemo, useEffect } from "react";

const ACSYearsUpdate = (props) => {
  const [currentYear, setCurrentYear] = useState(null);
  const { years = [], setYears } = props;

  const yearsOptions = Array.from(
    Array(new Date().getFullYear() - 2009),
    (_, i) => i + 2010
  );

  const diffrence = useMemo(() => {
    return yearsOptions.filter((x) => !years?.includes(x));
  }, [years, yearsOptions]);

  const setAddNewYear = () => {
    if (currentYear) {
      const tempYears = [...years, currentYear];
      setYears(tempYears);
    }
  };

  const setDeleteColumn = (ind) => {
    years?.splice(ind, 1);
    setYears([...years]);
  };

  useEffect(() => {
    if (diffrence && diffrence.length) {
      setCurrentYear(diffrence[0]);
    } else {
      setCurrentYear(null);
    }
  }, [diffrence]);

  return (
    <>
      <select
        id="years-select"
        className="p-2 mx-2 flex-1 w-48 bg-grey-50 focus:bg-blue-100 border border-gray-300"
        onChange={(e) => setCurrentYear(+e.target.value)}
      >
        {diffrence && diffrence.length ? (
          <>
            <optgroup label="Available Years">
              {diffrence.map((y, i) => (
                <option key={i} value={+y}>
                  {y}
                </option>
              ))}
            </optgroup>
          </>
        ) : null}

        {years && years.length ? (
          <>
            <optgroup label="Selected Years">
              {years.map((y, i) => (
                <option key={i} value={+y} disabled>
                  {y}
                </option>
              ))}
            </optgroup>
          </>
        ) : null}
      </select>


      {/* {!currentYear ? (
        <span className="text-rose-800">
          {"Years not available for Selection"}
        </span>
      ) : null} */}

      <button
        onClick={() => setAddNewYear()}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4"
        disabled={Boolean(!currentYear)}
      >
        Add a new year{" "}
      </button>

      <div className="grid grid-cols-4 gap-2 my-2">
        {years &&
          (years || []).map((year, i) => (
            <>
              <div key={i} className="pt-2 pr-8">
                <span className="py-3 px-5 flex-1 shadow bg-grey-50 focus:bg-blue-100 border-gray-300">
                  {year}
                </span>
                <>
                  <button
                    onClick={() => setDeleteColumn(i)}
                    className="mx-3 my-2 text-white bg-red-700 hover:bg-red-800 focus:outline-none focus:ring-4 focus:ring-red-300 font-medium rounded-full text-sm px-5 py-2.5 text-center dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900"
                  >
                    <span className=" cursor-pointer">
                      <i className="fa fa-trash" />
                    </span>
                  </button>
                </>
                <br />
              </div>
            </>
          ))}
      </div>
    </>
  );
};

export default ACSYearsUpdate;
