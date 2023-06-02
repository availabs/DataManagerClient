import Select from "react-select";

const MultiSelect = ({ options, onChange, value, selectMessage, ...props }) => {
  return (
    <Select
      options={options}
      onChange={onChange}
      value={value}
      hideSelectedOptions={true}
      closeMenuOnSelect={false}
      isMulti
      placeholder={`-- Select ${selectMessage || ""} --`}
      {...props}
    />
  );
};

export default MultiSelect;
