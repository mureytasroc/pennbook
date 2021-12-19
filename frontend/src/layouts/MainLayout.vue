<template>
  <q-layout view="lHh LpR lFf">
    <div style="overflow: hidden" id="dayContainer"></div>

    <q-header
      v-if="!$q.platform.is.mobile || chatTab == ''"
      reveal
      style="background: #990000"
    >
      <q-toolbar>
        <q-btn
          @click="left = !left"
          flat
          round
          dense
          style="color: white"
          icon="menu"
          class="q-mr-sm"
        />

        <q-toolbar-title
          :style="
            $q.platform.is.mobile
              ? 'margin-top: 5px; height:64px;'
              : 'padding-top:5px;height:98px'
          "
        >
          <q-btn to="/homepage" flat>
            <img
              class="logoToolbar"
              src="/logotransparent.png"
              style="height: 8vh; width: auto; margin: auto; margin-top: 5px"
              :style="
                $q.platform.is.mobile ? 'margin-left: -10px !important' : ''
              "
            />
          </q-btn>

          <p
            style="
              font-size: 20px;
              display: inline-block;
              float: right;
              margin-right: 2.5%;
              margin-top: 2vh;
              color: white;
              opacity: 0.4;
            "
          >
            <!--{{ $router.currentRoute.fullPath.replace("/", "") }}-->
          </p>
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <!-- navbar -->
    <q-drawer
      class="left-navigation text-white"
      show-if-above
      v-model="left"
      side="left"
      elevated
    >
      <q-list padding>
        <!-- profile btn -->
        <q-item
          :style="
            $route.name == 'profile'
              ? 'border:1px solid white; border-radius: 10px'
              : ''
          "
          active-class="tab-active"
          to="/profile"
          exact
          class="q-ma-sm"
          clickable
          v-ripple
        >
          <q-item-section avatar>
            <q-icon style="color: white" name="person" />
          </q-item-section>

          <q-item-section style="color: white">Profile</q-item-section>
        </q-item>

        <!-- matching btn -->
        <q-item
          :style="
            $route.name == 'friends'
              ? 'border:1px solid white; border-radius: 10px'
              : ''
          "
          active-class="tab-active"
          to="/friends"
          exact
          class="q-ma-sm"
          clickable
          :focused="this.matchFocus"
          v-ripple
        >
          <q-item-section avatar>
            <q-icon style="color: white" name="swap_horizontal_circle" />
          </q-item-section>

          <q-item-section style="color: white">Friends</q-item-section>
        </q-item>

        <!-- messages btn -->
        <q-item
          :style="
            $route.name == 'messages'
              ? 'border:1px solid white; border-radius: 10px'
              : ''
          "
          active-class="tab-active"
          to="/chats"
          class="q-ma-sm"
          clickable
          :focused="this.messageFocus"
          v-ripple
        >
          <q-item-section avatar>
            <q-icon style="color: white" name="message" />
          </q-item-section>

          <q-item-section v-if="!this.displayNotification" style="color: white"
            >Messages</q-item-section
          >

          <q-item-section v-else>
            <span>
              Messages
              <q-spinner-rings color="green" size="2.5em" />
            </span>
          </q-item-section>
        </q-item>
      </q-list>

      <!-- lower toolbar section (contact, suggestion, logout) -->

      <q-list padding class="fixed-bottom">
        <!--<div style="margin-bottom: 5%">
          <q-item
            active-class="tab-active"
            class="q-ma-sm"
            clickable
            v-ripple
            @click="settingsPopup = true"
          >
            <q-item-section avatar>
              <q-icon style="color: white" name="settings" />
            </q-item-section>

            <q-item-section style="color: white">Settings</q-item-section>

            <q-dialog v-model="settingsPopup">
              <SettingsPopup @clicked="closePopup" />
            </q-dialog>
          </q-item>
        </div>-->

        <!-- logout (slightly below the previous two) -->
        <q-item
          active-class="tab-active"
          @click="logout()"
          class="q-ma-sm"
          clickable
          v-ripple
        >
          <q-item-section avatar>
            <q-icon style="color: white" name="exit_to_app" />
          </q-item-section>

          <q-item-section style="color: white">Logout</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <q-page class="row no-wrap">
        <div class="col">
          <div class="full-height">
            <router-view />
          </div>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script>
export default {
  data() {
    return {
      left: false,
    };
  },
  methods: {
    logout() {
      localStorage.clear();
      this.$router.push("/login");
    },
  },
};

//day: animated.png
//night: newnight.gif
</script>

<style>
#dayContainer {
  position: absolute;
  width: 100%;
  height: 100%;
  /*background-repeat: no-repeat;*/
  background-size: cover;
  background-position: 50% 50%;
  min-height: 100vh;
  overflow-y: scroll;
  background-attachment: fixed;
}

#nightContainer {
  position: absolute;
  width: 100%;
  height: 100%;
  /*background: url(/Bgs/newnight.gif);*/
  background-repeat: no-repeat;
  background-size: cover;
  background-position: 50% 50%;
  min-height: 100vh;
  overflow-y: scroll;
  background-attachment: fixed;
}

@media (min-width: 0px) and (max-width: 1023px) {
  .pearMatch {
    height: 220px !important;
  }
  .pearText {
    font-size: 1.5rem !important;
  }
  .pearTextSub {
    font-size: 1rem !important;
  }

  #mainBackground {
    position: absolute;
    width: 100%;
    height: 100%;
    background: url(/Bgs/animated.png); /*#e4cbffff*/
    background-repeat: no-repeat;
    background-size: cover;
  }

  .bg-image {
    -webkit-background-size: cover;
    -moz-background-size: cover;
    -o-background-size: cover;
    background-size: cover;
  }
  .logoToolbar {
    height: 4vh !important;
    margin-left: 0px !important;
    margin-bottom: 5px !important;
  }
}
.q-drawer {
  background-size: cover !important;
  border: 2 px solid black;
}
.q-drawer__content {
  background-color: #011f5b;
}
.navigation-item {
  border-radius: 5px;
}
.tab-active {
  background-color: black;
}
body {
  background: white !important;
}
/* iphone 5 specific */
@media (min-width: 320px) and (max-height: 568px) {
  #ads {
    margin-top: -30px;
  }
  .allInsBtn {
    font-size: 10.5px !important;
  }
}
</style>
