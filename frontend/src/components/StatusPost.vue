<!--TODO: not only display the post, but also fetch and display the comments underneath (given post uid) -->

<template>
  <div>
    <q-card
      vertical
      flat
      style="
        width: 300px;
        display: flex;
        border: 4px solid grey;
        border-radius: 20px;
        overflow: hidden;
      "
    >
      <q-card-section style="width: 100%">
          <div
            flat
            style="margin-top: -5px; margin-left: -5px; text-align: left"
          >
            <span style="font-size: 1.1rem; color: black"
              >{{ this.firstName + " " + this.lastName}}</span>

              <br>

            <b><span style="font-size: 1.1rem; color: black"
              > {{ this.content }}</span></b>

            <CommentSection :postUUID="this.postUUID"> </CommentSection>

            <!--fetch comments by post uuid-->

        </div>
      </q-card-section>
    </q-card>
  </div>
</template>


<script>
export default {
  data() {
    return {

    }
  },
  components: {
      CommentSection: require("components/CommentSection.vue").default
  },

  props: {
    postUUID: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    }
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