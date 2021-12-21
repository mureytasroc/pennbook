<template>
  <q-page style="overflow-y: hidden">
    <div
      class="column items-center"
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
                <q-icon v-if="this.searchNewsQuery === ''" name="search" />
                <q-icon
                  v-else
                  name="clear"
                  class="cursor-pointer"
                  @click="this.searchNewsQuery = ''"
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
          <q-infinite-scroll @load="onLoad">
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
                    <q-img :src="this.adLink.url" />

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
            <template v-slot:loading>
              <div class="row justify-center q-my-md">
                <q-spinner-dots color="primary" size="40px" />
              </div>
            </template>
          </q-infinite-scroll>
        </div>
      </div>
    </div>

    <div
      class="column self-end"
      style="
        width: 100%;
        display: flex;
        justify-content: center;
        margin: auto;
        overflow-x: hidden;
      "
    ></div>
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
      adLink: "",
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
          params: { q: encodeURIComponent(this.searchNewsQuery) },
          headers: { Authorization: `Bearer ${localStorage.jwt}` },
        })
        .then((resp) => {
          if (resp.status == 200) {
            // ok
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

    getAdLink() {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      this.loadingNews = true;
      axios
        .get(
          "/api/ad/" + userInfo.username,

          {
            headers: { Authorization: `Bearer ${localStorage.jwt}` },
          }
        )
        .then((resp) => {
          if (resp.status == 200) {
            this.adLink = resp.data;
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
    onLoad(index, done) {
      if (this.newsArticles.length == 0) {
        done();
        return;
      }
      console.log("FIRED");

      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      if (searchNewsQuery === "") {
        axios
          .get(
            "/api/users/" + userInfo.username + "/recommended-articles/",

            {
              params: {
                page: this.newsArticles[this.newsArticles.length - 1].recUUID,
              },
              headers: { Authorization: `Bearer ${localStorage.jwt}` },
            }
          )
          .then((resp) => {
            if (resp.status == 200) {
              if (resp.data.length == 0) {
                // reached end
                done(true);
              } else {
                this.newsArticles.push(...resp.data);
                done();
              }
            }
          })
          .catch((err) => {
            if (err.response) {
              if (err.response.status == 401) {
                localStorage.clear();
                this.$router.push("/login");
              } else {
                alert(err.response.data.message);
                done(true);
              }
            }
          });
      } else {
        axios
          .get("/api/news/articles", {
            params: {
              q: encodeURIComponent(this.searchNewsQuery),
              page: this.newsArticles[this.newsArticles.length - 1].articleUUID,
            },
            headers: { Authorization: `Bearer ${localStorage.jwt}` },
          })

          .then((resp) => {
            if (resp.status == 200) {
              if (resp.data.length == 0) {
                // reached end
                done(true);
              } else {
                this.newsArticles.push(...resp.data);
                done();
              }
            }
          })
          .catch((err) => {
            if (err.response) {
              if (err.response.status == 401) {
                localStorage.clear();
                this.$router.push("/login");
              } else {
                alert(err.response.data.message);
                done(true);
              }
            }
          });
      }
    },
  },

  beforeMount() {
    this.getNews();
    this.getAdLink();
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
