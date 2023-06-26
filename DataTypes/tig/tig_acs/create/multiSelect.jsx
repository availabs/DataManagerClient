import Select from "react-select";
import makeAnimated from "react-select/animated";

const MultiSelect = ({ options, onChange, value, selectMessage = "", ...props }) => {
  const animatedComponents = makeAnimated();
  return (
    <Select
      options={options}
      onChange={onChange}
      value={value}
      hideSelectedOptions={true}
      closeMenuOnSelect={false}
      isMulti
      placeholder={`-- Select ${selectMessage} --`}
      components={{ animatedComponents }}
      {...props}
    />
  );
};

export default MultiSelect;
