import React, { useEffect, /*useMemo,*/ useState } from "react";
import { useFalcor, withAuth, Table } from "modules/avl-components/src";
import get from "lodash.get";
import { useSelector } from "react-redux";
import { Link, useHistory, useParams } from "react-router-dom";
import { selectPgEnv } from "pages/DataManager/store";
import { getDamaApiRoutePrefix, makeAuthoritative } from "../../utils/DamaControllerApi";
import { formatDate } from "../../utils/macros";
import Version from "./version";
import DeleteVersion from "./DeleteVersion";

const MakeAuthoritativeButton = ({ viewId, meta, pgEnv }) => {
  return (
    <button
      className={`bg-blue-50 ${get(meta, "authoritative") === "true" ? `cursor-not-allowed` : `hover:bg-blue-400 hover:text-white`} p-2`}
      disabled={get(meta, "authoritative") === "true"}
      onClick={async () => {
        await makeAuthoritative(getDamaApiRoutePrefix(pgEnv), viewId);
      }
      }>

      {get(meta, "authoritative") === "true" ? "Authoritative" : "Make Authoritative"}
    </button>
  );
};

const DeleteButton = ({ viewId, sourceId, meta, history, baseUrl }) => {
  return (
    <button
      disabled={get(meta, "authoritative") === "true"}
      className={`bg-red-50 p-2 ${get(meta, "authoritative") === "true" ? `cursor-not-allowed` : `hover:bg-red-400 hover:text-white`}`}
      onClick={() => history.push(`${baseUrl}/source/${sourceId}/versions/${viewId}/delete`)}
    >
      Delete
    </button>
  );
};

const Versions = withAuth(({ source, views, user, baseUrl, meta }) => {
  const pgEnv = useSelector(selectPgEnv);
  const history = useHistory();
  const { sourceId, viewId, vPage } = useParams();

  if (vPage === "delete") {
    return <DeleteVersion baseUrl={baseUrl} />;
  }
  if (viewId) {
    return (
      <Version baseUrl={baseUrl} />
    );
  }

  return (
    <div className="">
      <Table
        data={views}
        columns={[
          {
            Header: "Version Id",
            accessor: c => <Link to={`${baseUrl}/source/${sourceId}/versions/${c["view_id"]}`}> {c["view_id"]} </Link>,
            align: "left"
          },
          {
            Header: "Version",
            accessor: "version"
          },
          {
            Header: "User",
            accessor: "user_id"
          },
          {
            Header: "Updated",
            accessor: c => formatDate(c["_modified_timestamp"])
          },
          {
            Header: "Created",
            accessor: c => formatDate(c["_created_timestamp"])
          },
          {
            Header: "Status",
            accessor: c => <MakeAuthoritativeButton viewId={c["view_id"]} meta={c["metadata"]} pgEnv={pgEnv} />,
            disableFilters: true
          },
          {
            Header: "Delete",
            accessor: c => <DeleteButton viewId={c["view_id"]} sourceId={c["source_id"]} meta={c["metadata"]}
                                         history={history} baseUrl={baseUrl} />,
            disableFilters: true
          }
        ]}
      />

    </div>
  );
});


export default Versions;
