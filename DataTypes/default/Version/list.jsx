import React, {Fragment} from "react";
import { Table } from "~/modules/avl-components/src";
import get from "lodash/get";
import { Link, useNavigate, useParams } from "react-router-dom";
import { formatDate } from "../../../utils/macros";
import { DamaContext } from "~/pages/DataManager/store";
import Version, { VersionDownload } from "./version";

import DeleteVersion from "./delete";

// const MakeAuthoritativeButton = ({ viewId, meta, pgEnv }) => {
//   return (
//     <button
//       className={`${get(meta, "authoritative") === "true" ? `cursor-not-allowed bg-blue-100` : `bg-blue-50 hover:bg-blue-400 hover:text-white`} p-2`}
//       disabled={get(meta, "authoritative") === "true"}
//       onClick={async () => {
//         await makeAuthoritative(getDamaApiRoutePrefix(pgEnv), viewId);
//       }
//       }>

//       {get(meta, "authoritative") === "true" ? <i className="fad fa-gavel"></i> : <i class="fa-regular fa-gavel"></i>}
//     </button>
//   );
// };

const DeleteButton = ({ viewId, sourceId, meta, navigate }) => {
  const { baseUrl } = React.useContext(DamaContext);
  return (
    <button
      disabled={get(meta, "authoritative") === "true"}
      className={`bg-red-50 p-2 ${get(meta, "authoritative") === "true" ? `cursor-not-allowed` : `hover:bg-red-400 hover:text-white`}`}
      onClick={() => navigate(`/${baseUrl}/source/${sourceId}/versions/${viewId}/delete`)}
    >
      <i className="fad fa-trash"></i>
    </button>
  );
};

const Versions = ({ source, views, meta }) => {
  const { pgEnv, baseUrl, user } = React.useContext(DamaContext);
  const navigate = useNavigate();
  const { sourceId, viewId, vPage } = useParams();

  if (vPage === "delete") {
    return <DeleteVersion  />;
  }
  if (viewId) {
    return (
      <Version />
    );
  }

  return (
    <div>
      <Table
        onRowClick={(e, row) => {
          navigate(
            `${baseUrl}/source/${sourceId}/versions/${row.original.view_id}`
          );
        }}
        data={views}
        columns={[
          {
            Header: "Version Id",
            accessor: (c) => c["version"] || c["view_id"],
          },
          {
            Header: "User",
            accessor: "user_id",
          },
          {
            Header: "Uploaded",
            accessor: (c) => formatDate(c["_created_timestamp"]),
          },
          {
            Header: " Download",
            accessor: (c) => {
              return <VersionDownload view={c} />;
            },
            disableFilters: true,
          },
        ]}
      />
    </div>
  );
};




export default Versions;
