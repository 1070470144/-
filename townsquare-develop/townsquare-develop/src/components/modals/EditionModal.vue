<template>
  <Modal class="editions" v-if="modals.edition" @close="toggleModal('edition')">
    <div v-if="!isCustom">
      <h3>Select an edition:</h3>
      <ul class="editions">
        <li
          v-for="edition in editions"
          class="edition"
          :class="['edition-' + edition.id]"
          :style="{
            backgroundImage: `url(${require(
              '../../assets/editions/' + edition.id + '.png',
            )})`,
          }"
          :key="edition.id"
          @click="setEdition(edition)"
        >
          {{ edition.name }}
        </li>
        <li
          class="edition edition-custom"
          @click="isCustom = true"
          :style="{
            backgroundImage: `url(${require('../../assets/editions/custom.png')})`,
          }"
        >
          {{ $t("edition.customScript") }}
        </li>
      </ul>
    </div>
    <div class="custom" v-else>
      <h3>{{ $t("edition.loadCustomScript") }}</h3>
      {{ $t("edition.customScriptDescription") }}
      <a href="https://script.bloodontheclocktower.com/" target="_blank"
        >Script Tool</a
      >
      <br />
      <br />
      {{ $t("edition.customCharactersDescription") }}
      <a
        href="https://github.com/bra1n/townsquare#custom-characters"
        target="_blank"
        >the documentation</a
      >
      <b>{{ $t("edition.onlyLoadTrusted") }}</b>
      <h3>{{ $t("edition.popularScripts") }}</h3>
      <ul class="scripts">
        <li
          v-for="(script, index) in scripts"
          :key="index"
          @click="handleURL(script[1])"
        >
          {{ script[0] }}
        </li>
      </ul>
      <input
        type="file"
        ref="upload"
        accept="application/json"
        @change="handleUpload"
      />
      <div class="button-group">
        <div class="button" @click="openUpload">
          <font-awesome-icon icon="file-upload" />
          {{ $t("edition.uploadJson") }}
        </div>
        <div class="button" @click="promptURL">
          <font-awesome-icon icon="link" /> {{ $t("edition.enterUrl") }}
        </div>
        <div class="button" @click="readFromClipboard">
          <font-awesome-icon icon="clipboard" />
          {{ $t("edition.useJsonFromClipboard") }}
        </div>
        <div class="button" @click="isCustom = false">
          <font-awesome-icon icon="undo" /> {{ $t("edition.back") }}
        </div>
      </div>
    </div>
  </Modal>
</template>

<script>
import editionJSON from "../../editions";
import { mapMutations, mapState } from "vuex";
import Modal from "./Modal";
import { SYSTEM_KEYS } from "../../utils/storageKeys.js";
import i18n from "../../i18n";

export default {
  components: {
    Modal,
  },
  data: function () {
    return {
      editions: editionJSON,
      isCustom: false,
      scripts: [
        [
          "Deadly Penance Day",
          "https://gist.githubusercontent.com/bra1n/0337cc44c6fd2c44f7589256ed5486d2/raw/16be38fa3c01aaf49827303ac80577bdb52c0b25/penanceday.json",
        ],
        [
          "Catfishing 11.1",
          "https://gist.githubusercontent.com/bra1n/8a5ec41a7bbf945f6b7dfc1cef72b569/raw/a312ab93c2f302e0ef83c8b65a4e8e82760fda3a/catfishing.json",
        ],
        [
          "On Thin Ice (Teensyville)",
          "https://gist.githubusercontent.com/bra1n/8dacd9f2abc6f428331ea1213ab153f5/raw/0cacbcaf8ed9bddae0cca25a9ada97e9958d868b/on-thin-ice.json",
        ],
        [
          "Race To The Bottom (Teensyville)",
          "https://gist.githubusercontent.com/bra1n/63e1354cb3dc9d4032bcd0623dc48888/raw/5acb0eedcc0a67a64a99c7e0e6271de0b7b2e1b2/race-to-the-bottom.json",
        ],
        [
          "Frankenstein's Mayor by Ted (Teensyville)",
          "https://gist.githubusercontent.com/bra1n/32c52b422cc01b934a4291eeb81dbcee/raw/5bf770693bbf7aff5e86601c82ca4af3222f4ba6/Frankensteins_Mayor_by_Ted.json",
        ],
        [
          "Vigormortis High School (Teensyville)",
          "https://gist.githubusercontent.com/bra1n/1f65bd4a999524719d5dabe98c3c2d27/raw/22bbec6bf56a51a7459e5ae41ed47e41971c5445/VigormortisHighSchool.json",
        ],
      ],
    };
  },
  computed: mapState(["modals"]),
  methods: {
    $t(key, params = {}) {
      return i18n.t(key, params);
    },
    openUpload() {
      this.$refs.upload.click();
    },
    handleUpload() {
      const file = this.$refs.upload.files[0];
      if (file && file.size) {
        const reader = new FileReader();
        reader.addEventListener("load", () => {
          try {
            const roles = JSON.parse(reader.result);
            this.parseRoles(roles);
          } catch (e) {
            alert(this.$t("edition.errorReadingScript") + e.message);
          }
          this.$refs.upload.value = "";
        });
        reader.readAsText(file);
      }
    },
    promptURL() {
      const url = prompt(this.$t("edition.enterUrlPrompt"));
      if (url) {
        this.handleURL(url);
      }
    },
    async handleURL(url) {
      const res = await fetch(url);
      if (res && res.json) {
        try {
          const script = await res.json();
          this.parseRoles(script);
        } catch (e) {
          alert(this.$t("edition.errorLoadingScript") + e.message);
        }
      }
    },
    async readFromClipboard() {
      const text = await navigator.clipboard.readText();
      try {
        const roles = JSON.parse(text);
        this.parseRoles(roles);
      } catch (e) {
        alert(this.$t("edition.errorReadingScript") + e.message);
      }
    },
    parseRoles(roles) {
      if (!roles || !roles.length) return;
      roles = roles.map((role) =>
        typeof role === "string" ? { id: role } : role,
      );
      const metaIndex = roles.findIndex(({ id }) => id === "_meta");
      let meta = {};
      if (metaIndex > -1) {
        meta = roles.splice(metaIndex, 1).pop();
      }

      // 检查是否包含自定义图片
      const hasCustomImages = roles.some(
        (role) => role.image && role.image.trim() !== "",
      );

      console.log("Loading custom roles:", roles.length, "roles");
      console.log("Roles with custom images:", hasCustomImages);

      // 打印包含自定义图片的角色信息
      if (hasCustomImages) {
        roles.forEach((role) => {
          if (role.image && role.image.trim() !== "") {
            console.log(`Role ${role.id} has custom image:`, role.image);
          }
        });
      }

      // 如果包含自定义图片，先启用图片显示
      if (hasCustomImages) {
        console.log("Enabling custom images for script");
        this.$store.commit("toggleImageOptIn", true);
        // 保存图片选择设置
        sessionStorage.setItem(SYSTEM_KEYS.IMAGE_OPT_IN, "1");
      }

      // 先设置版本，再设置自定义角色
      this.$store.commit(
        "setEdition",
        Object.assign({}, meta, { id: "custom" }),
      );

      // 设置自定义角色
      console.log(
        "Setting custom roles with images:",
        roles.filter((r) => r.image).length,
      );
      this.$store.commit("setCustomRoles", roles);

      // 验证角色是否正确加载
      console.log("Loaded roles count:", this.$store.state.roles.size);

      // 强制更新所有Token组件，确保图片能够正确加载
      this.$nextTick(() => {
        this.$forceUpdate();
        // 延迟更新，确保所有组件都已更新
        setTimeout(() => {
          this.$forceUpdate();
          // 再次延迟更新，确保图片能够正确加载
          setTimeout(() => {
            this.$forceUpdate();
            // 最后一次更新，确保所有图片都已加载
            setTimeout(() => {
              this.$forceUpdate();
            }, 300);
          }, 200);
        }, 100);
      });

      // check for fabled and set those too, if present
      if (roles.some((role) => this.$store.state.fabled.has(role.id || role))) {
        const fabled = [];
        roles.forEach((role) => {
          if (this.$store.state.fabled.has(role.id || role)) {
            fabled.push(this.$store.state.fabled.get(role.id || role));
          }
        });
        this.$store.commit("players/setFabled", { fabled });
      }
      this.isCustom = false;
    },
    ...mapMutations(["toggleModal", "setEdition"]),
  },
};
</script>

<style scoped lang="scss">
ul.editions .edition {
  font-family: PiratesBay, sans-serif;
  letter-spacing: 1px;
  text-align: center;
  padding-top: 15%;
  background-position: center center;
  background-size: 100% auto;
  background-repeat: no-repeat;
  width: 30%;
  margin: 5px;
  font-size: 120%;
  text-shadow:
    -1px -1px 0 #000,
    1px -1px 0 #000,
    -1px 1px 0 #000,
    1px 1px 0 #000,
    0 0 5px rgba(0, 0, 0, 0.75);
  cursor: pointer;
  &:hover {
    color: red;
  }
}

.custom {
  text-align: center;
  input[type="file"] {
    display: none;
  }
  .scripts {
    list-style-type: disc;
    font-size: 120%;
    cursor: pointer;
    display: block;
    width: 50%;
    text-align: left;
    margin: 10px auto;
    li:hover {
      color: red;
    }
  }
}
</style>
