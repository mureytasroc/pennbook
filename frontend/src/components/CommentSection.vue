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
  </div>
</template>


<script>
export default {
  data() {
    return {

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