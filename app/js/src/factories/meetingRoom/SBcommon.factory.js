(() => {
  angular.module("app").factory("SBcommon", SBcommon);

  function SBcommon($http, $location, localStorageService, Notification) {
    const credentials = {
        appId: "C83D94E0-F82E-4F22-A7AD-F9922569AAB4",
        url: "https://api.sendbird.com"
      },
      /* SendBird instance */
      sb = new SendBird({
        appId: credentials.appId
      });

    const methods = {
      getInstance: () => {
        return sb;
      },
      connect: (id, token) => {
        return new Promise((resolve, reject) => {
          // Disconnect before connecting to avoid cached data behaviour
          sb.disconnect(() => {
            sb.connect(
              id,
              token,
              (user, err) => {
                if (err) {
                  reject(err);
                } else {
                  resolve(user);
                }
              }
            );
          });
        });
      },
      disconnect: () => {
        return new Promise((resolve, reject) => {
          sb.disconnect(() => {
            resolve("Disconnected successfully");
          });
        });
      },
      store: () => {
        let data = {
          user: null,
          currentMeeting: null
        };
        return {
          get: (prop = null) => {
            return prop ? data[prop] : data;
          },
          set: (prop, val) => {
            data[prop] = val;
          },
          reset: () => {
            data = Object.keys(data).reduce((acc, x) => {
              acc[x] = null;
              return acc;
            }, {});
          }
        };
      },
      error: e => {
        Notification.error("Something went wrong");
        console.log(e);
      }
    };
    return methods;
  }
})();
