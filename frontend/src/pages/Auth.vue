<template>
  <q-layout>
    <div id="login-background"></div>
    <q-page-container>
      <q-page
        v-if="!this.loadingAnimation"
        class="q-pa-md column"
        style="width: 100% !important; text-align: center"
      >

        <div class="col-2"> <br/><br/></div>

        <q-card
          class="cardWidthLogin col-sm-9"
          :class="$q.platform.is.mobile ? 'fixed-center' : ''"
          :style="$q.platform.is.mobile ? '' : 'margin-top: 50px;'"
          style="width: 60%; margin-left: auto; margin-right: auto;"
        >
          <img
            class="logoLogin"
            src="/logo.png"
            style="
              height: 170px;
              width: auto;
              margin: auto;
              margin-top: 10px;
              margin-bottom: 20px;
            "
          />
          <div v-if="!this.reset">
            <q-tabs
              v-model="tab"
              dense
              reveal
              class="text-grey"
              active-color="primary"
              indicator-color="primary"
              align="justify"
              narrow-indicator
            >
              <q-tab name="login" label="Login" />
              <q-tab name="register" label="Register" />
            </q-tabs>

            <q-separator />

            <q-tab-panels v-model="tab" animated>
              <q-tab-panel name="login">
                <login-register :tab="tab" @clicked="trigger" />
              </q-tab-panel>
              <q-tab-panel name="register">
                <login-register :tab="tab" />
              </q-tab-panel>
            </q-tab-panels>
          </div>

        </q-card>

      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script>
import { mapGetters } from "vuex";
export default {
  data() {
    return {
      alert: false,
      tab: "register",
      reset: false,
    };
  },
  components: {
    "login-register": require("components/LoginRegister.vue").default,
    /*"surfing-animation": require("components/SurfingAnimation.vue").default,
    "reset-pass": require("components/ResetPasswordEmail.vue").default,*/
  },
  computed: {
    //...mapGetters("auth", ["loadingAnimation"]),
  },
  methods: {
    trigger(value) {
      this.reset = value;
    },
  },
  beforeMount() {
    if (this.$route.params.tab) {
      this.tab = this.$route.params.tab;
    }
  },
  mounted() {

  },
};
</script>

<style scoped>
.fab,
.fas,
.far {
  color: white;
}
@media (min-width: 0px) and (max-width: 1023px) {
  .cardWidthLogin {
    width: 100% !important;
  }
  .surprised {
    height: 190px !important;
    margin-top: -10px !important;
  }
  .excited {
    font-size: 1.5rem !important;
  }
  .instructions {
    font-size: 0.8rem !important;
  }
  .btnPadding {
    padding: 5px !important;
  }
  .paragraph {
    font-size: 1rem !important;
  }
  .text-caption {
    font-size: 0.6rem !important;
  }
  .logoLogin {
    height: 100px !important;
    width: auto !important;
  }
}
#login-background {
  position: absolute;
  width: 100%;
  height: 100%;
  /*background: url(/Bgs/treesclouds.png), linear-gradient(360deg, #ffffff 15%, #e4cbffff 95%);*/
  background-repeat: no-repeat;
  background-size: cover;
  background-position: 50% 50%;
}

.text-caption {
  font-size: 1.1rem;
}

.login-form {
  position: absolute;
}

@media (min-width: 0px) and (max-width: 350px) {
  .q-btn {
    font-size: 12px;
  }

  .q-tab__label {
    font-size: 3vw;
    line-height: 1.715em;
    font-weight: 500;
  }

  .logoLogin {
    height: 70px !important;
  }
}
</style>
