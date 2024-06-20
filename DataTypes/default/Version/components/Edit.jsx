import React, {useContext, useEffect, useState} from "react";
import {DamaContext} from "../../../../store/index.js";
import { Input, Button, Modal } from "~/modules/avl-components/src"

export const Edit = ({startValue, attr, viewId, cancel=()=>{}}) => {
    const [value, setValue] = useState('')
    const {pgEnv, baseUrl, falcor} = useContext(DamaContext);
    /*const [loading, setLoading] = useState(false)*/

    useEffect(() => {
        setValue(startValue)
    },[startValue])

    const save = (attr, value) => {
        if(viewId) {
            falcor.set({
                paths: [
                    ['dama',pgEnv,'views','byId',viewId,'attributes', attr ]
                ],
                jsonGraph: {
                    dama:{
                        [pgEnv] : {
                            views: {
                                byId:{
                                    [viewId] : {
                                        attributes : {[attr]: value}
                                    }
                                }
                            }
                        }
                    }
                }
            }).then(d => {
                cancel()
            })
        }
    }

    return (
        <div className='w-full flex'>
            <Input className='flex-1 px-2 shadow bg-blue-100 focus:ring-blue-700 focus:border-blue-500  border-gray-300 rounded-none rounded-l-md' value={value} onChange={e => setValue(e)}/>
            <Button themeOptions={{size:'sm', color: 'primary'}} onClick={e => save(attr,value)}> Save </Button>
            <Button themeOptions={{size:'sm', color: 'cancel'}} onClick={e => cancel()}> Cancel </Button>
        </div>
    )
}