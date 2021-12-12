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
            flat>

          <q-item clickable v-ripple style="background: #87E789">
             <q-item-section avatar>
                <q-avatar color="primary" text-color="white">
                    {{ this.firstNameA.charAt(0).toUpperCase() + this.lastNameA.charAt(0).toUpperCase()}}
                </q-avatar>
            </q-item-section>
            <q-item-section style="font-size: 1rem">{{ this.firstNameA + " " + this.lastNameA}} </q-item-section>

            <q-item-section avatar>
                <q-avatar color="primary" text-color="white">
                    {{ this.firstNameB.charAt(0).toUpperCase() + this.lastNameB.charAt(0).toUpperCase()}}
                </q-avatar>
            </q-item-section>
            <q-item-section style="font-size: 1rem; margin-left: 10px">{{ this.firstNameB + " " + this.lastNameB}} </q-item-section>
        </q-item>

         <q-separator spaced inset />
                <q-img src="/handshake.png" width="150px"/>
            <span>They are now friends!</span>

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