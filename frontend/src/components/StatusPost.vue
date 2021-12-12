<!--TODO: not only display the post, but also fetch and display the comments underneath (given post uid) -->

<template>
  <div>
    <q-card
      vertical
      flat
      style="
        width: 350px;
        display: flex;
        border: 5px solid whitesmoke;
        border-radius: 10px;
        overflow: hidden;
      "
    >
      <q-card-section style="width: 100%">
          <div
            flat >

          <q-item clickable v-ripple style="background: #fce8ea">
             <q-item-section avatar>
                <q-avatar color="primary" text-color="white">
                    {{ this.firstName.charAt(0).toUpperCase() + this.lastName.charAt(0).toUpperCase()}}
                </q-avatar>
            </q-item-section>
            <q-item-section>{{ this.firstName + " " + this.lastName}}</q-item-section>
        </q-item>

        <q-separator spaced inset />
        <q-item clickable v-ripple style="background: #e6f4f7;padding:20px">
            <div style="font-size: 1.2rem; color:black">
            <q-item-section>{{ this.content }}</q-item-section>
            </div>
        </q-item>

         <q-separator spaced inset />


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