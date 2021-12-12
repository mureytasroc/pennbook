<!--TODO: have div for displaying/changing account, and div below for Wall (maybe separate component) -->
<template>
  <q-page style="overflow-y: hidden">
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
      <div>
        <q-bar dark class="bg-secondary text-white">
          <div class="col text-center text-weight-bold">My Profile</div>
        </q-bar>

        <br />

        <q-card class="my-card">
          <q-card-section class="bg-primary text-white">
            <div class="text-h6">
              {{
                this.getActiveUserInfo.firstName +
                " " +
                this.getActiveUserInfo.lastName
              }}
            </div>
            <div class="text-subtitle2">
              {{ this.getActiveUserInfo.emailAddress + " " }}
            </div>
          </q-card-section>

          <q-card-actions>
            <q-item style="font-size: 1.1rem; color: black">{{
              "🎓: " + this.getActiveUserInfo.affiliation + " "
            }}</q-item>
            <br />

            <q-separator color="orange" inset />

            <q-item style="font-size: 1.1rem; color: black">{{
              "❤️:  " + this.getActiveUserInfo.interests
            }}</q-item>
            <br />

            <br />
          </q-card-actions>

          <div style="padding: 10px; margin: auto; text-align: center">
            <q-btn label="edit profile" />
            <!--this should open up og component to update settings?-->
          </div>
        </q-card>
        <br />
      </div>

      <hr style="height: 1px; background: grey; width: 100%" />

      <Wall :wallPosts="getWallPosts"></Wall>
    </div>
  </q-page>
</template>

<script>
import { mapActions, mapGetters } from "vuex";
export default {
  data() {
    return {};
  },

  components: {
    Wall: require("components/Wall.vue").default,
  },

  methods: {
    //...mapActions("forms", ["fbReadCurrentUserData", "updateProfileNewUser"]),
    //...mapActions("auth", ["setNewUser", "setReturningUser"]),
  },

  computed: {
    ...mapGetters("forms", ["activeUserInfo"]),

    getActiveUserInfo() {
      return {
        username: "username",
        password: "pass",
        firstName: "joe",
        lastName: "johnson",
        emailAddress: "joe@gmail.com",
        affiliation: "NETS",
        interests: ["poker", "tennis"],
      };
      //this.activeUserInfo;
    },

    getWallPosts() {
      let wallPosts = [
        {
          postUUID: "a1UNIQUEID",
          creator: { username: "bruh", firstName: "john", lastName: "smith" },
          type: "Post",
          content: "this is a personal post",
        },
        {
          postUUID: "a1UNIQUEID",
          creator: { username: "bruh", firstName: "jim", lastName: "halpert" },
          type: "Post",
          content: "person post 2",
        },
      ];

      /**
      let wallPosts = [];
      axios.get("/api/users/" + sessions.username +  "/wall/").then((resp) => {
        if (resp == 200) {
          // ok
          wallPosts = resp.data;
        } else if (resp == 400) {
          // bad req
        } else if (resp == 401) {
          //unauth
        } else if (resp == 403) {
          //forbidden
        }
      })
      */

      return wallPosts;
    },
  },

  watch: {},

  mounted() {},
};
</script>

<style lang="sass">
.my-card
  width: 100%
  max-width: 250px
</style>
