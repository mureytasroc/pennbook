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

      <div>
        <!--TODO: v-if="!this.hasFeed" -->
        <!-- User no feed display -->

        <!--<span class="absolute-center" style="text-align: center; width: 90%">
          <p
            style="font-size: 50px; color: grey"
          >
            There is no content!
          </p>
        </span>-->
      </div>

      <div>
        <!-- TODO: v-else-if="!this.feedLoaded" -->
        <!--<span
          class="absolute-center"
          style="text-align: center"
        >
                <q-spinner
                color="primary"
                size="3em"
                :thickness="2"
            />
          <p
            style="font-size: 20px; color: grey"
          >
            Loading your feed...
          </p>
        </span>-->
      </div>

      <div>
        <!--TODO: v-else -->
        <div style="margin-left: -100px"></div>
        <q-list class="full-width">
          <div>
            <q-item
              v-for="post in this.posts"
              :key="post.postUUID"
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

  methods: {},

  mounted() {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    axios
      .get("/api/users/" + userInfo.username + "/home/", {
        headers: { Authorization: `Bearer ${localStorage.jwt}` },
      })
      .then((resp) => {
        if (resp.status == 200) {
          // ok
          console.log(resp.data);
          this.posts = resp.data;
        }
      })
      .catch((err) => {
        if (err.response) {
          console.log(err.response);
        }
      });
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
