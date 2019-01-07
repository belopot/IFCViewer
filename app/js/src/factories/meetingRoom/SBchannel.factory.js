(() => {
  angular.module("app").factory("SBchannel", SBchannel);

  function SBchannel(
    $http,
    $location,
    localStorageService,
    apiFactory,
    SBcommon,
    Notification
  ) {
    let sb = SBcommon.getInstance();
    const methods = {
      createChannel: (channelName, user, project) => {
        return new Promise((resolve, reject) => {
          let params = new sb.GroupChannelParams();
          params.isPublic = false;
          params.isEphemeral = false;
          params.isDistinct = false;
          params.addUserIds(user);
          params.operators = user;
          params.name = channelName;
          params.customType = project;
          //TODO: Add these data later
          // params.coverImage = FILE;
          // params.coverUrl = COVER_URL;
          // params.data = DATA;
          sb.GroupChannel.createChannel(params, (groupChannel, error) => {
            if (error) {
              reject(err);
              return;
            } else {
              resolve(groupChannel);
            }
          });
        });
      },
      listChannels: projectId => {
        return new Promise((resolve, reject) => {
          let channelListQuery = sb.GroupChannel.createMyGroupChannelListQuery();
          channelListQuery.includeEmpty = true;
          channelListQuery.customTypesFilter = [projectId];
          if (channelListQuery.hasNext) {
            channelListQuery.next((channelList, error) => {
              if (error) {
                reject(err);
                return;
              } else {
                resolve(channelList);
              }
            });
          }
        });
      },
      inviteUsers: (channel, users) => {
        return new Promise((resolve, reject) => {
          channel.inviteWithUserIds(users, (resp, error) => {
            if (error) {
              reject(error);
              return;
            } else {
              resolve(resp);
            }
          });
        });
      },
      getChannelMessages: channel => {
        return new Promise((resolve, reject) => {
          let prevMessageListQuery = channel.createPreviousMessageListQuery();
          prevMessageListQuery.limit = 30;
          prevMessageListQuery.reverse = false;
          prevMessageListQuery.load((messages, error) => {
            if (error) {
              reject(err);
              return;
            } else {
              channel.messages = messages;
              resolve(channel);
            }
          });
        });
      },

      getChannelFiles: channel => {
        return new Promise((resolve, reject) => {
          let prevMessageListQuery = channel.createPreviousMessageListQuery();
          prevMessageListQuery.limit = 30;
          prevMessageListQuery.reverse = true;
          prevMessageListQuery.messageTypeFilter = 2;
          prevMessageListQuery.load((files, error) => {
            if (error) {
              reject(err);
              return;
            } else {
              channel.files = files;
              resolve(channel);
            }
          });
        });
      },

      sendMessage: (channel, message) => {
        return new Promise((resolve, reject) => {
          channel.sendUserMessage(
            message,
            "meetingRoomMessage",
            (message, error) => {
              if (error) {
                reject(error);
                return;
              } else {
                resolve(channel);
              }
            }
          );
        });
      },

      sendFileMessage: (channel, files) => {
        let promiseArray = [];
        for (let file of files) {
          let promise = new Promise((resolve, reject) => {
            channel.sendFileMessage(
              file.secure_url,
              file.assetName,
              file.format,
              file.bytes,
              "",
              "",
              (fileMessage, error) => {
                if (error) {
                  reject(error);
                }
                resolve(fileMessage);
              }
            );
          });
          promiseArray.push(promise);
        }
        return promiseArray;
      }
    };
    return methods;
  }
})();
