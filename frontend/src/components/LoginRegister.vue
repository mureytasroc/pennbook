<template>
  <q-form @submit="submitForm(formData)">
    <q-input
      v-if="tab == 'register'"
      v-model="formData.firstName"
      class="q-mb-md"
      outlined
      label="First Name"
      lazy-rules
    />

    <q-input
      v-if="tab == 'register'"
      v-model="formData.lastName"
      class="q-mb-md"
      outlined
      label="Last Name"
      lazy-rules
    />

    <q-input
      v-if="tab == 'register'"
      v-model="formData.emailAddress"
      class="q-mb-md"
      outlined
      type="email"
      standout
      label="Email"
      lazy-rules
    >
      <template v-slot:prepend>
        <q-icon name="mail" />
      </template>
    </q-input>

    <q-select
      outlined
      v-if="tab == 'register'"
      v-model="formData.affiliation"
      :options="options"
      label="Affiliation"
    />
    <br />
    <q-input
      v-if="tab == 'register'"
      class="q-mb-md"
      outlined
      type="date"
      hint="Birthday"
      lazy-rules
    >
    </q-input>

    <br />

    <q-input
      v-model="formData.username"
      class="q-mb-md"
      outlined
      label="Username"
      lazy-rules
    />

    <q-input
      v-model="formData.password"
      class="q-mb-md"
      outlined
      type="password"
      label="Password"
      :rules="[
        (val) =>
          (val.length >= 8 && val.toLowerCase() != 'password') ||
          'Please enter at least 8 characters!',
      ]"
      lazy-rules
    >
    </q-input>

    <q-input
      v-if="tab == 'register'"
      v-model="confirmPassword"
      class="q-mb-md"
      outlined
      type="password"
      label="Confirm Password"
      :rules="[
        (val) => val == formData.password || 'You passwords do not match!',
      ]"
      lazy-rules
    />

    <div class="row">
      <q-btn
        v-if="tab == 'register'"
        color="primary"
        icon="help"
        @click="alert = true"
      />

      <q-space />
      <q-btn
        class="authButton"
        color="primary"
        type="submit"
        :label="tab"
        @click="test"
      >
        <q-popup-proxy>
          <q-banner>
            {{ this.message }}
          </q-banner>
        </q-popup-proxy>
      </q-btn>
    </div>
  </q-form>
</template>

<script>
import { mapActions } from "vuex";
import axios from "axios";

export default {
  props: ["tab"],

  data() {
    return {
      formData: {
        emailAddress: "",
        username: "",
        password: "",
        firstName: "",
        lastName: "",
        affiliation: "",
        interests: "religion",
      },
      options: [],
      confirmPassword: "",
      message: "Please fill out the form entirely!",
      alert: false,
    };
  },

  methods: {
    async submitForm(formData) {
      if (this.tab === "login") {
        // login tab
        this.message = "Logging in...";
        axios
          .post("/api/users/" + formData.username + "/login/", {
            password: formData.password,
          })
          .then((resp) => {
            if (resp.status == 200) {
              // login ok
              localStorage.jwt = resp.data.token;
              localStorage.setItem("userInfo", JSON.stringify(resp.data));
              this.message = "Logged in!";
              this.$router.push("/");
            }
          })
          .catch((err) => {
            if (err.response) {
              this.message = err.response.data.message;
            }
          });
      } else {
        // registration tab
        this.message = "Registering...";
        axios
          .post("/api/users", JSON.parse(JSON.stringify(formData)))
          .then((resp) => {
            if (resp.status == 201) {
              // created
              localStorage.jwt = resp.data.token;
              localStorage.setItem("userInfo", JSON.stringify(resp.data));
              this.message = "Account registered!";
              this.$router.push("/");
            }
          })
          .catch((err) => {
            if (err.response) {
              this.message = err.response.data.message;
            }
          });
      }
    },
  },

  mounted() {
    // list affiliations
    axios
      .get("/api/users/affiliations/")
      .then((resp) => {
        if (resp.status == 200) {
          this.options = resp.data;
        }
      })
      .catch((err) => {
        console.log(err);
      });
  },
};
</script>
