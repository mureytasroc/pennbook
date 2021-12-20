<!-- list view of friends – indicate online or not with green dot – also have chat invite button? 2 tab, with one tab being visualizer-->

<template>
  <q-page style="overflow-y: hidden">
    <!-- chat page -->

    <div
      class="q-pa-md"
      style="
        width: 100%;
        justify-content: center;
        margin: auto;
        margin-top: 30px;
        overflow-x: hidden;
      "
    >
      <div
        vertical
        style="
          width: 100%;
          margin-bottom: 10px;
          margin-top: -10px;
          height: 40px;
        "
      >
        <q-tabs
          v-model="tab"
          dense
          class="text-white"
          active-color="black"
          indicator-color="black"
          align="center"
          narrow-indicator
        >
          <q-tabs
            v-model="tab"
            dense
            class="text-white"
            active-color="black"
            indicator-color="black"
            align="center"
            narrow-indicator
          >
            <q-tab style="color: #011f5b" label="People" name="people" />

            <q-tab style="color: #011f5b" label="Friends" name="friends" />

            <q-tab
              style="color: #011f5b"
              label="Visualizer"
              name="visualizer"
              @click="changeMe"
            />
          </q-tabs>
        </q-tabs>
      </div>

      <!-- profile tab (for regular chat) -->
      <div v-if="this.tab == 'friends'" style="margin-top: 2%">
        <!-- display current friend requests -->
        <q-bar
          dark
          class="bg-secondary text-white"
          style="width: 50%; margin: auto"
        >
          <div class="col text-center text-weight-bold">Friend Requests</div>
        </q-bar>

        <br />

        <q-item
          v-for="friendRequest in this.friendRequests"
          :key="friendRequest"
          clickable
          v-ripple
          style="
            height: 80px;
            margin: auto;
            margin-bottom: 10px;
            width: 600px;
            opacity: 0.8;
            background: #f2f4db;
          "
        >
          <q-btn flat>
            <q-item-section avatar>
              <q-avatar color="primary" text-color="white">
                {{
                  friendRequest.firstName.charAt(0).toUpperCase() +
                  friendRequest.lastName.charAt(0).toUpperCase()
                }}
              </q-avatar>
            </q-item-section>
          </q-btn>

          <q-item-section avatar>
            <q-btn
              v-if="friendRequest.loggedIn"
              round
              dense
              unelevated
              style="font-size: 6px !important; margin-left: 5px"
              color="light-green-5"
            />
          </q-item-section>

          <q-item-section>
            <q-item-label>{{
              friendRequest.firstName + " " + friendRequest.lastName
            }}</q-item-label>
          </q-item-section>

          <q-item-section side>
            <q-btn
              style="margin-right: 20px"
              dense
              flat
              icon="done"
              color="light-green-6"
              @click="acceptFriendRequest(friendRequest.username)"
            />
          </q-item-section>
          <q-btn
            icon="close"
            flat
            dense
            unelevated
            style="font-size: 12px !important; margin-left: 5px"
            color="red"
            @click="rejectFriendRequest(friendRequest.username)"
          />
        </q-item>

        <br />
        <br />

        <!-- display current friend requests -->
        <q-bar
          dark
          class="bg-secondary text-white"
          style="width: 50%; margin: auto"
        >
          <div class="col text-center text-weight-bold">Friends</div>
        </q-bar>

        <br />

        <div v-if="friends.length == 0" style="margin-top:300px">
        <span
          class="absolute-center"
          style="text-align: center"
        >
                <q-spinner
                color="primary"
                size="3em"
                :thickness="2"
            />
          <p
            style="font-size: 20px; color: grey"
          >
            Loading your friends...
          </p>
        </span>
      </div>

        <!-- display current list of friends -->
        <div v-else>
        <q-item
          v-for="friend in this.friends"
          :key="friend"
          clickable
          v-ripple
          style="
            height: 80px;
            margin: auto;
            margin-bottom: 10px;
            width: 600px;
            opacity: 0.8;
            background: whitesmoke;
          "
        >
          <q-btn @click="visitWall(friend.username)" flat>
            <q-item-section avatar>
              <q-avatar color="primary" text-color="white">
                {{
                  friend.firstName.charAt(0).toUpperCase() +
                  friend.lastName.charAt(0).toUpperCase()
                }}
              </q-avatar>
            </q-item-section>
          </q-btn>

          <q-item-section avatar>
            <q-btn
              v-if="friend.loggedIn"
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

          <q-item-section side>
            <q-btn
              style="margin-right: 20px"
              dense
              round
              icon="textsms"
              color="light-green-6"
              @click="createChat(friend)"
            />
          </q-item-section>
          <q-btn
            icon="remove_circle_outline"
            flat
            dense
            unelevated
            style="font-size: 12px !important; margin-left: 5px"
            color="red"
            @click="removeFriend(friend.username)"
          />
        </q-item>
        </div>
      </div>

      <div
        v-else-if="this.tab == 'visualizer'"
        class="inline justify-center shift no-wrap"
        style="display: flex; position: relative"
      >
        <Visualizer />
      </div>

      <!-- people -->
      <!--TODO: once get profiles showing up, make 'add friend' button-->
      <div
        v-if="this.tab == 'people'"
        class="inline justify-center shift no-wrap"
        style="display: flex; position: relative; margin-top: 2%"
      >
        <!--TODO: make this functional and search for friends / move elsewhere-->
        <q-toolbar
          class="bg-primary text-white rounded-borders"
          style="width: 50%"
        >
          <h7 class="gt-xs"> Find/Add friends! </h7>

          <q-space />

          <q-input
            dark
            dense
            standout
            v-model="searchPeopleQuery"
            input-class="text-right"
            class="q-ml-md"
          >
            <template v-slot:append>
              <q-icon v-if="text === ''" name="search" />
              <q-icon
                v-else
                name="clear"
                class="cursor-pointer"
                @click="text = ''"
              />
            </template>
          </q-input>
        </q-toolbar>

        <q-btn
          v-if="searchPeopleQuery"
          icon="search"
          style="margin-left: 20px"
          color="secondary"
          @click="searchPeople"
        />
      </div>
      <div
        v-if="this.searchedFriends && this.tab == 'people'"
        style="margin-top: 2%"
      >
        <q-item
          v-for="searchedFriend in this.searchedFriends"
          :key="searchedFriend"
          clickable
          v-ripple
          style="
            height: 80px;
            margin: auto;
            margin-bottom: 10px;
            width: 600px;
            opacity: 0.8;
            background: whitesmoke;
          "
        >
          <q-btn flat>
            <q-item-section avatar>
              <q-avatar color="primary" text-color="white">
                {{
                  searchedFriend.firstName.charAt(0).toUpperCase() +
                  searchedFriend.lastName.charAt(0).toUpperCase()
                }}
              </q-avatar>
            </q-item-section>
          </q-btn>

          <q-item-section>
            <q-item-label>{{
              searchedFriend.firstName + " " + searchedFriend.lastName
            }}</q-item-label>
          </q-item-section>

          <q-btn
            v-if="
              !this.friends.some(
                (friend) => friend.username === searchedFriend.username
              )
            "
            icon="add_circle"
            flat
            dense
            unelevated
            style="font-size: 12px !important; margin-left: 5px"
            color="green"
            @click="addFriend(searchedFriend.username)"
          />
          <q-btn
            v-else
            icon="remove_circle_outline"
            flat
            dense
            unelevated
            style="font-size: 12px !important; margin-left: 5px"
            color="red"
            @click="removeFriend(searchedFriend.username)"
          />
        </q-item>
      </div>
    </div>
  </q-page>
</template>

<script>
import { mapState, mapActions, mapGetters } from "vuex";
import axios from "axios";
export default {
  data() {
    return {
      tab: "friends",
      searchPeopleQuery: "",
      friends: [],
      friendRequests: [],
      searchedFriends: [],
    };
  },
  props: {},
  components: {
    Visualizer: require("components/Visualizer.vue").default,
  },

  watch: {},
  mounted() {
    this.getFriends();
  },
  methods: {
    getFriends() {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      axios
        .get("/api/users/" + userInfo.username + "/friends/", {
          headers: { Authorization: `Bearer ${localStorage.jwt}` },
        })
        .then((resp) => {
          if (resp.status == 200) {
            // ok
            console.log(resp.data);
            resp.data.map((friendInfo) => {
              if (!friendInfo.requested && !friendInfo.confirmed) {
                // incoming request
                this.friendRequests.push(friendInfo);
              } else if (friendInfo.confirmed) {
                // friend
                this.friends.push(friendInfo);
              }
            });
          }
        })
        .catch((err) => {
          if (err.response) {
            console.log(err.response);
          }
        });
    },
    removeFriend(friendUsername) {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      axios
        .delete(
          "/api/users/" +
            userInfo.username +
            "/friends/" +
            friendUsername +
            "/",
          {
            headers: { Authorization: `Bearer ${localStorage.jwt}` },
          }
        )
        .then((resp) => {
          if (resp.status == 204) {
            // ok
            this.friends = this.friends.filter(
              (friend) => friend.username != friendUsername
            );
          }
        })
        .catch((err) => {
          if (err.response) {
            console.log(err.response);
          }
        });
    },
    addFriend(friendUsername) {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      axios
        .post(
          "/api/users/" + userInfo.username + "/friends/" + friendUsername,
          {},
          {
            headers: { Authorization: `Bearer ${localStorage.jwt}` },
          }
        )
        .then((resp) => {
          if (resp.status == 201) {
            // ok
            alert("Sent a friend request to " + friendUsername + "!");
          }
        })
        .catch((err) => {
          if (err.response) {
            console.log(err.response);
          }
        });
    },
    acceptFriendRequest(friendUsername) {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      axios
        .post(
          "/api/users/" + userInfo.username + "/friends/" + friendUsername,
          {},
          {
            headers: { Authorization: `Bearer ${localStorage.jwt}` },
          }
        )
        .then((resp) => {
          if (resp.status == 201) {
            // ok
            alert("Accepted " + friendUsername + "'s friend request!");
            // remove from friendRequests
            this.friendRequests = this.friendRequests.filter(
              (friend) => friend.username != friendUsername
            );
            // add to friends
            this.friends.push(resp.data);
          }
        })
        .catch((err) => {
          if (err.response) {
            console.log(err.response);
          }
        });
    },
    rejectFriendRequest(friendUsername) {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));

      axios
        .delete(
          "/api/users/" +
            userInfo.username +
            "/friends/" +
            friendUsername +
            "/",
          {
            headers: { Authorization: `Bearer ${localStorage.jwt}` },
          }
        )
        .then((resp) => {
          if (resp.status == 204) {
            // ok
            this.friendRequests = this.friendRequests.filter(
              (friend) => friend.username != friendUsername
            );
          }
        })
        .catch((err) => {
          if (err.response) {
            console.log(err.response);
          }
        });
    },
    searchPeople() {
      axios
        .get("/api/users/", { params: { q: this.searchPeopleQuery } })
        .then((resp) => {
          if (resp.status == 200) {
            // ok
            this.searchedFriends = resp.data;
          }
        })
        .catch((err) => {
          if (err.response) {
            console.log(err.response);
          }
        });
    },

    createChat(friend) {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      // check if chat already exists (too slow?)

      // create new chat
      let chatName = [
        userInfo.firstName + " " + userInfo.lastName,
        friend.firstName + " " + friend.lastName,
      ];
      chatName.sort();
      let chatNameString = chatName.join(", ");
      console.log(chatNameString, [userInfo.username, friend.username]);
      axios
        .post(
          "/api/chats/",
          {
            creator: userInfo.username,
            name: chatNameString,
            members: [userInfo.username, friend.username],
          },
          {
            headers: { Authorization: `Bearer ${localStorage.jwt}` },
          }
        )
        .then((resp) => {
          if (resp.status == 200) {
            // ok
            this.$router.push("/chat/" + resp.data.chatUUID);
          }
        })
        .catch((err) => {
          if (err.response) {
            console.log(err.response);
          }
        });
    },

    visitWall(friendUsername) {
      this.$router.push("/wall/" + friendUsername);
    },
  },
  beforeUnmount() {},
};
</script>

<style>
.q-tab__label {
  font-size: 18px !important;
}
</style>
