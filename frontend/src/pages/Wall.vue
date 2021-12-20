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
      <WallView
        :wallPosts="this.wallPosts"
        :username="this.username"
        v-bind:isSelf="false"
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

  methods: {},

  computed: {},

  watch: {},

  mounted() {
    let currentPath = this.$route.fullPath;
    let subdomains = currentPath.split("/");
    this.username = subdomains[subdomains.length - 1];

    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
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
};
</script>

<style lang="sass">
.my-card
  width: 100%
  max-width: 250px
</style>
