<template>
  <q-layout view="lHh LpR lFf">
    <div
      style="overflow: hidden"
      id="dayContainer"
    ></div>
    <!-- if desktop and day -->

    <!-- if desktop and night-->

    <!-- if on mobile -->
    <!-- header -->
    <q-header
      v-if="!$q.platform.is.mobile || chatTab == ''"
      reveal
      style="background: #b094cfff"
    >
      <!-- #b094cfff-->
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

        <!--          <q-avatar>-->
        <!--            <img src="https://cdn.quasar.dev/logo/svg/quasar-logo.svg">-->
        <!--          </q-avatar>-->

        <q-toolbar-title
          :style="
            $q.platform.is.mobile
              ? 'margin-top: 5px; height:60px'
              : 'padding-top:5px;height:94px'
          "
        >
          <!-- <a
                href="https://discord.gg/xsj4krfSpV"
                target="_blank"
              >
          <img v-if="!$q.platform.is.mobile"
            class="logoToolbar"
            src="/disclanding.png"
            style="
              height: 8vh;
              width: auto;
              margin: auto;
              margin-top: 5px;
              float:right;
              margin-right:10px;
              border-radius:100%;
              border: 2px solid white
            "
          /></a> -->

          <img
            class="logoToolbar"
            src="/whitelogo.png"
            style="height: 5vh; width: auto; margin: auto; margin-top: 10px"
            :style="
              $q.platform.is.mobile ? 'margin-left: -10px !important' : ''
            "
          />
          <q-btn
            @click="switchIns"
            style="margin-top: -20px; margin-left: 20px; background: #9cc937"
            :style="$q.platform.is.mobile ? 'height: 60%' : 'padding-top:15px;'"
            no-caps
          >
            <!--v-if="$router.currentRoute.fullPath.includes('/matching')"-->
            <div style="text-align: center; margin: auto">
              <p
                class="allInsBtn"
                style="
                  display: inline-block;
                  color: white;
                  opacity: 0.8;
                  margin: auto;
                "
                :style="
                  $q.platform.is.mobile ? 'font-size: 15px' : 'font-size: 40px'
                "
              >
                @ {{ interschool ? "Universe" : this.userIns }}
              </p>
            </div>
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
            {{ $router.currentRoute.fullPath.replace("/", "") }}
          </p>
        </q-toolbar-title>

      </q-toolbar>
    </q-header>

    <!-- navbar -->
    <q-drawer
      class="left-navigation text-white"
      show-if-above
      v-model="left"
      style="background: #e46c34"
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
          @click="$router.push({ name: 'profile' }).catch((err) => {})"
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
            $route.name == 'matching'
              ? 'border:1px solid white; border-radius: 10px'
              : ''
          "
          active-class="tab-active"
          @click="handlePush('matching')"
          exact
          class="q-ma-sm"
          clickable
          :focused="this.matchFocus"
          v-ripple
        >
          <q-item-section avatar>
            <q-icon style="color: white" name="swap_horizontal_circle" />
          </q-item-section>

          <q-item-section style="color: white">Matching</q-item-section>
        </q-item>

        <!-- messages btn -->
        <q-item
          :style="
            $route.name == 'messages'
              ? 'border:1px solid white; border-radius: 10px'
              : ''
          "
          active-class="tab-active"
          @click="handlePush('messages')"
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

        <!-- rewards btn -->
        <q-item
          :style="
            $route.name == 'rewards'
              ? 'border:1px solid white; border-radius: 10px'
              : ''
          "
          active-class="tab-active"
          @click="$router.push({ name: 'rewards' }).catch((err) => {})"
          class="q-ma-sm"
          clickable
          :focused="this.messageFocus"
          v-ripple
        >
          <q-item-section avatar>
            <q-icon style="color: white" name="redeem" />
          </q-item-section>

          <q-item-section style="color: white"> Rewards </q-item-section>
        </q-item>

        <q-item
          active-class="tab-active"
          class="q-ma-sm"
          clickable
          :focused="this.messageFocus"
          v-ripple
          style="background: #9cc937"
          @click="showReferralPopup = true"
        >
          <q-item-section avatar>
            <q-icon style="color: white" name="emoji_events" />
          </q-item-section>

          <q-item-section style="color: white">
            Get Free Merch!
          </q-item-section>

          <q-dialog v-model="showReferralPopup">
            <ReferralRewards />
          </q-dialog>
        </q-item>

        <!-- custom filters btn -->

        <!-- <q-item
          active-class="tab-active"
          class="q-ma-sm"
          clickable
          v-ripple
          :disable="$route.name != 'matching'"
          @click="filterPopup = true">

          <q-item-section avatar>
            <q-icon style="color: white" name="search" />
          </q-item-section>

          <q-item-section style="color: white" avatar>
            Customize Filters
          </q-item-section>
        </q-item>  -->
      </q-list>

      <!--Advertisements@ on navbar -->
      <q-item class="fixed-middle" id="ads">
        <div style="text-align: center; margin: auto; margin-top: 10vh">
          <a href="https://discord.gg/xsj4krfSpV" target="_blank">
            <img
              class="logoToolbar"
              src="/disclanding.png"
              style="height: 6vh !important; width: auto; margin: auto"
            />
          </a>
          <div
            style="text-align: center; color: white"
            :style="
              $q.platform.is.mobile ? 'font-size:1.2rem' : 'font-size: 1.5rem'
            "
          >
            Join our Discord community!
          </div>

          <UMDLOM
            v-if="this.userIns == 'umd'"
            style="margin-top: 50px !important"
          />
          <DREXELDISC
            v-else-if="this.userIns == 'drexel'"
            style="margin-top: 50px"
          />
        </div>
      </q-item>
      <!-- lower toolbar section (contact, suggestion, logout) -->

      <q-list padding class="fixed-bottom">
        <div style="margin-bottom: 5%">
          <!-- Settings -->
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
        </div>

        <!-- logout (slightly below the previous two) -->
        <q-item
          background="color:#972ed9"
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

//day: animated.png
//night: newnight.gif
</script>


<style>
#dayContainer {
  position: absolute;
  width: 100%;
  height: 100%;
  background: url(/Bgs/animated.png);
  background-repeat: no-repeat;
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
  background: url(/Bgs/newnight.gif);
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
    background: url(/animated.png) no-repeat center center fixed;

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
  background-color: #b094cfff; /* #b094cfff; */
}
.navigation-item {
  border-radius: 5px;
}
.tab-active {
  background-color: #db7093;
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