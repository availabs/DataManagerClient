import React, { useState } from "react";
import { cloneDeep, set } from "lodash";
import { Input } from "~/modules/avl-components/src";

const ACSVariableUpdate = (props) => {
  const [currentVariable, setCurrentVarialble] = useState(null);
  const { variables = [], setVariables } = props;

  const setAddNewVariable = () => {
    const newVariable = {
      lable: currentVariable,
      value: {
        name: currentVariable,
        censusKeys: "",
        divisorKeys: "",
      },
    };
    const tempVars = [...variables, newVariable];
    setVariables(tempVars);
    setCurrentVarialble(null);
  };

  const setDeleteColumn = (ind) => {
    variables?.splice(ind, 1);
    setVariables(cloneDeep(variables));
  };

  const setUpdateVariable = (index, value, key) => {
    set(variables[index], `value.${key}`, value);
    setVariables(cloneDeep(variables));
  };

  return (
    <>
      <Input
        type="text"
        className="p-2 mx-2 flex-1 shadow bg-grey-50 focus:bg-blue-100 border-gray-300 "
        value={currentVariable}
        placeholder="Type a variable name"
        onChange={(val) => setCurrentVarialble(val)}
      />
      <button
        onClick={() => setAddNewVariable()}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4"
      >
        Add a new Variable{" "}
      </button>
      <div class="flex flex-col p-5 m-3">
        <div class="overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div class="inline-block min-w-full py-2 sm:px-6 lg:px-8">
            <div class="overflow-hidden">
              <table class="min-w-full text-left text-sm font-light">
                <thead class="border-b font-medium ">
                  <tr>
                    <th scope="col" class="px-6 py-4">
                      Name
                    </th>
                    <th scope="col" class="px-6 py-4">
                      Census Keys
                    </th>
                    <th scope="col" class="px-6 py-4">
                      Divisor Keys
                    </th>
                    <th scope="col" class="px-6 py-4">
                      Delete
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {variables && variables.length > 0 ? (
                    variables.map((v, i) => (
                      <tr class="transition duration-300 ease-in-out ">
                        <td class="whitespace-nowrap px-6 py-4 font-medium">
                          {v?.value?.name || ""}
                        </td>
                        <td class="whitespace-nowrap px-6 py-4">
                          <Input
                            type="text"
                            className="p-2 m-2 flex-1 shadow bg-grey-50 focus:bg-blue-100 border-gray-300"
                            value={v?.value?.censusKeys || ""}
                            placeholder="Enter Census Keys"
                            onChange={(val) =>
                              setUpdateVariable(i, val, "censusKeys")
                            }
                          />
                        </td>
                        <td class="whitespace-nowrap px-6 py-4">
                          <Input
                            type="text"
                            className="p-2 m-2 flex-1 shadow bg-grey-50 focus:bg-blue-100 border-gray-300"
                            value={v?.value?.divisorKeys || ""}
                            placeholder="Enter Divisor Keys"
                            onChange={(val) =>
                              setUpdateVariable(i, val, "divisorKeys")
                            }
                          />
                        </td>
                        <td class="whitespace-nowrap px-6 py-4">
                          <div
                            onClick={() => setDeleteColumn(i)}
                            className="mx-3 my-2 text-white bg-red-500 hover:bg-red-800 focus:outline-none focus:ring-4 focus:ring-red-300 font-medium rounded-full text-sm px-5 py-2.5 text-center "
                          >
                            <span className=" cursor-pointer">
                              <i className="fa fa-trash" />
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr class="border-b transition duration-300 ease-in-out ">
                      No Variables Availables
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ACSVariableUpdate;
