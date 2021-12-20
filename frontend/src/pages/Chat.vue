<template>
  <q-page style="overflow-y: hidden">
    <div class="q-pa-md">
      <!-- main chat page -->
      <q-layout
        view="lHh Lpr lFf"
        container
        :style="
          $q.platform.is.mobile
            ? 'height: 85vh; margin-top: 3.5vh'
            : 'height: 86.5vh'
        "
        class="shadow-3 rounded-borders container"
      >
        <div
          ref="pageChat"
          id="pageChat"
          class="q-px-lg q-py-md"
          style="overflow-y: hidden; display: flex; flex-direction: column"
        >
          <q-header elevated style="overflow: hidden">
            <!-- #9CC937-->
            <q-toolbar>
              <q-btn
                icon="arrow_back"
                flat
                dense
                :label="
                  $q.platform.is.mobile
                    ? ''
                    : this.chatMode == 'randomMatch'
                    ? 'Exit'
                    : 'Back'
                "
                style="float: left"
                @click="closeChat"
              />

              <!-- for regular chat -->
              <q-toolbar-title
                style="text-align: center"
                :style="$q.platform.is.mobile ? 'font-size: 5vw' : ''"
              >
                {{ this.chatInfo.chatName }}
              </q-toolbar-title>

              <q-btn-dropdown
                flat
                round
                dense
                icon="add"
                @click="showOnlineFriends"
                label="Member"
              >
                <q-list bordered separator>
                  <q-item
                    v-for="friend in this.onlineFriends"
                    :key="friend"
                    clickable
                    @click="sendInvite(friend)"
                  >
                    <q-item-section avatar>
                      <q-avatar color="primary" text-color="white">
                        {{
                          friend.firstName.charAt(0).toUpperCase() +
                          friend.lastName.charAt(0).toUpperCase()
                        }}
                      </q-avatar>
                    </q-item-section>

                    <q-item-section avatar>
                      <q-btn
                        round
                        dense
                        unelevated
                        style="font-size: 6px !important; margin-left: 5px"
                        color="light-green-5"
                      />
                    </q-item-section>

                    <q-item-section>
                      <q-item-label>{{
                        friend.firstName + " " + friend.lastName
                      }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-btn-dropdown>
            </q-toolbar>
          </q-header>
        </div>
        <div
          class="q-pa-md column col justify-end"
          style="margin-bottom: 30px; margin-top: 30px"
        >
          <div v-if="this.loadingMessages" style="margin-top: 300px">
            <span class="absolute-center" style="text-align: center">
              <q-spinner color="primary" size="3em" :thickness="2" />
              <p style="font-size: 20px; color: grey">
                Loading your messages...
              </p>
            </span>
          </div>

          <div v-else>
            <q-chat-message
              class="chatSize"
              style="font-size: 16px; color: black"
              v-for="message in messages"
              :text="[message.message]"
              :name="'user' in message ? 'amy gutmann' : message.sender"
              :key="message"
              :sent="message.sender == this.userInfo.username ? true : false"
              :bg-color="'user' in message ? 'grey-4' : 'light-green-3'"
            >
            </q-chat-message>
          </div>

          <q-card id="anchor" style="height: 0px"></q-card>

          <q-footer elevated style="padding: 10px">
            <!-- #9cc937 -->
            <!--</q-toolbar>-->

            <q-form @keyup:enter="sendMessage" class="full-width">
              <q-input
                v-model="newMessage"
                ref="newMessage"
                bg-color="white"
                outlined
                rounded
                label="Message"
                dense
              >
                <template v-slot:after>
                  <q-btn
                    v-show="newMessage"
                    @click="sendMessage"
                    round
                    dense
                    flat
                    type="submit"
                    color="white"
                    icon="send"
                  />
                </template>
              </q-input>
            </q-form>
          </q-footer>
        </div>
      </q-layout>
    </div>
  </q-page>
</template>

<script>
import { mapState, mapActions, mapGetters } from "vuex";
import { socket } from "../router/index";
import axios from "axios";

export default {
  data() {
    return {
      drawerWidth: 600,
      bannerWidth: "65%",
      footerWidth: "64.3%",
      right: false,
      icon: "chevron_right",
      newMessage: "",
      buttonShow: false,
      chatInfo: {},
      userOrder: "",
      popupMode: "",
      users: [],
      userInfo: {},
      messages: [],
      loadingMessages: false,
      onlineFriends: [],
    };
  },

  props: {
    otherId: String,
  },

  components: {},

  computed: {},

  methods: {
    sendMessage() {
      if (this.newMessage.replace(/\s/g, "") != "") {
        //TODO: post message to route

        let messageContent = this.newMessage;
        console.log(messageContent);

        socket.emit("message", {
          username: this.userInfo.username,
          message: this.newMessage,
          uuid: this.chatInfo.chatUUID,
        });

        let messageObj = {
          timestamp: new Date().toISOString(),
          sender: this.userInfo.username,
          message: messageContent,
        };
        this.messages.push(messageObj);

        this.clearMessage();

        let date = Date.parse(new Date()).toString();
      }
    },

    clearMessage() {
      this.newMessage = "";
      this.$refs.newMessage.focus();
    },

    scrollToEnd() {
      document.getElementById("anchor").scrollIntoView();
    },

    closeChat() {
      console.log("eh??");
      socket.emit("leave", {
        username: this.userInfo.username,
        uuid: this.chatInfo.chatUUID,
      });
      this.$router.push("/chats");
    },

    messageDate(timestamp) {
      //console.log(timestamp);
      let dateObj = new Date(Number(timestamp));
      return dateObj
        .toLocaleDateString()
        .substring(0, dateObj.toLocaleDateString().length - 5);
    },

    sendInvite(friend) {
      //invite user with username to same chatUUID – should open up new chatUUID?
      if (
        this.users.filter((user) => user.username == friend.username).length > 0
      ) {
        alert("Friend is already in the chat!");
        return;
      }

      const userInfo = JSON.parse(localStorage.getItem("userInfo"));

      // create new chat
      let chatName = this.chatInfo.chatName.split(", ");
      chatName.push(friend.firstName + " " + friend.lastName);
      chatName.sort();
      let chatNameString = chatName.join(", ");

      let chatUsernames = this.users;
      chatUsernames.push({
        username: friend.username,
        firstName: friend.firstName,
        lastName: friend.lastName,
      });

      axios
        .post(
          "/api/chats/",
          {
            creator: userInfo.username,
            name: chatNameString,
            members: chatUsernames,
          },
          {
            headers: { Authorization: `Bearer ${localStorage.jwt}` },
          }
        )
        .then((resp) => {
          if (resp.status == 200) {
            if (resp.data.length > 0) {
              this.$router.push("/chat/" + resp.data[0].chatUUID);
            } else {
              alert("Error creating chat!");
            }
          }
        })
        .catch((err) => {
          if (err.response) {
            if (err.response.status == 401) {
              localStorage.clear();
              this.$router.push("/login");
            } else {
              alert(err.response.data.message);
            }
          }
        });
    },
    getOnlineFriends() {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      axios
        .get("/api/users/" + userInfo.username + "/friends/", {
          headers: { Authorization: `Bearer ${localStorage.jwt}` },
        })
        .then((resp) => {
          if (resp.status == 200) {
            // ok
            resp.data.map((friendInfo) => {
              if (friendInfo.confirmed) {
                // TODO: check if friend is online
                // friend
                this.onlineFriends.push(friendInfo);
              }
            });
          }
        })
        .catch((err) => {
          if (err.response) {
            if (err.response.status == 401) {
              localStorage.clear();
              this.$router.push("/login");
            } else {
              alert(err.response.data.message);
            }
          }
        });
    },
    getMembers() {
      axios
        .get(
          "/api/chats/members/" + this.chatInfo.chatUUID + "/",

          {
            headers: { Authorization: `Bearer ${localStorage.jwt}` },
          }
        )
        .then((resp) => {
          if (resp.status == 200) {
            if (resp.data.length > 0) {
              resp.data.map((data) => {
                this.users.push({
                  username: data.username,
                  firstName: data.firstName,
                  lastName: data.lastName,
                });
              });
              this.chatInfo = resp.data[0];
            } else {
              alert("No members found in chat!");
            }
          }
        })
        .catch((err) => {
          if (err.response) {
            if (err.response.status == 401) {
              localStorage.clear();
              this.$router.push("/login");
            } else {
              if (err.response.status == 401) {
                localStorage.clear();
                this.$router.push("/login");
              } else {
                alert(err.response.data.message);
              }
            }
          }
        });
    },
    loadMessages() {
      //load chats initially
      (this.messages = []), (this.loadingMessages = true);
      axios
        .get(
          "/api/chats/" + this.chatInfo.chatUUID + "/",

          {
            headers: { Authorization: `Bearer ${localStorage.jwt}` },
          }
        )
        .then((resp) => {
          if (resp.status == 200) {
            console.log("fetched chat history:");
            let fetchedMessages = resp.data;
            fetchedMessages.reverse();

            this.messages = fetchedMessages;
            this.loadingMessages = false;
          }
        })
        .catch((err) => {
          if (err.response) {
            if (err.response.status == 401) {
              localStorage.clear();
              this.$router.push("/login");
            } else {
              alert(err.response.data.message);
            }
          }
          this.loadingMessages = false;
        });

      // captures server msgs (possibly from other ppl)
      socket.on("message", (data) => {
        console.log("received message");
        console.log(data);

        this.messages.push(data);
      });
    },
  },

  mounted() {
    // emit event to server with the user's name
    socket.emit("join", {
      username: this.userInfo.username,
      uuid: this.chatInfo.chatUUID,
    });

    this.getMembers();

    this.loadMessages();

    // get onlineFriends
    this.getOnlineFriends();
  },

  created() {
    let currentPath = this.$route.fullPath;
    let subdomains = currentPath.split("/");
    this.chatInfo.chatUUID = subdomains[subdomains.length - 1];
    // this.chatInfo = this.$route.params;

    this.userInfo = JSON.parse(localStorage.getItem("userInfo"));
  },

  beforeDestroy() {
    // chatbox is closing because of moving to different tab
    if (this.chatTab == "chat") {
      this.setChatTab("");
    }
  },
  unmounted() {
    socket.emit("leave", {
      username: this.userInfo.username,
      uuid: this.chatInfo.chatUUID,
    });
  },
};
</script>

<style>
@media (min-width: 0px) and (max-width: 1026px) {
  .chatSize {
    font-size: 14px !important;
  }

  .container {
    height: 86vh !important;
    width: 105% !important;
    margin-left: -8px !important;
  }

  .cardChat {
    margin-top: 50px !important;
  }
}
</style>
