<!--TODO: have div for displaying/changing account, and div below for Wall (maybe separate component) -->
<template>
<q-page style="overflow-y: hidden">
  <div class="flex q-pa-md"
      style="width: 100%;display: flex; justify-content: center; margin: auto;margin-top:30px; overflow-x: hidden">
    <q-card
      vertical
      flat
      style="
        width: 300px;
        display: flex;
        border: 4px solid grey;
        border-radius: 20px;
        overflow: hidden;
      "
    >
      <q-card-section style="width: 100%">
          <div
            flat
            style="margin-top: -5px; margin-left: -5px; text-align: left"
          >

             <span style="font-size: 1.1rem; color: black"
            >{{ 'Email: ' + this.getActiveUserInfo.emailAddress + " "}}</span>
            <br>

            <span style="font-size: 1.1rem; color: black"
              >{{ 'Affiliation: ' + this.getActiveUserInfo.affiliation + " "}}</span>
              <br>

            <span style="font-size: 1.1rem; color: black"
            >{{ 'Interests: ' + this.getActiveUserInfo.interests + " "}}</span>
            <br>

            <span style="font-size: 1.1rem; color: black"
            >{{ 'Password'}}</span>
            <br>

            <q-btn label="edit profile" /> <!--this should open up og component to update settings?-->

        </div>
      </q-card-section>
    </q-card>

    <Wall :wallPosts="getWallPosts"></Wall>

  </div>
</q-page>
</template>

<script>
import { mapActions, mapGetters } from "vuex";
export default {
  data() {
    return {

    };
  },

  components: {
    Wall: require("components/Wall.vue").default,
  },

  methods: {
    //...mapActions("forms", ["fbReadCurrentUserData", "updateProfileNewUser"]),
    //...mapActions("auth", ["setNewUser", "setReturningUser"]),
  },

  computed: {
    ...mapGetters("forms", [
      "activeUserInfo"
    ]),

    getActiveUserInfo() {
      return {"username":"username", "password": "pass", "firstName": "joe", "lastName": "johnson", "emailAddress": "joe@gmail.com", "affiliation": "NETS", "interests": ['poker', 'tennis']};
      //this.activeUserInfo;
    },

    getWallPosts() {
      let wallPosts = [{"postUUID": 'a1UNIQUEID', "creator": {"username": "bruh", "firstName": "john", "lastName": "smith"}, "type": "Post", "content": "this is a personal post"},
      {"postUUID": 'a1UNIQUEID', "creator": {"username": "bruh", "firstName": "jim", "lastName": "halpert"}, "type": "Post", "content": "person post 2"}];
      return wallPosts;
    },
  },

  watch: {

  },

  mounted() {

  },
};
</script>






