<template>
  <router-view />
</template>
<script>
import { defineComponent } from "vue";

import axios from "axios";

axios.defaults.baseURL = "https://pennbook.app";

export default defineComponent({
  name: "App",
});
</script>
