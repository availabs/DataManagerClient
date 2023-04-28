import React, { useState } from "react";
import CountySelector from "./multiCountySelect";

export const CountySelectorComponent = () => {
  const [selectedCounties, setSelectedCounties] = useState([]);
  const countiesOptions = new Array(10).fill("null").map((_, i) => ({
    label: `new ${i}`,
    value: i,
  }));
  return (
    <>
      <CountySelector
        countiesOptions={countiesOptions}
        selectedCounties={selectedCounties}
        setSelectedCounties={setSelectedCounties}
      />
    </>
  );
};

const TigAcsConfig = {
  sourceCreate: {
    name: "Create",
    component: (props) => (
      <div>
        Add Ammerican Communinity Survey Data
        <CountySelectorComponent />
      </div>
    ),
  },
};

export default TigAcsConfig;
