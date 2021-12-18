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
            <!--TODO: on click, remove this friend -->
            <q-btn
              style="margin-right: 20px"
              v-if="friend.loggedIn"
              dense
              round
              icon="textsms"
              color="light-green-6"
              @click="showChat(friend.username)"
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
        <q-toolbar class="bg-primary text-white rounded-borders" style="width: 50%">
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
        <div v-if="this.searchedFriends && this.tab == 'people' " style="margin-top: 2%">
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
          <q-btn @click="visitWall(searchedFriend.username)" flat>
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
            icon="add_circle"
            flat
            dense
            unelevated
            style="font-size: 12px !important; margin-left: 5px"
            color="green"
            @click="addFriend(searchedFriend.username)"
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
      searchedFriends: []
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
            this.friends = resp.data;
          }
        })
        .catch((err) => {
          if (err.response) {
            console.log(err.response);
          }
        });
    },
    removeFriend(friendUsername) {
      /*
      axios
          .delete("/api/users/" + sessions.username + "/friends/" + friendUsername + "/").then((resp) => {
            if (resp == 200) {
              // ok
            } else if (resp == 401) {
              // unath
            } else if (resp == 403) {
              // forbidden
            } else if (resp == 404) {
              // friendUsername not found
            } else if (resp == 409) {
              // not already friend
            }
          })
      }
      */
    },
    //TODO: make this route call
    searchPeople() {
      console.log(this.searchPeopleQuery);

      axios
        .get("/api/users/", { params: { q: this.searchPeopleQuery } })
        .then((resp) => {
          console.log(resp);
          if (resp.status == 200) {
            // ok
          }
        })
        .catch((err) => {
          if (err.response) {
            console.log(err.response);
          }
        });

        //TODO: set this.searchedFriends
    },

    showChat(otherUsername) {
      //TODO: derive chatUUID from current user + other username
      //when calling startChat, chatName should be alphabetically sorted usernames separated by space (so can compare and see if chat exists).

      this.$router.push("/chat/" + otherUsername);
    },

    visitWall(username) {
      this.$router.push("/wall/" + username);
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
