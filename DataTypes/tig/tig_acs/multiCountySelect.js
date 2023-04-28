import makeAnimated from "react-select/animated";

import MultiSelect from "./../multiSelect";

const CountySelector = ({
  selectedCounties,
  countiesOptions,
  setSelectedCounties,
}) => {
    const animatedComponents = makeAnimated();
  return (
    <div className="">
      <MultiSelect
        value={(selectedCounties || [])
          .map((values) =>
            (countiesOptions || []).find((prod) => prod.value === values)
          )
          .filter((prod) => prod && prod.value && prod.label)
          .map((prod) => ({
            label: prod?.label,
            value: prod?.value,
          }))}
        closeMenuOnSelect={false}
        options={countiesOptions || []}
        onChange={(value) => {
          setSelectedCounties(value?.map((val) => val?.value));
        }}
        components={{ animatedComponents }}
        placeholder="-- Select Counties --"
        isSearchable
      />
    </div>
  );
};

export default CountySelector;
