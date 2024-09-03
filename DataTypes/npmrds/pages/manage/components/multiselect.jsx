import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from "@headlessui/react";

const MultiSelect = ({ options, onChange, value }) => {
  function isSelected(val) {
    return (value || []).find((el) => el?.value === val?.value) ? true : false;
  }

  function handleSelection(val) {
    const selectedResult = (value || []).filter(
      (selected) => selected?.value === val?.value
    );

    if ((selectedResult || []).length > 0) {
      removeSelect(val);
    } else {
      onChange((currents) => [...currents, val]);
    }
  }

  function removeSelect(val) {
    const removedSelection = (value || []).filter(
      (selected) => selected?.value !== val?.value
    );
    onChange(removedSelection);
  }
  return (
    <div
      className="flex items-center justify-center"
      style={{ minWidth: "479px" }}
    >
      <div className="w-full max-w-xl mx-auto">
        <Listbox
          as="div"
          className="space-y-1"
          value={value}
          onChange={handleSelection}
        >
          {({ open }) => (
            <>
              <div className="relative">
                <span className="inline-block w-full rounded-md shadow-sm">
                  <ListboxButton className="cursor-default relative w-full rounded-md border border-gray-300 bg-white pl-3 pr-10 py-2 text-left focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition ease-in-out duration-150 sm:text-sm sm:leading-5">
                    {!(value || []).length && "Select npmrds from list"}
                    {(value || []).map((val) => (
                      <div
                        key={val?.value}
                        className="inline-flex items-center px-1 mr-1 mt-1 rounded text-white bg-blue-400 p-2"
                      >
                        {val?.label}
                        <div
                          className="ml-1 bg-blue-100 rounded-full cursor-pointer"
                          onClick={() => removeSelect(val)}
                        >
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M4.29289 4.29289C4.68342 3.90237 5.31658 3.90237 5.70711 4.29289L10 8.58579L14.2929 4.29289C14.6834 3.90237 15.3166 3.90237 15.7071 4.29289C16.0976 4.68342 16.0976 5.31658 15.7071 5.70711L11.4142 10L15.7071 14.2929C16.0976 14.6834 16.0976 15.3166 15.7071 15.7071C15.3166 16.0976 14.6834 16.0976 14.2929 15.7071L10 11.4142L5.70711 15.7071C5.31658 16.0976 4.68342 16.0976 4.29289 15.7071C3.90237 15.3166 3.90237 14.6834 4.29289 14.2929L8.58579 10L4.29289 5.70711C3.90237 5.31658 3.90237 4.68342 4.29289 4.29289Z"
                              fill="#4A5568"
                            />
                          </svg>
                        </div>
                      </div>
                    ))}
                    <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <svg
                        className="h-5 w-5 text-gray-400"
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          d="M7 7l3-3 3 3m0 6l-3 3-3-3"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </ListboxButton>
                </span>

                <Transition
                  show={open}
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                  className="absolute mt-1 w-full rounded-md bg-white shadow-lg"
                >
                  <ListboxOptions
                    static
                    className="max-h-60 rounded-md py-1 text-base leading-6 shadow-xs overflow-auto focus:outline-none sm:text-sm sm:leading-5"
                  >
                    {(options || []).map((opt) => {
                      const selected = isSelected(opt);
                      return (
                        <ListboxOption key={opt?.value} value={opt}>
                          {({ active }) => (
                            <div
                              className={`${
                                active
                                  ? "text-white bg-blue-600"
                                  : "text-black-900"
                              } cursor-default select-none relative py-2 pl-8 pr-4`}
                            >
                              <span
                                className={`${
                                  selected ? "font-semibold" : "font-normal"
                                } block truncate`}
                              >
                                {opt?.label}
                              </span>
                              {selected && (
                                <span
                                  className={`${
                                    active ? "text-white" : "text-blue-600"
                                  } absolute inset-y-0 left-0 flex items-center pl-1.5`}
                                >
                                  <svg
                                    className="h-5 w-5"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </span>
                              )}
                            </div>
                          )}
                        </ListboxOption>
                      );
                    })}
                  </ListboxOptions>
                </Transition>
              </div>
            </>
          )}
        </Listbox>
      </div>
    </div>
  );
};

export default MultiSelect;
