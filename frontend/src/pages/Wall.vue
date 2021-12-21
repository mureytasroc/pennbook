<template>
  <q-page style="overflow-y: hidden">
    <div>
      <q-infinite-scroll @load="onLoad">
        <WallView
          :wallPosts="this.wallPosts"
          :username="this.username"
          v-bind:isSelf="false"
        ></WallView>
        <template v-slot:loading>
          <div class="row justify-center q-my-md">
            <q-spinner-dots color="primary" size="40px" />
          </div>
        </template>
      </q-infinite-scroll>
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
      presetInterestOptions: [],
      newAffiliation: "",
      newInterests: [],
      newEmailAddress: "",
      newPassword: "",
      username: "",
    };
  },

  components: {
    WallView: require("components/WallView.vue").default,
  },

  methods: {
    getInitialPosts() {
      let currentPath = this.$route.fullPath;
      let subdomains = currentPath.split("/");
      this.username = subdomains[subdomains.length - 1];

      axios
        .get(
          "/api/users/" + this.username + "/wall/",

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
            if (err.response.status == 401) {
              localStorage.clear();
              this.$router.push("/login");
            } else {
              alert(err.response.data.message);
            }
          }
        });
    },
    onLoad(index, done) {
      if (this.wallPosts.length == 0) {
        done();
        return;
      }
      axios
        .get("/api/users/" + this.username + "/wall/", {
          params: { page: this.wallPosts[this.wallPosts.length - 1].postUUID },

          headers: { Authorization: `Bearer ${localStorage.jwt}` },
        })
        .then((resp) => {
          if (resp.status == 200) {
            if (resp.data.length == 0) {
              // reached end
              done(true);
            } else {
              this.wallPosts.push(...resp.data);
              done();
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
  },

  computed: {},

  watch: {},

  beforeMount() {
    this.getInitialPosts();
  },
};
</script>

<style lang="sass">
.my-card
  width: 100%
  max-width: 250px
</style>
