<template>
  <router-view :key="$route.path" />
</template>
<script>
import { defineComponent } from "vue";

import axios from "axios";

axios.defaults.baseURL = "https://pennbook.app";

export default defineComponent({
  name: "App",
});
</script>
