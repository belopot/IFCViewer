(() => {
  angular.module("app").factory("SBevents", SBevents);

  function SBevents(
    $http,
    $location,
    $rootScope,
    localStorageService,
    SBcommon,
    Notification
  ) {
    let sb = SBcommon.getInstance();
    const methods = {
      init: () => {
        /* New message */
        let newMessageHandler = new sb.ChannelHandler();

        newMessageHandler.onMessageReceived = (channel, message) => {
          $rootScope.$broadcast("newMeeingRoomMessage", {
            channel,
            message
          });
        };

        sb.addChannelHandler("messageReceived", newMessageHandler);

        /* New channel */
        let newUserJoined = new sb.ChannelHandler();
        newUserJoined.onUserJoined = (channel, user) => {
          $rootScope.$broadcast("newChannelJoined", {
            channel,
            user
          });
        };

        sb.addChannelHandler("newChannelJoined", newUserJoined);

        let typingStatusHandler = new sb.ChannelHandler();
        typingStatusHandler.onTypingStatusUpdated = channel => {
          $rootScope.$broadcast("typingStatus", {
            channel
          });
        };

        sb.addChannelHandler("typingStatus", typingStatusHandler);
      }
    };
    return methods;
  }
})();
