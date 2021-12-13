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

      <WallView :wallPosts="getWallPosts" :username="this.username" v-bind:isSelf="false"></WallView>
    </div>
  </q-page>
</template>

<script>
import { mapActions, mapGetters } from "vuex";
export default {
  data() {
    return {
      editMode: false,
      presetInterestOptions: [],
      newAffiliation: "",
      newInterests: [],
      newEmailAddress: "",
      newPassword: "",
      username: ""
    };
  },

  components: {
    WallView: require("components/WallView.vue").default,
  },

  methods: {

  },

  computed: {

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

      return wallPosts;
    },
  },

  watch: {},

  mounted() {
    let currentPath = this.$route.fullPath;
    let subdomains = currentPath.split('/');
    this.username = subdomains[subdomains.length-1]

    //TODO: make route call to fetch wall posts from username
  },
};
</script>

<style lang="sass">
.my-card
  width: 100%
  max-width: 250px
</style>
