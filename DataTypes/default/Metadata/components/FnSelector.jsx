import React from "react";
import {DamaContext} from "../../../../store/index.js";
import {editMetadata} from "../utils/editMetadata.js";

export const FnSelector = ({sourceId, metadata, setMetadata, col, value}) => {
    const {pgEnv, falcor} = React.useContext(DamaContext);

    const onChange = React.useCallback(async e => {
        await editMetadata({sourceId, pgEnv, falcor, metadata, setMetadata, col, value: {defaultFn: e.target.value}});
    }, [col, metadata]);

    return (<select
        className="pl-3 pr-4 py-2.5 h-fit border border-blue-100 bg-blue-50 w-full bg-white mr-2 flex items-center justify-between text-sm"
        value={value}
        onChange={onChange}
    >
        <option value={null}>
            none
        </option>
        <option value="Sum">
            sum
        </option>
        <option value="List">
            list
        </option>
    </select>)
}