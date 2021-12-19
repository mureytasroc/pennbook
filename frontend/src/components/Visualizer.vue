<template>
  <div id="container">
    <div id="center-container">
      <div id="infovis"></div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {};
  },
  mounted() {
    let jQuery = document.createElement("script");
    jQuery.setAttribute(
      "src",
      "//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"
    );
    document.head.appendChild(jQuery);

    let jitScript = document.createElement("script");
    jitScript.setAttribute("src", "../js/jit.js");
    document.head.appendChild(jitScript);

    let visualizerScript = document.createElement("script");
    visualizerScript.setAttribute("src", "../js/friendvisualizer.js");
    document.head.appendChild(visualizerScript);
  },
};
</script>

<style>
@import "../css/visualizer.css";
</style>
