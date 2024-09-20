import React, {
  useState,
  useReducer,
  useEffect,
  useContext,
} from "react";
import { DamaContext } from "~/pages/DataManager/store";
import { DAMA_HOST } from "~/config";
import { reducer } from "./components/reducer";
import PublishNpmrds from "./components/publish";

const BlankComponent = () => <></>;
export default function NpmrdsCreate({
  source = {},
  user = {},
  dataType = "npmrds",
  CustomAttributes = BlankComponent,
}) {
  const { name: damaSourceName, source_id: sourceId, type } = source;
  const { pgEnv, user: ctxUser } = useContext(DamaContext);

  const [loading, setLoading] = useState(false);
  const [state, dispatch] = useReducer(reducer, {
    damaSourceId: sourceId,
    damaSourceName: damaSourceName,
    userId: user?.id ?? ctxUser.id,
    email: user?.email ?? ctxUser.email,
    etlContextId: null,
    dataType: dataType,
    damaServerPath: `${DAMA_HOST}/dama-admin/${"npmrds"}`,
    sourceType: type,
  });

  useEffect(() => {
    dispatch({ type: "update", payload: { damaSourceName } });
  }, [damaSourceName]);

  useEffect(() => {
    dispatch({ type: "update", payload: { sourceType: type } });
  }, [type]);

  if (!sourceId && !damaSourceName) {
    return <div> Please enter a datasource name.</div>;
  }

  return (
    <div className="w-full max-w-lg my-4">
      <div className="md:flex md:items-center">
        <PublishNpmrds
          loading={loading}
          setLoading={setLoading}
          source_id={sourceId}
          user_id={user?.id ?? ctxUser.id}
          name={source?.name}
          type={source?.type}
          pgEnv={pgEnv}
        />
      </div>
    </div>
  );
}
