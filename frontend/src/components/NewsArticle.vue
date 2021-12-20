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

        <div flat>
          <q-item clickable v-ripple style="background: whitesmoke">

            <q-item-section style="font-size: 2rem"
              >{{ this.headline }}
            </q-item-section>

          </q-item>

          <q-separator inset />

          <div style="margin:auto; text-align: center">
            <a :href="this.link" target="_blank"><img
              :src="this.imageLink"
              style="max-width: 300px"
            /></a>
          </div>

          <q-separator inset />

          <q-item clickable v-ripple style="background: #e6f4f7; padding: 20px">
            <div style="font-size: 1.2rem; color: black">
              <q-item-section>{{ this.shortDescription }}</q-item-section>
            </div>
          </q-item>

        </div>

      </q-card-section>
    </q-card>
  </div>
</template>

<script>
export default {
  data() {
    return {
      imageLink: "https://static01.nyt.com/images/2017/04/12/us/12military/12military-superJumbo.jpg?quality=75&auto=webp"
    };
  },
  components: {

  },

  props: {
    articleUUID: {
      type: String,
      required: true,
    },
    likes: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    headline: {
      type: String,
      required: true,
    },
    authors: {
      type: String,
      required: true,
    },
    link: {
      type: String,
      required: true,
    },
    shortDescription: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
  },
};
</script>

<style>

</style>
