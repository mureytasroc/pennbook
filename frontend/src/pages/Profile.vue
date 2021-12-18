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
            <div v-if="!this.editMode" class="text-subtitle2">
              {{ this.getActiveUserInfo.emailAddress + " " }}
            </div>

            <q-input
              class="text-white"
              v-if="this.editMode"
              filled
              v-model="newEmailAddress"
              :placeholder="this.getActiveUserInfo.emailAddress"
              :dense="dense"
              style="color: white; background: white; margin-top: 10px"
            />
            <q-input
              class="text-white"
              v-if="this.editMode"
              filled
              v-model="newPassword"
              placeholder="******"
              :dense="dense"
              style="color: white; background: white; margin-top: 10px"
            />
          </q-card-section>

          <q-card-actions>
            <q-item
              v-if="!this.editMode"
              style="font-size: 1.1rem; color: black"
              >{{ "🎓: " + this.getActiveUserInfo.affiliation + " " }}</q-item
            >

            <br v-if="this.editMode" />

            <q-item
              v-if="this.editMode"
              style="font-size: 1.1rem; color: black"
            >
              🎓:

                <q-select
                  outlined
                  v-model="newAffiliation"
                  :options="affiliationOptions"
                  label="Affiliation"
                />

            </q-item>

            <br />

            <q-separator color="orange" inset />

            <q-item
              v-if="!this.editMode"
              style="font-size: 1.1rem; color: black"
              >{{ "❤️:  " + this.getActiveUserInfo.interests }}</q-item
            >

            <q-item
              v-if="this.editMode"
              style="font-size: 1.1rem; color: black"
            >
              ❤️:

              <q-select
                outlined
                multiple
                v-model="newInterests"
                :options="interestOptions"
                label="Interests"
              />
            </q-item>

            <br />
          </q-card-actions>

          <div style="padding: 10px; margin: auto; text-align: center">
            <q-btn
              v-if="!this.editMode"
              label="edit profile"
              @click="this.editMode = true"
            />
            <q-btn v-if="this.editMode" label="Submit" @click="updateProfile" />
            <!--this should open up og component to update settings?-->
          </div>
        </q-card>
        <br />
      </div>

      <hr style="height: 1px; background: grey; width: 100%" />

      <WallView
        :wallPosts="getWallPosts"
        username="My Own"
        v-bind:isSelf="true"
      ></WallView>
    </div>
  </q-page>
</template>

<script>
import { mapActions, mapGetters } from "vuex";
export default {
  data() {
    return {
      editMode: false,
      newAffiliation: "",
      newInterests: [],
      newEmailAddress: "",
      newPassword: "",
      affiliationOptions: [],
      interestOptions: []
    };
  },

  components: {
    WallView: require("components/WallView.vue").default,
  },

  methods: {
    //...mapActions("forms", ["fbReadCurrentUserData", "updateProfileNewUser"]),
    //...mapActions("auth", ["setNewUser", "setReturningUser"]),

    updateProfile() {
      this.editMode = false;
      //TODO: compare new values (below line) with values from getActiveUserInfo, and update if necessary (make route call to update / make respective wall posts)
      //this.newEmailAddress + this.newPassword + this.newAffiliation + this.newInterests
    },
  },

  computed: {
    ...mapGetters("forms", ["activeUserInfo"]),

    getActiveUserInfo() {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      return {
        username: userInfo.username,
        password: "",
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        emailAddress: userInfo.emailAddress,
        affiliation: userInfo.affiliation,
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

  mounted() {
    //TODO: load preset interest options.., and set presetInterestOptions?
    this.affilationOptions = ['a', 'b', 'c']
    this.interestOptions = ['d', 'e', 'f']
  },
};
</script>

<style lang="sass">
.my-card
  width: 100%
  max-width: 250px
</style>
