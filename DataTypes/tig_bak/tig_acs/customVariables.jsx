import React, { useState } from "react";
import { Input } from "~/modules/avl-components/src";

export const ACSCustomVariables = ({ addNewVariable }) => {
  const [variableName, setVariableName] = useState("");
  const [censusKeys, setCensusKeys] = useState("");
  const [divisorKeys, setDivisorKeys] = useState("");
  const [isInputValid, setIsInputValid] = useState(false);

  const setAddNewColumn = () => {
    const newVariable = {
      label: variableName,
      value: {
        name: variableName,
        censusKeys: censusKeys.split(","),
        divisorKeys: divisorKeys.split(","),
      },
    };
    addNewVariable(newVariable);
  };

  return (
    <>
      <div className="grid grid-cols-3 my-2">
        <div className="pt-2 pr-8">
          <Input
            type="text"
            placeholder={"Enter variable name"}
            className="p-2 flex-1 px-2 shadow bg-grey-50 focus:bg-blue-100 border-gray-300 "
            value={variableName}
            onChange={(val) => {
              setIsInputValid(Boolean(censusKeys) && Boolean(val));
              setVariableName(val);
            }}
          />
        </div>
        <div className="pt-2 pr-8">
          <Input
            type="text"
            placeholder={"Enter census keys"}
            className="p-2 flex-1 px-2 shadow bg-grey-50 focus:bg-blue-100 border-gray-300 "
            value={censusKeys}
            onChange={(val) => {
              setIsInputValid(Boolean(censusKeys) && Boolean(val));
              setCensusKeys(val);
            }}
          />
        </div>
        <div className="pt-2 pr-8">
          <Input
            type="text"
            placeholder={"Enter divisor keys"}
            className="p-2 flex-1 px-2 shadow bg-grey-50 focus:bg-blue-100 border-gray-300 "
            value={divisorKeys}
            onChange={(val) => setDivisorKeys(val)}
          />
        </div>
      </div>
      <button
        onClick={() => setAddNewColumn()}
        disabled={!isInputValid}
        className="bg-blue-500 hover:bg-blue-700 disabled:opacity-25 text-white font-bold py-2 px-4"
      >
        Add a new Variable {" "}
      </button>
    </>
  );
};
