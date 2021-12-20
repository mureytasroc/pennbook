<template>
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
    <!-- wall-->

    <div>
      <!--TODO: v-else -->
      <div>
        <q-bar dark class="bg-secondary text-white">
          <div v-if="this.isSelf" class="col text-center text-weight-bold">
            {{ this.username }} Wall!
          </div>
          <div v-else class="col text-center text-weight-bold">
            {{ this.username }}'s Wall!
          </div>
        </q-bar>
        <br />
        <br v-if="!this.isSelf" />

        <q-card
          style="
            margin: auto;
            border: 8px solid white;
            border-radius: 20px;
            overflow-y: hidden;
            overflow-x: hidden;
            bottom: 20%;
            width: 90%;
          "
        >
          <q-card
            style="border-radius: 20px; height: 190px; background: whitesmoke"
          >
            <q-card-section style="font-size: 1rem">
              <q-input
                v-model="newPost"
                rounded
                autofocus
                :autogrow="false"
                placeholder="Your update!"
                standout="bg-white text-black"
                type="textarea"
                bg-color="white"
                style="height: 100%; opacity: 0.8; padding-top: 10px"
                input-style="color: black; font-size: 1.2rem;"
              >
              </q-input>
            </q-card-section>
          </q-card>
          <q-card-actions
            style="width: 100%; font-size: 1rem; margin-top: 5px"
            class="row justify-between"
          >
            <q-btn
              label="Post Update!"
              color="primary"
              v-close-popup
              rounded
              @click="postUpdate()"
              style="padding: 10px; margin: auto"
            >
            </q-btn>
          </q-card-actions>
        </q-card>
        <div v-if="!this.isSelf">
          <br />
          <br />
        </div>
      </div>
      <q-list class="full-width">
        <div>
          <q-item
            v-for="post in this.wallPosts"
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
            <div>
              <StatusPost
                :postUUID="post.postUUID"
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
      newPost: "",
    };
  },

  props: {
    wallPosts: {
      type: Object,
      default: () => ({}),
    },
    username: {
      type: String,
    },
    isSelf: {
      type: Boolean,
    },
  },

  components: {
    StatusPost: require("components/StatusPost.vue").default,
  },

  computed: {},

  methods: {
    postUpdate() {
      //TODO: post update (text in newPost variable) – have to store/fetch currently logged in user in local state (need creator data)
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      axios
        .post(
          "/api/users/" + userInfo.username + "/wall/",
          {
            type: "Post",
            content: this.newPost,
          },
          {
            headers: { Authorization: `Bearer ${localStorage.jwt}` },
          }
        )
        .then((resp) => {
          if (resp.status == 201) {
            // created
            this.wallPosts.unshift(resp.data);
            this.newPost = "";
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

  mounted() {},
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
