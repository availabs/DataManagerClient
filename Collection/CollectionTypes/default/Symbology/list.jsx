import React, {Fragment} from "react";
import { Table } from "~/modules/avl-components/src";
import get from "lodash/get";
import { Link, useNavigate, useParams } from "react-router-dom";
import { formatDate } from "../../../../utils/macros";
import { DamaContext } from "~/pages/DataManager/store";

const Symbologies = ({ collection, symbologies, meta }) => {
  const { pgEnv, baseUrl, user } = React.useContext(DamaContext);
  const navigate = useNavigate();
  const { collectionId, symbologyId, vPage } = useParams();
console.log(symbologyId)
  if (symbologyId) {
    //RYAN TODO make individual symbology page
    return (
      <div>HELLO WORLD THIS IS AN INDIVIDUAL SYMBOLOGY PAGE</div>
      //<Version />
    );
  }

  return (
      <Table
        data={symbologies}
        columns={[
      {
        Header: "Symbology Id",
        accessor: c => <Link to={`${baseUrl}/collection/${collectionId}/symbology/${c["symbology_id"]}`}> {c["symbology_id"]} </Link>,
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
        Header: "Uploaded",
        accessor: c => formatDate(c["_created_timestamp"])
      },
    ]}
      />
  );
};




export default Symbologies;
