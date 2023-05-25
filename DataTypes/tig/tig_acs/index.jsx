import React from "react";
import AcsSelection from "./acsSelection";

const TigAcsConfig = {
  sourceCreate: {
    name: "Create",
    component: (props) => <AcsSelection {...props} dataType="tig_acs" />,
  },
};

export default TigAcsConfig;
