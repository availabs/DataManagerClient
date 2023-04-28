import Select from "react-select";

const Group = (props) => {
  return (
    <Select
      options={props.options}
      onChange={props.onChange}
      value={props.value}
      hideSelectedOptions={true}
      closeMenuOnSelect={false}
      isMulti
      placeholder="-- Select --"
      {...props}
    />
  );
};

export default Group;
