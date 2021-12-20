<template>
  <q-page style="overflow-y: hidden">
    <div
      class="flex q-pa-md"
      style="
        width: 100%;
        display: flex;
        justify-content: center;
        margin: auto;
        margin-top: 30px;
        overflow-x: hidden;
      "
    >

         <div>
      <!--TODO: v-else -->
      <div>
        <q-bar dark class="bg-secondary text-white">
          <div class="col text-center text-weight-bold">
           Your Newsfeed!
          </div>
        </q-bar>
        <br />
        <br v-if="!this.isSelf" />
fasfa <!-- insert search bar here l8r-->

          <br />
          <br />

      </div>


      <q-list class="full-width">
        <div>
          <q-item
            class="columns large-3 medium-6"
            v-for="newsArticle in this.newsArticles"
            :key="newsArticle"
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
              <NewsArticle
                :articleUUID="newsArticle.articleUUID"
                :likes="newsArticle.likes"
                :category="newsArticle.category"
                :headline="newsArticle.headline"
                :authors="newsArticle.authors"
                :link="newsArticle.link"
                :shortDescription="newsArticle.shortDescription"
                :date="newsArticle.date"
                style="height: 100%; width: 100%; margin: auto"
              />
            </div>
          </q-item>
        </div>
      </q-list>
    </div>

    </div>
  </q-page>
</template>


<script>
//maybe pull up chats of matches here; in v-for, only load user if in liked array
//when message is sent is to other user, other user's 'read' should be switched to false (unless on current router. then still true). in same payload
import { mapState, mapGetters, mapActions } from "vuex";
import { Notify } from "quasar";
import axios from "axios";
export default {
  data() {
    return {
        newsArticles: [{"articleUUID": "abc123", "recUUID": "placeholder", "likes": 5, "category": "politics", "headline": "something politics", "authors": "dr. seuss", "link": "https://www.nytimes.com/2017/04/11/world/middleeast/russia-syria-chemical-weapons-white-house.html", "shortDescription": "this is a news caption", "date": "2011-10-05T14:48:00.000Z"}]
    };
  },

  props: {
    newsPosts: {
      type: Object,
      default: () => ({}),
    },
  },

  components: {
    NewsArticle: require("components/NewsArticle.vue").default,
  },

  computed: {},

  methods: {

  },

  mounted() {},
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
