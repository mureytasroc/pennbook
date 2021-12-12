<!-- list view of friends – indicate online or not with green dot – also have chat invite button? 2 tab, with one tab being visualizer-->

<template>
  <q-page style="overflow-y: hidden">

    <div
      class="flex q-pa-md"
      style="width: 100%;display: flex; justify-content: center; margin: auto;margin-top:30px; overflow-x: hidden"
    >
        <div
            vertical
            style="
              width: 100%;
              margin-bottom: 10px;
              margin-top: -10px;
              height: 40px;
            "
          >
            <q-tabs
              v-model="tab"
              dense
              class="text-white"
              active-color="black"
              indicator-color="black"
              align="center"
              narrow-indicator
            >
              <q-tab style="color: #011F5b" label="Friends" name="friends" />

              <q-tab
                style="color:#011F5b"
                label="Visualizer"
                name="visualizer"
                @click="changeMe"
              />

            </q-tabs>
          </div>

           <!-- profile tab (for regular chat) -->
        <div
          v-if="
            this.tab == 'friends'
          "
          style="margin-top:4%"
        >
            <!--TODO: make this functional and search for friends / move elsewhere-->
            <q-toolbar class="bg-primary text-white rounded-borders">
                <h7 class="gt-xs">
                Find/Add friends!
                </h7>

                <q-space />

                <q-input dark dense standout v-model="text" input-class="text-right" class="q-ml-md">
                <template v-slot:append>
                    <q-icon v-if="text === ''" name="search" />
                    <q-icon v-else name="clear" class="cursor-pointer" @click="text = ''" />
                </template>
                </q-input>
            </q-toolbar>


            <q-item v-for="friend in getFriends" :key="friend" clickable v-ripple style="
                height: 80px;
                margin: auto;
                margin-bottom: 10px;
                margin-top: 10px;
                width:600px;
                opacity: 0.8;
                background: whitesmoke
              ">
                <q-item-section avatar>
                <q-avatar color="primary" text-color="white">
                    {{ friend.firstName.charAt(0).toUpperCase() }}

                </q-avatar>
                </q-item-section>

                <q-item-section avatar>
                 <q-btn
                    v-if="friend.loggedIn"
                    round
                    dense
                    unelevated
                    style="font-size: 6px !important; margin-left: 5px"
                    color="light-green-5"
                  />
                </q-item-section>

                <q-item-section>
                <q-item-label>{{ friend.firstName + " " + friend.lastName }}</q-item-label>

                </q-item-section>

                <q-item-section side>
                <!--TODO: on click, remove this friend -->
                <q-btn
                    icon="remove_circle_outline"
                    flat
                    dense
                    unelevated
                    style="font-size: 12px !important; margin-left: 5px"
                    color="red"
                    @click="removeFriend"
                  />
        </q-item-section>
      </q-item>


        </div>

        <div v-else class="inline justify-center shift no-wrap"
          style="display: flex; position: relative;">
        yeet
        </div>

    </div>
  </q-page>
</template>

<script>
import { mapState, mapActions, mapGetters } from "vuex";
export default {
  data() {
    return {
      tab: "friends",
    };
  },
  props: {

  },
  components: {

  },
  computed: {

    getFriends() {
        //TODO: call route to fetch friendships
      let friends = [{"username": "pat-liu", "firstName": "pat", "lastName": "liu", "confirmed": true, "loggedIn": true},
      {"username": "max-tsiang", "firstName": "max", "lastName": "tsiang", "confirmed": true, "loggedIn": false}];
      return friends;
    },

  },

  watch: {


  },
  mounted() {

  },
  beforeUnmount() {

  },
};
</script>

<style>
.q-tab__label {
    font-size: 18px !important
}
</style>