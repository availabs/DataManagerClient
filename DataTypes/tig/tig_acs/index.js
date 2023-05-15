import React from "react";
import AcsSelection from "./acsSelection";

const TigAcsConfig = {
  sourceCreate: {
    name: "Create",
    component: (props) => (
      <div>
        Add Ammerican Communinity Survey Data
        <AcsSelection {...props} dataType="tig_acs" />
      </div>
    ),
  },
};

export default TigAcsConfig;
