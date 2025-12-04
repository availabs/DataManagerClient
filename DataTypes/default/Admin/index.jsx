import { useContext, useState, useEffect, useMemo } from "react";
import { ThemeContext, Input, Button } from "~/modules/avl-components/src";
import Select from "~/modules/avl-components/src/components/Inputs/select";
import { DamaContext } from "~/pages/DataManager/store";
import { wrappers } from "~/modules/ams/src";
import { Link } from "react-router";
import TaskList from "~/pages/DataManager/Tasks/TaskList";
const amsReduxWrapper = wrappers["ams-redux"];
const PUBLIC_GROUP = 'Public';
const ReduxedAdminPage = amsReduxWrapper((props) => {
  const { user } = useContext(DamaContext);
  const { groups, source, users, getGroups, getUsers, getUsersPreferences } =
    props;

  useEffect(() => {
    if (user) {
      getGroups();
      getUsers();
    }
  }, [user]);

  useEffect(() => {
    if (!users?.some((user) => !!user.preferences)) {
      const userEmails = users?.map((user) => user.email);
      getUsersPreferences({ userEmails });
    }
  }, [users]);

  return (
    <AdminPage
      groups={groups}
      users={users}
      source={source}
      loggedInUser={user}
    />
  );
});

const AdminPage = ({ source, users, groups, loggedInUser }) => {
  const componentGroups = [...groups];
  const myTheme = useContext(ThemeContext);
  const { falcor, pgEnv, baseUrl } = useContext(DamaContext);

  const { auth: sourceAuth } = source?.statistics ?? {};

  const updateAuth = useMemo(() => {
    return async (newAuth) => {
      await falcor.set({
        paths: [
          [
            "dama",
            pgEnv,
            "sources",
            "byId",
            source.source_id,
            "attributes",
            "statistics",
          ],
        ],
        jsonGraph: {
          dama: {
            [pgEnv]: {
              sources: {
                byId: {
                  [source.source_id]: {
                    attributes: { statistics: JSON.stringify(newAuth) },
                  },
                },
              },
            },
          },
        },
      });
    };
  }, [falcor, pgEnv, source.source_id]);

  const addUserAuth = useMemo(() => {
    return async ({ rowKey: userId }) => {
      const newAuth = { auth: { ...sourceAuth } };
      if(!newAuth.auth["users"]) {
        newAuth.auth["users"] = {}
      }
      newAuth.auth["users"][userId] = "1";
      console.log("newAuth, addUserAuth::", newAuth);
      await updateAuth(newAuth);
    };
  }, [sourceAuth, updateAuth]);

  const removeUserAuth = useMemo(() => {
    return async ({ rowKey: userId }) => {
      const newAuth = { auth: { ...sourceAuth } };
      delete newAuth.auth["users"][userId];
      console.log("newAuth, removeUserAuth::", newAuth);
      await updateAuth(newAuth);
    };
  }, [sourceAuth, updateAuth]);

  const setUserAuth = useMemo(() => {
    return async ({ rowKey: userId, authLevel }) => {
      const newAuth = { auth: { ...sourceAuth } };
      newAuth.auth["users"][userId] = authLevel;
      console.log("newAuth,setUserAuth::", newAuth);
      await updateAuth(newAuth);
    };
  }, [sourceAuth, updateAuth]);

  const addGroupAuth = useMemo(() => {
    return async ({ rowKey: groupName }) => {
      const newAuth = { auth: { ...sourceAuth } };
      if(!newAuth.auth["groups"]) {
        newAuth.auth["groups"] = {}
      }
      newAuth.auth["groups"][groupName] = "1";
      console.log("newAuth, addGroupAuth::", newAuth);
      await updateAuth(newAuth);
    };
  }, [sourceAuth, updateAuth]);

  const removeGroupAuth = useMemo(() => {
    return async ({ rowKey: groupName }) => {
      const newAuth = { auth: { ...sourceAuth } };
      delete newAuth.auth["groups"][groupName];
      console.log("newAuth, removeGroupAuth::", newAuth);
      await updateAuth(newAuth);
    };
  }, [sourceAuth, updateAuth]);

  const setGroupAuth = useMemo(() => {
    return async ({ rowKey: groupName, authLevel }) => {
      const newAuth = { auth: { ...sourceAuth } };
      newAuth.auth["groups"][groupName] = authLevel;
      console.log("newAuth,setGroupAuth::", newAuth);
      await updateAuth(newAuth);
    };
  }, [sourceAuth, updateAuth]);

  const currentSourceUserIds = sourceAuth?.users ? Object.keys(sourceAuth?.users) : [];
  const otherUsers = users.filter(
    (allUser) => !currentSourceUserIds.includes(JSON.stringify(allUser.id))
  );
  const test = users.find(u => u.id === 175);
  console.log({test})
  const currentGroupNames = sourceAuth?.groups ? Object.keys(sourceAuth?.groups) : [];
  const otherGroups = groups.filter(
    (allGroup) => !currentGroupNames.includes(JSON.stringify(allGroup.name))
  );

  if(!Object.keys(sourceAuth?.groups ?? {}).includes(PUBLIC_GROUP)) {
    otherGroups.push({"name": PUBLIC_GROUP, authLevel: -1})
  } else {
    componentGroups.push({"name": PUBLIC_GROUP })
  }
  console.log({currentSourceUserIds})
  return (
    <div
      className={`${
        myTheme.background ?? "bg-grey-100"
      } h-full flex flex-wrap py-12 sm:px-6 lg:px-8 gap-3`}
    >
      <div className="w-full">
        <h2 className="text-xl font-medium text-gray-900">Admin</h2>
      </div>
      <AdminPageTile title="User Access Controls" tileWidth="w-2/3">
        <div className="mb-4">
          <Select
            searchable={true}
            domain={otherUsers}
            accessor={(g) => g.id}
            listAccessor={(g) => g.email}
            placeholder="Add user access..."
            onChange={(v) => {
              addUserAuth({ rowKey: v.id });
            }}
          />
        </div>
        {currentSourceUserIds.length > 0 && (
          <>
            <div className="grid grid-cols-6 gap-2">
              <div className="col-span-2 font-bold">Name</div>
              <div className="col-span-2">Authority Level</div>
            </div>
            <div className="grid grid-cols-6 gap-2 items-center">
              {currentSourceUserIds.map((sourceUserId, i) => (
                <AuthRow
                  removeUserAuth={removeUserAuth}
                  setUserAuth={setUserAuth}
                  key={sourceUserId}
                  user={
                    users?.find((user) => user.id === parseInt(sourceUserId)) ??
                    {}
                  }
                  authLevel={sourceAuth.users[sourceUserId]}
                  loggedInUser={loggedInUser}
                />
              ))}
            </div>
          </>
        )}
      </AdminPageTile>
      <AdminPageTile title="Admin Actions" tileWidth="w-[30%]">
        <div className="w-full p-1 flex">
          <Link
            className={
              "w-full flex-1 text-center border shadow hover:bg-blue-100 p-4"
            }
            to={`${baseUrl}/source/${source.source_id}/meta_advanced`}
          >
            Advanced Metadata <i className="fa fa-circle-info" />
          </Link>
        </div>
        <div className="w-full p-1 flex">
          <Link
            className={
              "w-full flex-1 text-center border shadow hover:bg-blue-100 p-4"
            }
            to={`${baseUrl}/source/${source.source_id}/add_version`}
          >
            Add Version <i className="fad fa-upload" />
          </Link>
        </div>
        <div className="w-full p-1 flex">
          <Link
            className={
              "w-full flex-1 text-center bg-red-100 border border-red-200 shadow hover:bg-red-400 hover:text-white p-4"
            }
            to={`${baseUrl}/delete/source/${source.source_id}`}
          >
            Delete <i className="fad fa-trash" />
          </Link>
        </div>
      </AdminPageTile>
      <AdminPageTile title="Group Access Controls" tileWidth="w-2/3">
        <div className="mb-4">
          <Select
            searchable={true}
            domain={otherGroups}
            accessor={(g) => g.name}
            listAccessor={(g) => g.name}
            displayAccessor={(g) => g.name}
            placeholder="Add group access..."
            onChange={(v) => {
              addGroupAuth({ rowKey: v.name });
            }}
          />
        </div>
        {currentGroupNames.length > 0 && (
          <>
            <div className="grid grid-cols-6 gap-2">
              <div className="col-span-2 font-bold">Name</div>
              <div className="col-span-2">Authority Level</div>
            </div>
            <div className="grid grid-cols-6 gap-2 items-center">
              {currentGroupNames.map((groupName, i) => (
                <AuthRow
                  removeUserAuth={removeGroupAuth}
                  setUserAuth={setGroupAuth}
                  key={groupName}
                  user={
                    componentGroups?.find((group) => group.name === groupName) ?? {name: groupName}
                  }
                  authLevel={sourceAuth.groups[groupName]}
                  loggedInUser={loggedInUser}
                />
              ))}
            </div>
          </>
        )}
      </AdminPageTile>
      <AdminPageTile title="Events" tileWidth="w-full">
        <TaskList sourceId={source.source_id} />
      </AdminPageTile>
    </div>
  );
};

const AuthRow = (props) => {
  const {
    user,
    loggedInUser,
    removeUserAuth,
    setUserAuth,
    authLevel: initialAuthLevel,
  } = props;

  const [authLevel, setAuthLevel] = useState(initialAuthLevel);
  const displayName =
    user.name ?? user?.preferences?.display_name ?? user.email;
  console.log({user})
  //users have ids
  //groups have names
  const rowKey = user.id ? "id" : "name";

  return (
    <>
      <div className="col-span-2">{displayName}</div>
      <div className="col-span-2 grid">
        <Input
          type="number"
          min="1"
          max={loggedInUser.authLevel}
          required
          value={authLevel}
          onChange={(v) => setAuthLevel(v)}
        />
      </div>
      <div className="col-span-1 grid">
        <Button
          themeOptions={{ size: "sm" }}
          type="submit"
          disabled={initialAuthLevel === authLevel}
          onClick={async () => {
            setUserAuth({ rowKey: user[rowKey], authLevel });
          }}
        >
          confirm
        </Button>
      </div>
      <div className="col-span-1 grid">
        <Button
          themeOptions={{ size: "sm", color: "cancel" }}
          type="submit"
          onClick={async () => {
            removeUserAuth({ rowKey: user[rowKey] });
          }}
        >
          remove
        </Button>
      </div>
    </>
  );
};

const AdminPageTile = ({ children, title = "", tileWidth = "sm:max-w-md" }) => {
  const myTheme = useContext(ThemeContext);

  return (
    <div className={`mt-8 ${tileWidth}`}>
      <div
        className={`${
          myTheme.tile ?? "bg-white py-8 px-4 shadow-lg sm:rounded-md sm:px-10"
        } h-full min-height-[400px]`}
      >
        <div className="sm:w-full border-gray-200">
          <h2 className="text-xl font-medium text-gray-900 mb-2">{title}</h2>
          {children}
        </div>
      </div>
    </div>
  );
};

export default ReduxedAdminPage;
