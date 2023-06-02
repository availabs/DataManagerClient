import Select from "react-select";

const MultiSelect = ({ options, onChange, value, ...props }) => {
  return (
    <Select
      options={options}
      onChange={onChange}
      value={value}
      hideSelectedOptions={true}
      closeMenuOnSelect={false}
      isMulti
      placeholder="-- Select --"
      {...props}
    />
  );
};

export default MultiSelect;
