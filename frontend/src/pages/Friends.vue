<!-- list view of friends – indicate online or not with green dot – also have chat invite button? 2 tab, with one tab being visualizer-->

<template>
  <q-page style="overflow-y: hidden">
    <!-- chat page -->

    <div
      class="flex q-pa-md"
      style="
        width: 100%;
        display: flex;
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
            <q-tab style="color: #011f5b" label="People" name="People" />

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
                    <q-item v-for="friend in getFriends" :key="friend" clickable v-ripple style="
                height: 80px;
                margin: auto;
                margin-bottom: 10px;
                width:600px;
                opacity: 0.8;
                background: whitesmoke
              ">
              <q-btn @click="visitWall(friend.username)" flat>
                <q-item-section avatar>
                <q-avatar color="primary" text-color="white">
                    {{ friend.firstName.charAt(0).toUpperCase() + friend.lastName.charAt(0).toUpperCase()}}
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
                <q-item-label>{{ friend.firstName + " " + friend.lastName }}</q-item-label>

                </q-item-section>

                <q-item-section side>
                <!--TODO: on click, remove this friend -->
                <q-btn style="margin-right: 20px"
                    v-if="friend.loggedIn"
                    dense
                    round
                    icon="textsms"
                    color="light-green-6"
                    @click="
                        showChat(friend.username);
                    "
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


        <div v-else-if="this.tab == 'visualizer'" class="inline justify-center shift no-wrap"
          style="display: flex; position: relative;">
        <Visualizer />
        </div>

      <!-- people -->
      <!--TODO: once get profiles showing up, make 'add friend' button-->
      <div
        v-else
        class="inline justify-center shift no-wrap"
        style="display: flex; position: relative; margin-top: 2%"
      >
        <!--TODO: make this functional and search for friends / move elsewhere-->
        <q-toolbar class="bg-primary text-white rounded-borders">
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
    </div>

  </q-page>
</template>

<script>
import { mapState, mapActions, mapGetters } from "vuex";
export default {
  data() {
    return {
      tab: "friends",
      searchPeopleQuery: "",
    };
  },
  props: {},
  components: {
    Visualizer: require("components/Visualizer.vue").default,
  },
  computed: {
    getFriends() {
      //TODO: call route to fetch friendships
      let friends = [
        {
          username: "pat-liu",
          firstName: "pat",
          lastName: "liu",
          confirmed: true,
          loggedIn: true,
        },
        {
          username: "max-tsiang",
          firstName: "max",
          lastName: "tsiang",
          confirmed: true,
          loggedIn: false,
        },
      ];
      /*
      let friends = [];
      axios
          .get("/api/users/" + sessions.username + "/friends/").then((resp) => {
            if (resp == 200) {
              // ok
              friends = resp.data;
            } else if (resp == 401) {
              // unath
            } else if (resp == 403) {
              // forbidden
            }
          })
      }
      */
      return friends;
    },
  },

  watch: {},
  mounted() {},
  methods: {
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
      /*
      axios
        .get("/api/users/", { params: { q: this.searchPeopleQuery } })
        .then((resp) => {
          if (resp == 200) {
            // ok
          } else if (resp == 400) {
            // bad req
          }
        });
        */
    },

    showChat(otherUsername) {
      //TODO: derive chatUUID from current user + other username
      //when calling startChat, chatName should be alphabetically sorted usernames separated by space (so can compare and see if chat exists).

      this.$router.push("/chat/" + otherUsername);
    },

    visitWall(username) {
      this.$router.push('/wall/'+username)
    }

  },
  beforeUnmount() {},
};
</script>

<style>
.q-tab__label {
  font-size: 18px !important;
}
</style>
