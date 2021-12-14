<template>
 <q-page style="overflow-y: hidden">
  <div class="q-pa-md">

    <!-- main chat page -->
    <q-layout
      view="lHh Lpr lFf"
      container
      :style="
        $q.platform.is.mobile
          ? 'height: 85vh; margin-top: 3.5vh'
          : 'height: 86.5vh'
      "
      class="shadow-3 rounded-borders container"
    >
      <div
        ref="pageChat"
        id="pageChat"
        class="q-px-lg q-py-md"
        style="overflow-y: hidden; display: flex; flex-direction: column"
      >
        <q-header elevated style="overflow: hidden">
          <!-- #9CC937-->
          <q-toolbar>
            <q-btn
              icon="arrow_back"
              flat
              dense
              :label="
                $q.platform.is.mobile
                  ? ''
                  : this.chatMode == 'randomMatch'
                  ? 'Exit'
                  : 'Back'
              "
              style="float: left"
              @click="closeChat"
            />

            <!-- for regular chat -->
            <q-toolbar-title
              style="text-align: center;"
              :style="$q.platform.is.mobile ? 'font-size: 5vw' : ''"
            >
              {{users.join(' and ')}}'s Hangout
            </q-toolbar-title>

            <q-btn-dropdown flat round dense icon="add" @click="showOnlineFriends" label="Member">
                <q-list bordered separator>

                  <q-item v-for="friend in getOnlineFriends()" :key="friend" clickable @click="sendInvite(friend.username)">

                    <q-item-section avatar>
                      <q-avatar color="primary" text-color="white">
                          {{ friend.firstName.charAt(0).toUpperCase() + friend.lastName.charAt(0).toUpperCase()}}
                      </q-avatar>
                    </q-item-section>

                     <q-item-section avatar>
                      <q-btn
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

                  </q-item>

                </q-list>
            </q-btn-dropdown>

          </q-toolbar>
        </q-header>
      </div>
        <div
          class="q-pa-md column col justify-end"
          style="margin-bottom: 30px; margin-top: 30px"
        >
          <!--<q-btn
            v-if="showAllButton"
            @click="showAllMessages"
            color="secondary"
            label="Show All"
            style="margin-bottom: 30px; margin-top: -10px"
          />-->
          <!-- Write mode -->
          <div>
             <q-chat-message
              class="chatSize"
              style="font-size: 16px; color: black"
              v-for="(message, key) in messages"
              :label="message.from == 'conversationStarter' ? '💬 ' + message.text  : messageDate(message.timestamp)"
              :key="key"
              :sent="message.from == userOrder ? true : false"
              :bg-color="
                message.from == userOrder ? 'whitesmoke' : 'light-green-3'
              "
              :stamp="message.timestamp ? messageTime(message.timestamp) : ''"
            >
            </q-chat-message>
          </div>

        <q-card id="anchor" style="height: 0px"></q-card>

        <q-footer elevated style="padding: 10px">
          <!-- #9cc937 -->
          <!--</q-toolbar>-->

          <q-form @keyup:enter="sendMessage" class="full-width">
            <q-input
              @input="nowTyping"
              v-model="newMessage"
              ref="newMessage"
              bg-color="white"
              outlined
              rounded
              label="Message"
              dense
            >

              <template v-slot:after>
                <q-btn
                v-show="newMessage"
                  @click="sendMessage"
                  round
                  dense
                  flat
                  type="submit"
                  color="white"
                  icon="send"
                />
              </template>
            </q-input>
          </q-form>
        </q-footer>
      </div>
    </q-layout>
  </div>
 </q-page>
</template>



<script>
import { mapState, mapActions, mapGetters } from "vuex";
export default {
  data() {
    return {
      drawerWidth: 600,
      bannerWidth: "65%",
      footerWidth: "64.3%",
      right: false,
      icon: "chevron_right",
      newMessage: "",
      buttonShow: false,
      userOrder: "",
      popupMode: "",
      name: "",
      users: []
    };
  },

  props: {
    otherId: String,
  },

  components: {

  },

  computed: {

  },

  methods: {

    sendMessage() {
      if (this.newMessage.replace(/\s/g, "") != "") {
        // copy newMessage to local variable so that it can be
        // cleared (and '... is typing' removed) before the message is sent
        let messageContent = this.newMessage;

        this.clearMessage();

        let date = Date.parse(new Date()).toString();

      }
    },

    showAllMessages() {
      this.loadAllMessages(this.otherId);
      this.showAllButton = false;
    },

    clearMessage() {
      this.newMessage = "";
      this.$refs.newMessage.focus();
    },

    scrollToEnd() {
      document.getElementById("anchor").scrollIntoView();
    },

    closeChat() {
       console.log('eh??')
       this.$router.push('/friends')
    },

    getOnlineFriends() {

      //TODO: return array of online friends (call route)
      return [
        {
          username: "pat-liu",
          firstName: "pat",
          lastName: "liu",
          confirmed: true,
          loggedIn: true,
        },
        {
          username: "online-user",
          firstName: "online",
          lastName: "user",
          confirmed: true,
          loggedIn: true,
        },
      ];
    },

   sendInvite(username){
      //invite user with username to same chatUUID
    }

  },

  watch: {
    messages() {

    },

  },

  mounted() {

    if (screen.width < 766) {
      this.drawerWidth = screen.width;
      this.buttonShow = true;
    } else if (screen.width > 766 && screen.width < 1024) {
      this.drawerWidth = 0.7 * screen.width;
      this.buttonShow = true;
    }

  },

  created() {
    let currentPath = this.$route.fullPath;
    let subdomains = currentPath.split('/');
    let chatUUID = subdomains[subdomains.length-1]

    //TODO: set chatUUID field and load all messages (route call)
    //get involved users and set users variable
  },

  beforeDestroy() {
    // chatbox is closing because of moving to different tab
    if (this.chatTab == "chat") {
      this.setChatTab("");
    }
  }
};
</script>



<style>
@media (min-width: 0px) and (max-width: 1026px) {
  .chatSize {
    font-size: 14px !important;
  }

  .container {
    height: 86vh !important;
    width: 105% !important;
    margin-left: -8px !important;
  }

  .cardChat {
    margin-top: 50px !important;
  }
}
</style>
