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
          <q-item clickable v-ripple style="background: #fce8ea">

            <q-item-section style="font-size: 1rem"
              >{{ this.headline }} 📢
            </q-item-section>
          </q-item>

          <q-separator spaced inset />
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
    return {};
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
