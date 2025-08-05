import React, { useCallback } from "react";
import { useNavigate } from "react-router";

import { ScalableLoading } from "~/modules/avl-components/src";
import { DAMA_HOST } from "~/config";

const publish = async (props, navigate, pgEnv) => {
    props.setLoading(true);

    const publishData = {
        source_id: props?.source_id,
        user_id: props?.user_id,
        name: props?.name,
        type: props?.type,
        pgEnv: pgEnv || props?.pgEnv,
    };

    try {
        const res = await fetch(
            `${DAMA_HOST}/dama-admin/${pgEnv}/analytics/publish`,
            {
                method: "POST",
                body: JSON.stringify(publishData),
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
        const publishFinalEvent = await res.json();
        const { source_id } = publishFinalEvent;

        props.setLoading(false);
        if (source_id) {
            navigate(`/datasources/source/${source_id}`);
        }
    } catch (err) {
        props.setLoading(false);
    }
};

export default function Publish(props) {
    const navigate = useNavigate();
    const { loading, setLoading, pgEnv, ...restProps } = props;

    const handlePublishClick = useCallback(() => {
        publish({ ...restProps, setLoading }, navigate, pgEnv);
    }, [restProps, navigate, setLoading]);

    return (
        <button
            className="cursor-pointer bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={handlePublishClick}
        >
            {loading ? (
                <div style={{ display: "flex" }}>
                    <div className="mr-2">Publishing</div>
                    <ScalableLoading scale={0.25} color={"#fefefe"} />
                </div>
            ) : (
                "New Publish"
            )}
        </button>
    );
}
