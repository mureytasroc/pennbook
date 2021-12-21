<template>
  <div>
    <q-infinite-scroll @load="onLoad">
      <q-list class="full-width">
        <div>
          <q-item
            v-for="comment in this.comments"
            :key="comment"
            style="
              margin: auto;
              margin-bottom: 10px;
              margin-top: 10px;
              opacity: 0.8;
              background: whitesmoke;
            "
            clickable
            v-ripple
          >
            <q-item-section avatar>
              <q-avatar color="primary" text-color="white">
                {{
                  comment.creator.firstName.charAt(0).toUpperCase() +
                  comment.creator.lastName.charAt(0).toUpperCase()
                }}
              </q-avatar>
            </q-item-section>

            <q-item-section>{{
              comment.creator.firstName + " " + comment.creator.lastName
            }}</q-item-section>
            <q-item-section
              style="
                word-wrap: break-word;
                margin-left: -35px;
                padding-left: 10px;
                border-left: 0.1rem solid rgba(0, 0, 0, 0.12);
              "
              >{{ comment.content }}
            </q-item-section>
          </q-item>
        </div>
      </q-list>
      <template v-slot:loading>
        <div class="row justify-center q-my-md">
          <q-spinner-dots color="primary" size="40px" />
        </div>
      </template>
    </q-infinite-scroll>

    <br />

    <!--TODO: make this call route to add comment under post -->
    <q-form @keyup:enter="postComment" class="full-width">
      <q-input outlined autogrow v-model="newComment" label="Add Comment:">
        <template v-slot:after>
          <q-btn
            style="background: rgba(0, 0, 0, 0.12)"
            v-show="newComment"
            @click="postComment"
            round
            dense
            flat
            type="submit"
            color="white"
            icon="send"
          />
        </template>
      </q-input>
    </q-form>
  </div>
</template>

<script>
import axios from "axios";
export default {
  data() {
    return {
      comments: [],
      newComment: "",
    };
  },
  props: {
    postUUID: {
      type: String,
      required: true,
    },
    creator: {
      type: String,
      required: true,
    },
  },

  computed: {
    //TODO: this has to call route to postUUID to fetch comments
  },

  methods: {
    postComment() {
      axios
        .post(
          "/api/users/" +
            this.creator +
            "/wall/" +
            this.postUUID +
            "/comments/",
          {
            content: this.newComment,
          },
          {
            headers: { Authorization: `Bearer ${localStorage.jwt}` },
          }
        )
        .then((resp) => {
          if (resp.status == 201) {
            // ok
            this.newComment = "";
            this.comments.push(resp.data);
          }
        });
    },
    getInitialComments() {
      axios
        .get(
          "/api/users/" +
            this.creator +
            "/wall/" +
            this.postUUID +
            "/comments/",
          {
            headers: { Authorization: `Bearer ${localStorage.jwt}` },
          }
        )
        .then((resp) => {
          if (resp.status == 200) {
            // ok
            this.comments = resp.data.reverse();
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
      if (this.comments.length == 0) {
        done();
        return;
      }
      axios
        .get(
          "/api/users/" +
            this.creator +
            "/wall/" +
            this.postUUID +
            "/comments/",
          {
            params: {
              page: this.comments[this.comments.length - 1].commentUUID,
            },
            headers: { Authorization: `Bearer ${localStorage.jwt}` },
          }
        )
        .then((resp) => {
          if (resp.status == 200) {
            if (resp.data.length == 0) {
              // reached end
              done(true);
            } else {
              this.comments.push(...resp.data.reverse());
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
  beforeMount() {
    this.getInitialComments();
  },
};
</script>

<style></style>
