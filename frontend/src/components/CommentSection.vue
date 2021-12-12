<template>
  <div>
    <q-list class="full-width">
      <div>
        <q-item
          v-for="comment in comments"
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
export default {
  data() {
    return {
      newComment: "",
    };
  },
  props: {
    postUUID: {
      type: String,
      required: true,
    },
  },

  computed: {
    //TODO: this has to call route to postUUID to fetch comments
    comments() {
      let comments = [
        {
          commentUUID: "a",
          creator: { username: "bruh", firstName: "joe", lastName: "joe" },
          content:
            "comment1 YOOOOOOOOO LES G O O O O AFSF ASF LASF ASLFLASLFASLFLAS",
        },
        {
          commentUUID: "b",
          creator: { username: "bruhh", firstName: "joes", lastName: "jose" },
          content: "comment2",
        },
      ];

      /*
      let comments = [];
      axios
        .get(
          "/api/users/" +
            sessions.username +
            "/wall/" +
            this.$props.postUUID +
            "/"
        )
        .then((resp) => {
          if (resp == 200) {
            // ok
            comments = resp.data;
          } else if (resp == 400) {
            // bad req
          } else if (resp == 401) {
            // unauth
          } else if (resp == 403) {
            // forbidden
          } else if (resp == 404) {
            // postUUID not found
          }
        });
        */

      return comments;
    },
  },

  methods: {
    postComment() {
      //TODO: call route to update db with new comment
      axios
        .post(
          "/api/users/" +
            sessions.username +
            "/wall/" +
            this.$props.postUUID +
            "/",
          {
            content: this.newComment,
          }
        )
        .then((resp) => {
          if (resp == 200) {
            // ok
          } else if (resp == 400) {
            // bad req
          } else if (resp == 401) {
            // unauth
          } else if (resp == 403) {
            // forbidden
          } else if (resp == 404) {
            // postUUID not found
          }
        });
    },
  },
};
</script>

<style></style>
