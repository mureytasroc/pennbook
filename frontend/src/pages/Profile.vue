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
              {{ this.userInfo.firstName + " " + this.userInfo.lastName }}
            </div>
            <div v-if="!this.editMode" class="text-subtitle2">
              {{ this.userInfo.emailAddress + " " }}
            </div>

            <q-input
              class="text-white"
              v-if="this.editMode"
              filled
              v-model="newEmailAddress"
              :placeholder="this.userInfo.emailAddress"
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
              >{{ "🎓: " + this.userInfo.affiliation + " " }}</q-item
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
              >{{ "❤️:  " + this.userInfo.interests }}</q-item
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
        :wallPosts="this.wallPosts"
        username="My Own"
        v-bind:isSelf="true"
      ></WallView>
    </div>
  </q-page>
</template>

<script>
import { mapActions, mapGetters } from "vuex";
import axios from "axios";
export default {
  data() {
    return {
      wallPosts: [],
      editMode: false,
      newAffiliation: "",
      newInterests: [],
      newEmailAddress: "",
      newPassword: "",
      affiliationOptions: [],
      interestOptions: [],
      userInfo: {},
    };
  },

  components: {
    WallView: require("components/WallView.vue").default,
  },

  methods: {
    //...mapActions("forms", ["fbReadCurrentUserData", "updateProfileNewUser"]),
    //...mapActions("auth", ["setNewUser", "setReturningUser"]),
    getActiveUserInfo() {
      this.userInfo = JSON.parse(localStorage.getItem("userInfo"));
    },
    updateProfile() {
      //TODO: compare new values (below line) with values from getActiveUserInfo, and update if necessary (make route call to update / make respective wall posts)
      //this.newEmailAddress + this.newPassword + this.newAffiliation + this.newInterests
      let params = {};
      if (this.newEmailAddress !== this.userInfo.emailAddress) {
        params["emailAddress"] = this.newEmailAddress;
      } else if (this.newPassword !== "") {
        params["password"] = this.newPassword;
      } else if (this.newAffiliation !== this.userInfo.affiliation) {
        params["affiliation"] = this.newAffiliation;
      } else if (
        this.newInterests.sort().toString() !==
        this.userInfo.interests.sort().toString()
      ) {
        params["interests"] = this.newInterests;
      }
      if (Object.keys(params).length !== 0) {
        axios
          .patch("/api/users/" + this.userInfo.username + "/profile/", params, {
            headers: { Authorization: `Bearer ${localStorage.jwt}` },
          })
          .then((resp) => {
            if (resp.status == 200) {
              localStorage.jwt = resp.data.token;
              localStorage.setItem("userInfo", JSON.stringify(resp.data));
              alert("Updated profile!");
              this.editMode = false;
              this.getActiveUserInfo();
            }
          })
          .catch((err) => {
            if (err.response) {
              alert(err.response.data.message);
              this.editMode = false;
            }
          });
      }
    },
  },

  computed: {
    ...mapGetters("forms", ["activeUserInfo"]),
  },

  watch: {},

  mounted() {
    // prefill affiliations/interests with current chosen
    this.getActiveUserInfo();
    this.newAffiliation = this.userInfo.affiliation;
    this.newInterests = this.userInfo.interests;

    // load affiliations and interests
    axios
      .get("/api/users/affiliations/")
      .then((resp) => {
        if (resp.status == 200) {
          this.affiliationOptions = resp.data;
        }
      })
      .catch((err) => {
        if (err.response) {
          alert(err.response.data.message);
        }
      });

    axios
      .get("/api/news/categories/")
      .then((resp) => {
        if (resp.status == 200) {
          this.interestOptions = resp.data;
        }
      })
      .catch((err) => {
        if (err.response) {
          alert(err.response.data.message);
        }
      });

    // load wall posts

    axios
      .get(
        "/api/users/" + this.userInfo.username + "/wall/",

        {
          headers: { Authorization: `Bearer ${localStorage.jwt}` },
        }
      )
      .then((resp) => {
        if (resp.status == 200) {
          this.wallPosts = resp.data;
        }
      })
      .catch((err) => {
        if (err.response) {
          alert(err.response.data.message);
        }
      });
  },
};
</script>

<style lang="sass">
.my-card
  width: 100%
  max-width: 500px
</style>
