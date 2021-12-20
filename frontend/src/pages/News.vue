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
        <div
          class="inline justify-center shift no-wrap"
          style="display: flex; position: relative; margin-top: 2%"
        >
          <q-toolbar
            class="bg-primary text-white rounded-borders"
            style="width: 100%"
          >
            <h7 class="gt-xs"> Search News! </h7>

            <q-space />

            <q-input
              dark
              dense
              standout
              v-model="searchNewsQuery"
              input-class="text-right"
              class="q-ml-md"
            >
              <template v-slot:append>
                <q-icon v-if="text === ''" name="search" />
                <q-icon
                  v-else
                  name="clear"
                  class="cursor-pointer"
                  @click="text = ''"
                />
              </template>
            </q-input>
          </q-toolbar>

          <q-btn
            v-if="searchNewsQuery"
            icon="search"
            style="margin-left: 20px"
            color="secondary"
            @click="searchNews"
          />
        </div>
        <br /><br />
        <!--TODO: v-else -->
        <div>
          <q-bar dark class="bg-secondary text-white">
            <div class="col text-center text-weight-bold">Your Newsfeed!</div>
          </q-bar>
          <br />
        </div>

        <div v-if="this.loadingNews" style="margin-top: 300px">
          <span class="absolute-center" style="text-align: center">
            <q-spinner color="primary" size="3em" :thickness="2" />
            <p style="font-size: 20px; color: grey">Loading your news...</p>
          </span>
        </div>

        <div v-else>
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
      newsArticles: [],
      searchNewsQuery: "",
      loadingNews: false,
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
    searchNews() {
      this.loadingNews = true;
      axios
        .get("/api/news/articles", {
          params: { q: this.searchNewsQuery },
          headers: { Authorization: `Bearer ${localStorage.jwt}` },
        })
        .then((resp) => {
          if (resp.status == 200) {
            // ok
            console.log(resp.data);
            this.newsArticles = resp.data;
            this.loadingNews = false;
          }
        })
        .catch((err) => {
          if (err.response) {
            console.log(err.response);
            if (err.response.status == 401) {
              localStorage.clear();
              this.$router.push("/login");
            } else {
              alert(err.response.data.message);
              this.loadingNews = false;
            }
          }
        });
    },
    getNews() {
      // get recommended articles
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      this.loadingNews = true;
      axios
        .get(
          "/api/users/" + userInfo.username + "/recommended-articles/",

          {
            headers: { Authorization: `Bearer ${localStorage.jwt}` },
          }
        )
        .then((resp) => {
          if (resp.status == 200) {
            this.newsArticles = resp.data;
            this.loadingNews = false;
          }
        })
        .catch((err) => {
          if (err.response) {
            if (err.response.status == 401) {
              localStorage.clear();
              this.$router.push("/login");
            } else {
              alert(err.response.data.message);
              this.loadingNews = false;
            }
          }
        });
    },
  },

  mounted() {
    this.getNews();
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
