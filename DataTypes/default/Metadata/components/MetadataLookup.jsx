import React, {useEffect, useState} from "react";
import {Button} from "~/modules/avl-components/src";
import {RenderTextArea, RenderTextBox} from "./Edit.jsx";
import {value} from "lodash/seq.js";
import {editMetadata} from "../utils/editMetadata.js";
import {DamaContext} from "../../../../store/index.js";
import { JsonView, allExpanded, darkStyles, defaultStyles } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';
import {isJson} from "../../../../utils/macros.jsx";

export const ManageMetaLookup = ({
                                     metadata, setMetadata,
                                     col,
                                     startValue,
                                     sourceId,
                                     setEditing = () => {},
                                 }) => {
    const {pgEnv, baseUrl, falcor} = React.useContext(DamaContext);

    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(startValue);

    useEffect(() => {
        setValue(startValue)
    }, [startValue]);

    const save = (value) => {
        editMetadata({
            sourceId,
            pgEnv,
            falcor,
            metadata, setMetadata,
            col, value: {'meta_lookup': value}
        });

        setIsEditing(false);
        setEditing(null);
    }

    return (
        isEditing ?
            <RenderTextBox value={value} setValue={setValue} save={save} cancel={() => setIsEditing(false)}/> :
            <div className={'text-xs font-thin flex flex-col'}>
                <div className={'self-end my-1'}>
                    <Button themeOptions={{size: 'xs', color: 'transparent'}}
                            onClick={e => setIsEditing(!isEditing)}> Edit </Button>
                </div>
                <div className={'border border-4 border-dotted p-1'}>
                    <JsonView data={isJson(startValue) ? JSON.parse(startValue) : {}} shouldExpandNode={allExpanded} style={defaultStyles} />
                </div>
            </div>
    )
}