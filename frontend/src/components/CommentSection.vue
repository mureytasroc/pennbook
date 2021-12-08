<template>
  <div>
    <q-list class="full-width">
          <div>
           <q-item
              v-for="comment in comments"
              :key="comment"
              bordered separator
              clickable
              v-ripple

              style="
                margin: auto;
                margin-bottom: 10px;
                margin-top: 10px;
                opacity: 0.8;
              "
            >

            <q-item-section>{{comment.creator.firstName + " " + comment.creator.lastName + ": " + comment.content }} </q-item-section>

            </q-item>
          </div>
        </q-list>

        <q-form @keyup:enter="postComment" class="full-width">
          <q-input outlined autogrow v-model="newComment" label="Add Comment:">
            <template v-slot:after>
                <q-btn style="background:black"
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
    }
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
      let comments = [{"commentUUID": "a", "creator": {"username": "bruh", "firstName": "joe", "lastName": "joe"}, "content": "comment1"},
      {"commentUUID": "b", "creator": {"username": "bruhh", "firstName": "joes", "lastName": "jose"}, "content": "comment2"}];
      return comments;
    },

  },

  methods: {
    postComment() {
      //TODO: call route to update db with new comment
      console.log('send message');
    }
  }

};
</script>

<style>
.rainbowname {
  background: red;
  background: -webkit-linear-gradient(left, #c33764, #1d2671);
  background: -o-linear-gradient(right, #c33764, #1d2671);
  background: -moz-linear-gradient(right, #c33764, #1d2671);
  background: linear-gradient(to right, #c33764, #1d2671);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
</style>