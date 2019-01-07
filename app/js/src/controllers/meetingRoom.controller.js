(() => {
  angular.module("app").controller("meetingRoomCtrl", meetingRoomCtrl);

  function meetingRoomCtrl(
    $scope,
    $timeout,
    authFactory,
    $state,
    apiFactory,
    Notification,
    globals,
    Upload,
    SBcommon,
    SBchannel,
    SBevents
  ) {
    /* Requiring vars */

    let vm = this;
    const { logout, userStore, companyStore, projectStore } = globals;
    if (!authFactory.checkUser()) {
      logout();
      return;
    }

    vm.userData = userStore.get();
    let room = SBcommon;
    let store = room.store();
    console.log(vm.userData);
    apiFactory
      .getAccessMeetingRoomToken()
      /* Step 1 - Obtain access token */
      .then(resp => {
        return resp.data.accessToken;
      })
      /* Step 2 - Login user */
      .then(token => {
        if (!token) throw new Error("Token unavailable");

        return room.connect(
          userStore.get()._id,
          token
        );
      })
      /* Step 3 - Get channel list after successfull connection */
      .then(connectedUser => {
        Notification.success("Connected to meeting room");
        store.set("user", connectedUser);
        return SBchannel.listChannels(projectStore.get()._id);
      })
      /* Step 4 - Bind initial view vars here */
      .then(updateChannelList)
      /* Step 5 - Load default channel */
      .then(loadDefaultChannel)
      /* Step 6 - Update Channel contents */
      .then(updateMessages)
      /* Step 7 - Get meeting rodo */
      .then(getMeetingTodo(true))
      .catch(room.error);

    apiFactory
      .getAllMembersInCurrentCompany(userStore.get().companyId)
      .then(resp => {
        vm.companyUsers = resp.data.data;
      })
      .catch(room.error);

    /* View functions & objects */
    vm.newMeeting = {};

    vm.createChannel = (formData, meetingName) => {
      $("#newmeeting_popup").modal("hide");
      if (!store.get("user")) {
        return;
      }

      SBchannel.createChannel(
        meetingName,
        userStore.get()._id,
        projectStore.get()._id
      )
        .then(channel => {
          formData.channelUrl = channel.url;
          return Promise.all([
            channel,
            formData.assignedTo,
            apiFactory.createTodoList(formData),
            apiFactory.inviteUsersToMeeting({ users: formData.assignedTo })
          ]);
        })
        .then(([channel, users]) => {
          return SBchannel.inviteUsers(channel, users);
        })
        .then(_ => {
          Notification.success("Meeting room created successfully!");
          return SBchannel.listChannels(projectStore.get()._id);
        })
        .then(updateChannelList)
        .catch(room.error);
    };

    vm.viewChannel = (channel, $event) => {
      channel.markAsRead();
      SBchannel.getChannelMessages(channel)
        .then(updateMessages)
        .then(getMeetingTodo($event))
        .catch(room.error);
    };

    vm.startTyping = channel => {
      channel.startTyping();
    };

    vm.sendMessage = (channel, message) => {
      vm.messageBox = "";
      channel.endTyping();
      if (message && message.trim()) {
        SBchannel.sendMessage(channel, message)
          .then(channel => {
            return SBchannel.getChannelMessages(channel);
          })
          .then(updateMessages)
          .catch(room.error);
      }
    };

    vm.sendMessageOnEnter = e => {
      if (e.which === 13) {
        vm.sendMessage.call(null, vm.currentChannel, vm.messageBox);
      }
    };

    vm.sendFileMessage = (channel, files) => {
      $("#attach_popup").modal("hide");
      apiFactory
        .newMeetingFileMessage({
          files
        })
        .then(resp =>
          Promise.all(SBchannel.sendFileMessage(channel, resp.data.data))
        )
        .then(_ => {
          Notification.success("Files uploaded successfully");
          return SBchannel.getChannelMessages(channel);
        })
        .then(updateMessages)
        .catch(room.error);
    };

    vm.resolveTemplateUrl = m => {
      if (m.messageType === "user") {
        if (m._sender.userId === userStore.get()._id) {
          return "userMessage";
        } else {
          return "message";
        }
      } else {
        if (m._sender.userId === userStore.get()._id) {
          return "userFileMessage";
        } else {
          return "fileMessage";
        }
      }
    };

    vm.openInvitePopup = (currentChannel, companyUsers) => {
      $("#members_popup").modal("show");
      if (!currentChannel || !companyUsers) {
        return;
      }
      let currentChannelMembers = Object.keys(currentChannel.memberMap);
      // Filter channel users
      vm.invitees = companyUsers
        .filter(x => {
          return currentChannelMembers.indexOf(x._id) > -1 ? false : true;
        })
        .map(x => {
          x.checked = false;
          return x;
        });
    };

    vm.inviteUsers = (channel, users) => {
      $("#members_popup").modal("hide");
      users = users.filter(x => x.checked).map(x => x._id);
      apiFactory
        .inviteUsersToMeeting({ users })
        .then(_ => {
          return SBchannel.inviteUsers(channel, users);
        })
        .then(_ => {
          Notification.success("User(s) invited");
          return SBchannel.listChannels(projectStore.get()._id);
        })
        .then(updateChannelList)
        .catch(room.error);
    };

    vm.openFileViewer = channel => {
      $("#sharedfiles_popup").modal("show");
      SBchannel.getChannelFiles(channel)
        .then(listFiles)
        .catch(room.error);
    };

    vm.checkReadStatus = channel => {
      return channel
        .getReadMembers(channel.lastMessage, true)
        .reduce((acc, x) => {
          acc = x.userId === userStore.get()._id || acc;
          return acc;
        }, false);
    };

    vm.launchTodoPopup = () => {
      $("#todo_meeting").modal("show");
    };

    vm.createTodoList = (formData, currentChannel, valid) => {
      if (valid) {
        $("#todo_meeting").modal("hide");
        formData.channelUrl = currentChannel.url;
        apiFactory
          .createTodoList(formData)
          .then(resp => {
            Notification.success("Todo created successfully");
            return currentChannel;
          })
          .then(getMeetingTodo(true))
          .catch(room.error);
      } else {
        Notification.error("Please fill all the details");
      }
    };

    /* Listeners */
    SBevents.init(); // Initialize events

    /* New message handler */
    $scope.$on("newMeeingRoomMessage", (e, data) => {
      if (vm.currentChannel.url === data.channel.url) {
        vm.viewChannel(data.channel);
      } else {
        SBchannel.listChannels(projectStore.get()._id)
          .then(updateChannelList)
          .catch(room.error);
      }
    });

    $scope.$on("newChannelJoined", (e, data) => {
      SBchannel.listChannels(projectStore.get()._id)
        .then(updateChannelList)
        .catch(room.error);
    });

    $scope.$on("typingStatus", (e, data) => {
      $timeout(() => {
        $scope.$apply();
      });
    });

    /* Composable functions */
    function updateChannelList(list) {
      vm.channelList = list;
      $timeout(() => {
        $scope.$apply();
      });
      return list;
    }

    function loadDefaultChannel(channels) {
      if (channels.length > 0) {
        return SBchannel.getChannelMessages(channels[0]);
      }
    }

    function updateMessages(channel) {
      vm.currentChannel = channel;
      $timeout(() => {
        $scope.$apply();
        let chatContainer = document.getElementsByClassName(
          "chat-container"
        )[0];
        chatContainer.scrollTop = chatContainer.scrollHeight;
      });
      return channel;
    }

    function listFiles(channel) {
      vm.sharedFiles = channel.files.reduce(
        (acc, x) => {
          if (/png|jpg|jpeg|gif/.test(x.type)) {
            acc.images.push(x);
          } else {
            acc.docs.push(x);
          }
          return acc;
        },
        {
          images: [],
          docs: []
        }
      );
      $timeout(() => {
        $scope.$apply();
      });
    }

    function getMeetingTodo($event) {
      if ($event) {
        return function(channel) {
          apiFactory
            .getMeetingTodo({ channelUrl: channel.url })
            .then(resp => {
              vm.todoList = resp.data.todoList;
            })
            .catch(room.error);
        };
      }
    }

    vm.logout = () => {
      logout();
    };

    const twilio = Twilio;
    console.log(twilio, "===twilio");
    const Video = Twilio.Video;
    /* let AccessToken = twilio.jwt.AccessToken;
    let VideoGrant = AccessToken.VideoGrant; */
    let previewTracks, activeRoom, identity;

    // Attach the Tracks to the DOM.
    function attachTracks(tracks, container) {
      tracks.forEach(function(track) {
        container.appendChild(track.attach());
      });
    }

    // Attach the Participant's Tracks to the DOM.
    function attachParticipantTracks(participant, container) {
      var tracks = Array.from(participant.tracks.values());
      attachTracks(tracks, container);
    }

    // Detach the Tracks from the DOM.
    function detachTracks(tracks) {
      tracks.forEach(function(track) {
        console.log(track);
        track.detach().forEach(function(detachedElement) {
          detachedElement.remove();
        });
      });
    }

    // Detach the Participant's Tracks from the DOM.
    function detachParticipantTracks(participant) {
      console.log(participant);
      var tracks = Array.from(participant.tracks.values());
      console.log(tracks);
      detachTracks(tracks);
    }

    // When we are about to transition away from this page, disconnect
    // from the room, if joined.
    window.addEventListener("beforeunload", vm.leaveRoomIfJoined);

    // Activity log.
    function log(message) {
      var logDiv = document.getElementById("log");
      /* logDiv.innerHTML += "<p>&gt;&nbsp;" + message + "</p>";
      logDiv.scrollTop = logDiv.scrollHeight; */
    }

    // Successfully connected!
    function roomJoined(room) {
      window.room = activeRoom = room;

      log("Joined as '" + identity + "'");
      document.getElementById("button-join").style.display = "none";
      document.getElementById("button-leave").style.display = "inline";

      // Attach LocalParticipant's Tracks, if not already attached.
      var previewContainer = document.getElementById("local-media");
      if (!previewContainer.querySelector("video")) {
        attachParticipantTracks(room.localParticipant, previewContainer);
      }

      // Attach the Tracks of the Room's Participants.
      room.participants.forEach(function(participant) {
        log("Already in Room: '" + participant.identity + "'");
        var previewContainer = document.getElementById("remote-media");
        attachParticipantTracks(participant, previewContainer);
      });

      // When a Participant joins the Room, log the event.
      room.on("participantConnected", function(participant) {
        log("Joining: '" + participant.identity + "'");
      });

      // When a Participant adds a Track, attach it to the DOM.
      room.on("trackAdded", function(track, participant) {
        log(participant.identity + " added track: " + track.kind);
        var previewContainer = document.getElementById("remote-media");
        attachTracks([track], previewContainer);
      });

      // When a Participant removes a Track, detach it from the DOM.
      room.on("trackRemoved", function(track, participant) {
        log(participant.identity + " removed track: " + track.kind);
        detachTracks([track]);
      });

      // When a Participant leaves the Room, detach its Tracks.
      room.on("participantDisconnected", function(participant) {
        log("Participant '" + participant.identity + "' left the room");
        detachParticipantTracks(participant);
      });

      // Once the LocalParticipant leaves the room, detach the Tracks
      // of all Participants, including that of the LocalParticipant.
      room.on("disconnected", function() {
        log("Left");
        if (previewTracks) {
          previewTracks.forEach(function(track) {
            track.stop();
          });
          previewTracks = null;
        }
        detachParticipantTracks(room.localParticipant);
        room.participants.forEach(detachParticipantTracks);
        activeRoom = null;
        document.getElementById("button-join").style.display = "inline";
        document.getElementById("button-leave").style.display = "none";
      });
    }

    // Leave Room.
    vm.leaveRoomIfJoined = () => {
      $("#video_preview").modal("hide");
      console.log(activeRoom);
      if (previewTracks) {
        previewTracks.forEach(function(track) {
          track.stop();
        });
        previewTracks = null;
      }
      detachParticipantTracks(activeRoom.localParticipant);
      console.log(activeRoom.participants);
      activeRoom.participants.forEach(detachParticipantTracks);
      activeRoom = null;
    };

    vm.startVideoChat = () => {
      var localTracksPromise = previewTracks
        ? Promise.resolve(previewTracks)
        : Video.createLocalTracks();

      localTracksPromise
        .then(
          function(tracks) {
            window.previewTracks = previewTracks = tracks;
            $("#video_preview").modal("show");
            var previewContainer = document.getElementById("local-media");
            if (!previewContainer.querySelector("video")) {
              attachTracks(tracks, previewContainer);
            }
          },
          function(error) {
            console.error("Unable to access local media", error);
            Notification.error("Unable to access Camera and Microphone");
          }
        )
        .then(res => {
          return new Promise((resolve, reject) => {
            apiFactory
              .getTwilioAccessToken()
              .then(resp => {
                resolve(resp.data);
              })
              .catch(e => {
                reject(e);
              });
          });
        })
        .then(data => {
          console.log(data);
          identity = data;
          var connectOptions = {
            name: "roomName",
            logLevel: "debug"
          };

          if (previewTracks) {
            connectOptions.tracks = previewTracks;
          }

          // Join the Room with the token from the server and the
          // LocalParticipant's Tracks.
          Video.connect(
            data.token,
            connectOptions
          ).then(roomJoined, function(error) {
            console.log(error);
            Notification.error("Could not connect to Twilio: " + error.message);
          });
        });
    };
  }
})();
