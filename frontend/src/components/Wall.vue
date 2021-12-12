<template>

    <div
      class="flex q-pa-md"
      style="width: 100%;display: flex; justify-content: center; margin: auto;margin-top:30px; overflow-x: hidden"
    >

      <!-- wall-->

      <div> <!--TODO: v-else -->
        <div>

        </div>
        <q-list class="full-width">
          <div>
           <q-item
              v-for="post in this.wallPosts"
              :key="post.postUUID"
              clickable
              v-ripple

              style="
                margin: auto;
                margin-bottom: 10px;
                margin-top: 10px;
                opacity: 0.8;
              "
            >

            <div>
                <StatusPost
                    :postUUID="post.postUUID"
                    :firstName="post.creator.firstName"
                    :lastName="post.creator.lastName"
                    :content="post.content"
                    style="height: 100%;width: 100%; margin:auto"
                />
            </div>

            </q-item>
          </div>
        </q-list>

      </div>
    </div>
</template>


<script>
//maybe pull up chats of matches here; in v-for, only load user if in liked array
//when message is sent is to other user, other user's 'read' should be switched to false (unless on current router. then still true). in same payload
import { mapState, mapGetters, mapActions } from "vuex";
import { Notify } from "quasar";
export default {
  data() {
    return {

    };
  },

  props: {
    wallPosts: {
      type: Object,
      default: () => ({}),
    },
  },

  components: {
    StatusPost: require("components/StatusPost.vue").default,
  },

  computed: {

  },


  methods: {


  },


  mounted() {

  },
};
</script>



<style>
#background {
  position: absolute;
  width: 100%;
  height: 100%;
  background: linear-gradient(0deg, #ffffff 5%, #e4cbffff 95%);
  background-repeat: no-repeat;
  background-size: cover;
}

@media (min-width: 320px) and (max-height: 570px) {
  #nameFont {
    font-size: 13px !important;
  }
  #previewFont {
    font-size: 10px !important;
  }

  #randomBtnFont {
    font-size: 9.5px !important;
  }
}
/* Galaxy Note 3/S9  */
@media (min-width: 360px) and (max-width: 400px) {
  #nameFont {
    font-size: 15px !important;
  }
  #previewFont {
    font-size: 12px !important;
  }

  #randomBtnFont {
    font-size: 11px !important;
  }
}

@media (min-width: 410px) and (max-width: 450px) {
  #nameFont {
    font-size: 16px !important;
  }
  #previewFont {
    font-size: 13px !important;
  }

  #randomBtnFont {
    font-size: 13px !important;
  }
}

/* @media (max-width: 400px) {
  #randomBtnFont {
    font-size: 11px !important;
  }
} */
</style>