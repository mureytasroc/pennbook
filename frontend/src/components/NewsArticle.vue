<!--TODO: not only display the post, but also fetch and display the comments underneath (given post uid) -->

<template>
  <div>
    <q-card
      vertical
      flat
      class="parchment"
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
          <q-item v-ripple style="background: whitesmoke">

            <q-item-section style="font-size: 2rem; background:#FFFF66; opacity: 08"
              ><a :href="this.link">{{ this.headline }}</a>

            </q-item-section>

            <br>

          </q-item>

          <q-separator inset />

          <q-item style="background: whitesmoke">
            <q-item-section style="font-size: 1rem"
              >
               <i>by: {{this.authors}}</i>
            </q-item-section>

          </q-item>
          <br>

           <q-item style="background: whitesmoke;text-align:center">
            <q-item-section><u>{{ getDate() }}</u></q-item-section>
          </q-item>
          <q-separator inset />

          <q-item clickable v-ripple style="background: whitesmoke; padding: 20px">
            <div style="font-size:1.5rem; color: black">
              <q-item-section>{{ this.shortDescription }}</q-item-section>
            </div>
          </q-item>
          <br>

            <q-toolbar style="margin:auto; text-align:center; background: #F0F8FF">
              <q-btn
                icon="thumb_up"
                flat
                dense
                label="
                  LIKE
                "
                @click="likePost()"
              />
              <div style="position: absolute; right: 20px; font-size: 1rem">
                <b>{{this.likes}} likes!</b>
              </div>
            </q-toolbar>

        </div>

      </q-card-section>
    </q-card>
  </div>
</template>

<script>
import moment from 'moment';

export default {
  data() {
    return {

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

  methods: {
    getDate() {
      return moment(this.date).format('MM/DD/YYYY hh:mm');
    }
  }
};
</script>

<style>
  .parchment {
    background-color: #e5e5f7;
opacity: 0.8;
background-size: 20px 20px;
background-image:  repeating-linear-gradient(0deg, #444cf7, #444cf7 1px, #e5e5f7 1px, #e5e5f7);
}
</style>
