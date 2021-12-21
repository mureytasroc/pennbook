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
      <!-- homepage -->

      <div v-if="!this.loadingInitialPosts && this.posts.length == 0">
        <span class="absolute-center" style="text-align: center; width: 90%">
          <p style="font-size: 20px; color: grey">
            No posts to display :(
          </p> </span
        >-
      </div>

      <div v-if="this.loadingInitialPosts">
        <span class="absolute-center" style="text-align: center">
          <q-spinner color="primary" size="3em" :thickness="2" />
          <p style="font-size: 20px; color: grey">Loading your feed...</p>
        </span>
      </div>

      <div v-else>
        <q-infinite-scroll @load="onLoad">
          <div style="margin-left: -100px"></div>
          <q-list class="full-width">
            <div>
              <q-item
                v-for="(post, index) in this.posts"
                :key="index"
                clickable
                v-ripple
                style="
                  margin: auto;
                  margin-bottom: 10px;
                  margin-top: 10px;
                  opacity: 0.8;
                "
              >
                <div v-if="post.type == 'Friendship'">
                  <FriendshipUpdate
                    :firstNameA="post.friend.firstName"
                    :lastNameA="post.friend.lastName"
                    :firstNameB="post.friendOfFriend.firstName"
                    :lastNameB="post.friendOfFriend.lastName"
                    style="height: 100%; width: 100%; margin: auto"
                  />
                </div>

                <div v-else>
                  <StatusPost
                    :postUUID="post.postUUID"
                    :creator="post.creator.username"
                    :firstName="post.creator.firstName"
                    :lastName="post.creator.lastName"
                    :content="post.content"
                    style="height: 100%; width: 100%; margin: auto"
                  />
                </div>
              </q-item>
            </div>
          </q-list>
          <template v-slot:loading>
            <div class="row justify-center q-my-md">
              <q-spinner-dots color="primary" size="40px" />
            </div>
          </template>
        </q-infinite-scroll>
      </div>
    </div>
  </q-page>
</template>

<script>
//maybe pull up chats of matches here; in v-for, only load user if in liked array
//when message is sent is to other user, other user's 'read' should be switched to false (unless on current router. then still true). in same payload
import { mapState, mapGetters, mapActions } from "vuex";
import { Notify } from "quasar";
import axios from "axios";
export default {
  data() {
    return {
      posts: [],
      loadingInitialPosts: false,
    };
  },

  props: {
    night: Boolean,
  },

  components: {
    StatusPost: require("components/StatusPost.vue").default,
    FriendshipUpdate: require("components/FriendshipUpdate.vue").default,
  },

  computed: {
    // return the key range specified by the current message page # and size of page.
    // ex. if we're on page 1 and size is 5, return keys [5..9]
    // prerequisite: matchOnline is "sorted" by keys

    // return a subset of matchOnline, which is dictated by the key array from matchOnlineKeyRange.
    matchOnlineRange() {
      let objRange = {};
      this.matchOnlineKeyRange.forEach((key) => {
        objRange[key] = this.matchOnline[key];
      });
      return objRange;
    },

    postsLength() {
      // return Object.keys(this.matchOnline).length;
      return 1;
    },
  },

  methods: {
    getInitialPosts() {
      this.loadingInitialPosts = true;
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      axios
        .get("/api/users/" + userInfo.username + "/home/", {
          headers: { Authorization: `Bearer ${localStorage.jwt}` },
        })
        .then((resp) => {
          if (resp.status == 200) {
            // ok
            this.posts = resp.data;
            this.loadingInitialPosts = false;
          }
        })
        .catch((err) => {
          if (err.response) {
            if (err.response.status == 401) {
              localStorage.clear();
              this.$router.push("/login");
            } else {
              alert(err.response.data.message);
              this.loadingPosts = false;
            }
          }
        });
    },
    onLoad(index, done) {
      if (this.posts.length == 0) {
        done();
        return;
      }

      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      axios
        .get("/api/users/" + userInfo.username + "/home/", {
          params: { page: this.posts[this.posts.length - 1].postUUID },
          headers: { Authorization: `Bearer ${localStorage.jwt}` },
        })
        .then((resp) => {
          if (resp.status == 200) {
            if (resp.data.length == 0) {
              // reached end of posts
              done(true);
            } else {
              this.posts.push(...resp.data);
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
              done(true);
            }
          }
        });
    },
  },
  beforeMount() {
    this.getInitialPosts();
  },
};
</script>

<style>
#background {
  position: absolute;
  width: 100%;
  height: 100%;
  background: linear-gradient(0deg, #ffffff 5%, #e4cbffff 95%);
  background-repeat: no-repeat;
  background-size: cover;
}

@media (min-width: 320px) and (max-height: 570px) {
  #nameFont {
    font-size: 13px !important;
  }
  #previewFont {
    font-size: 10px !important;
  }

  #randomBtnFont {
    font-size: 9.5px !important;
  }
}
/* Galaxy Note 3/S9  */
@media (min-width: 360px) and (max-width: 400px) {
  #nameFont {
    font-size: 15px !important;
  }
  #previewFont {
    font-size: 12px !important;
  }

  #randomBtnFont {
    font-size: 11px !important;
  }
}

@media (min-width: 410px) and (max-width: 450px) {
  #nameFont {
    font-size: 16px !important;
  }
  #previewFont {
    font-size: 13px !important;
  }

  #randomBtnFont {
    font-size: 13px !important;
  }
}

/* @media (max-width: 400px) {
  #randomBtnFont {
    font-size: 11px !important;
  }
} */
</style>
