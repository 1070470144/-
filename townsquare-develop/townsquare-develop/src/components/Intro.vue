<template>
  <div class="intro">
    <img src="static/apple-icon.png" alt="" class="logo" />
    <div>
      {{ $t("intro.welcome") }}
      <b>{{ $t("intro.title") }}</b> {{ $t("intro.subtitle") }}!
      {{ $t("intro.addPlayers") }}
      <span class="button" @click="toggleMenu">
        <font-awesome-icon icon="cog" /> {{ $t("intro.menuButton") }}
      </span>
      {{ $t("intro.orPress") }} <b>[A]</b> {{ $t("intro.toAddPlayers") }}
      <b>[J]</b> {{ $t("intro.toJoinSession") }}<br />
      <div class="footer">
        {{ $t("intro.footer") }}
      </div>
    </div>
    <a
      class="redirect"
      v-if="language === 'zh-CN'"
      href="https://clocktower.gstonegames.com"
    >
      <img src="../assets/gstone.png" class="gstone" alt="" />
      {{ $t("intro.chineseVersion") }}
    </a>
  </div>
</template>

<script>
import { mapMutations } from "vuex";
import i18n from "../i18n";

export default {
  data() {
    return {
      language: window.navigator.userLanguage || window.navigator.language,
    };
  },
  methods: {
    ...mapMutations(["toggleMenu"]),
    $t(key, params = {}) {
      return i18n.t(key, params);
    },
  },
};
</script>

<style scoped lang="scss">
// Intro
.intro {
  text-align: center;
  width: 50%;
  font-size: 120%;
  position: absolute;
  padding: 10px;
  background: rgba(0, 0, 0, 0.5);
  border: 3px solid black;
  border-radius: 10px;
  z-index: 3;
  display: flex;
  justify-content: center;
  a {
    color: white;
  }
  a.redirect {
    display: block;
    text-decoration: none;
    position: absolute;
    top: 100%;
    margin-top: 2vh;
    padding: 10px;
    background: rgba(0, 0, 0, 0.5);
    border: 3px solid black;
    border-radius: 10px;

    &:hover {
      color: red;
    }
    img {
      width: 120px;
      display: block;
      margin: auto;
      margin-bottom: 1vh;
    }
  }

  img.logo {
    position: absolute;
    bottom: 100%;
    width: 25vh;
    margin-bottom: 2vh;
    max-width: 192px;
    border-radius: 50%;
    box-shadow: 0 0 10px black;
    border: 3px solid black;
  }
  .footer {
    font-size: 60%;
    opacity: 0.75;
  }
}
</style>
