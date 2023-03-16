import React, { useState } from "react";
import get from "lodash.get";
import { DataTypes } from "../index";
import { datasets } from "../open_fema_data/create";

const AddVersion = ({ source, views, user }) => {
  console.log('???', source, views, user)
  const newVersion = Math.max(...views.map(v => parseInt(v.version) || 0)) + 1;
  const [versionName, setVersionName] = useState(newVersion);

  const CreateComp = React.useMemo(() => {
    console.log(source)
      let sourceTypeToFileNameMapping = get(source, 'type', '').substring(0, 3) === "tl_" ? "tiger_2017" : source.type;

      if (datasets.includes(sourceTypeToFileNameMapping)){
        //need to crete separate data types
        sourceTypeToFileNameMapping = 'open_fema_data'
      }
      return get(DataTypes, `[${sourceTypeToFileNameMapping}].sourceCreate.component`, () => <div />)
    }, [source]);

  return <>
    <div className={`flex-1 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 text-sm font-medium text-gray-500 `}>
      <label>Version Name:</label>
      <input
        key={"versionName"}
        className={"p-2"}
        placeholder={versionName}
        onChange={e => setVersionName(e.target.value)} />
    </div>
    <CreateComp source={source} existingSource={source} user={user} newVersion={versionName} />
  </>;
};

export default AddVersion;