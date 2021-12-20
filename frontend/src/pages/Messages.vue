<!--q-item list over chatUUIDs: display names of users in chat -->
<template>
  <q-page style="overflow-y: hidden">
    <div style="margin-top: 2%">
      <q-item
        v-for="chat in this.chats"
        :key="chat"
        clickable
        @click="visitChat(chat)"
        v-ripple
        style="
          height: 80px;
          margin: auto;
          margin-bottom: 10px;
          width: 600px;
          opacity: 0.8;
          background: whitesmoke;
        "
      >
        <q-btn flat>
          <!--loop over members of chat / join by comma -->
          <q-item-section avatar>
            <q-avatar color="primary" text-color="white">
              {{ chat.chatName.charAt(0).toUpperCase() }}
            </q-avatar>
          </q-item-section>
        </q-btn>

        <!--<q-item-section avatar>
            <q-btn
              v-if="friend.loggedIn"
              round
              dense
              unelevated
              style="font-size: 6px !important; margin-left: 5px"
              color="light-green-5"
            />
          </q-item-section>-->

        <q-item-section>
          <q-item-label>{{ chat.chatName }}</q-item-label>
        </q-item-section>

        <q-item-section side>
          <!--TODO: on click, remove this friend -->
          <q-btn
            style="margin-right: 20px"
            dense
            round
            icon="textsms"
            color="light-green-6"
            @click="showChat(chat.chatUUID)"
          />
        </q-item-section>
      </q-item>
    </div>
  </q-page>
</template>

<script>
import { mapState, mapActions, mapGetters } from "vuex";
import axios from "axios";
export default {
  data() {
    return {
      chats: [],
    };
  },
  props: {},
  components: {},

  watch: {},
  mounted() {
    this.getChats();
  },
  methods: {
    getChats() {
      //make route call (list chats by user) and set chats
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      axios
        .get("/api/users/" + userInfo.username + "/chats/", {
          headers: { Authorization: `Bearer ${localStorage.jwt}` },
        })
        .then((resp) => {
          console.log(resp);
          if (resp.status == 200) {
            // ok
            this.chats = resp.data;
          }
        })
        .catch((err) => {
          if (err.response) {
            alert(err.response.data.message);
          }
        });
    },

    visitChat(chatInfo) {
      // this.$router.push("/chat/" + chatUUID);

      this.$router.push({ name: "chat", params: { ...chatInfo } });
    },
  },
  beforeUnmount() {},
};
</script>
