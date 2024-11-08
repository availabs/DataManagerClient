import { useContext, useState, useEffect, useMemo } from "react";
import { ThemeContext, Input, Button } from "~/modules/avl-components/src";
import Select from "~/modules/avl-components/src/components/Inputs/select";
import { DamaContext } from "~/pages/DataManager/store";
import { wrappers } from "~/modules/ams/src";
const amsReduxWrapper = wrappers["ams-redux"];

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
  const myTheme = useContext(ThemeContext);
  const { falcor, pgEnv } = useContext(DamaContext);

  const { auth } = source?.statistics ?? {};
  const currentSourceUserIds = auth?.users ? Object.keys(auth?.users) : [];

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
    return async ({ userId }) => {
      const newAuth = { auth: { ...auth } };
      newAuth.auth["users"][userId] = -1;
      console.log("newAuth, addUserAuth::", newAuth);
      await updateAuth(newAuth);
    };
  }, [auth, updateAuth]);

  const removeUserAuth = useMemo(() => {
    return async ({ userId }) => {
      const newAuth = { auth: { ...auth } };
      delete newAuth.auth["users"][userId];
      console.log("newAuth, removeUserAuth::", newAuth);
      await updateAuth(newAuth);
    };
  }, [auth, updateAuth]);

  const setUserAuth = useMemo(() => {
    return async ({ userId, authLevel }) => {
      const newAuth = { auth: { ...auth } };
      newAuth.auth["users"][userId] = authLevel;
      console.log("newAuth,setUserAuth::", newAuth);
      await updateAuth(newAuth);
    };
  }, [auth, updateAuth]);

  const otherUsers = users.filter(
    (allUser) => !currentSourceUserIds.includes(JSON.stringify(allUser.id))
  );

  return (
    <div
      className={`${
        myTheme.background ?? "bg-grey-100"
      } h-full flex flex-wrap py-12 sm:px-6 lg:px-8 gap-3`}
    >
      <div className="w-full">
        <h2 className="text-xl font-medium text-gray-900">Admin</h2>
      </div>
      <AdminPageTile title="User Access Controls" tileWidth="sm:max-w-lg">
        <div className="mb-4">
          <Select
            searchable={true}
            domain={otherUsers}
            accessor={(g) => g.id}
            listAccessor={(g) => g.email}
            displayAccessor={(g) => g?.preferences?.display_name ?? g.email}
            placeholder="Add user access..."
            onChange={async (v) => {
              const newAuth = { auth: { ...auth } };
              newAuth.auth["users"][v.id] = -1;
              addUserAuth({ userId: v.id });
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
                <UserRow
                  removeUserAuth={removeUserAuth}
                  setUserAuth={setUserAuth}
                  key={sourceUserId}
                  user={
                    users?.find((user) => user.id === parseInt(sourceUserId)) ??
                    {}
                  }
                  authLevel={auth.users[sourceUserId]}
                  loggedInUser={loggedInUser}
                />
              ))}
            </div>
          </>
        )}
      </AdminPageTile>
      <AdminPageTile title="Group Access Controls" tileWidth="sm:max-w-lg">
        Groups...
      </AdminPageTile>
    </div>
  );
};
//TODO -- when makiung group component, can prob reuse a lot of it, just need to make some things a little more agnostic
const UserRow = (props) => {
  const {
    user,
    loggedInUser,
    removeUserAuth,
    setUserAuth,
    authLevel: initialAuthLevel,
  } = props;

  const [authLevel, setAuthLevel] = useState(initialAuthLevel);

  //Get user metadata from list of users (name/display_name)
  //get auth level for user from list of users -- statistics.auth["users"][userId]
  const displayName = user?.preferences?.display_name ?? user.email;
  return (
    <>
      <div className="col-span-2">{displayName}</div>
      <div className="col-span-2 grid">
        <Input
          type="number"
          min="-1" //-1 means no access
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
            setUserAuth({ userId: user.id, authLevel });
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
            removeUserAuth({ userId: user.id });
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
    <div className={`mt-8 sm:w-full ${tileWidth}`}>
      <div
        className={`${
          myTheme.tile ?? "bg-white py-8 px-4 shadow-lg sm:rounded-md sm:px-10"
        }  min-height-[400px]`}
      >
        <div className="sm:w-full sm:max-w-md  border-gray-200">
          <h2 className="text-xl font-medium text-gray-900 mb-2">{title}</h2>
          {children}
        </div>
      </div>
    </div>
  );
};

export default ReduxedAdminPage;
