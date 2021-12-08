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
              >{{ this.firstNameA + " " + this.lastNameA}}</span>
            <br>
            <span>and </span>
            <br>
            <span style="font-size: 1.1rem; color: black"
              >{{ this.firstNameB + " " + this.lastNameB}}</span>
            <br>
            <span>are now friends.</span>
              <br>

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
  props: {
    firstNameA: {
      type: String,
      required: true,
    },
    lastNameA: {
      type: String,
      required: true,
    },
    firstNameB: {
      type: String,
      required: true,
    },
    lastNameB: {
      type: String,
      required: true,
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