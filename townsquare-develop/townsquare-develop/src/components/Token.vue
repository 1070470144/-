<template>
  <div class="token" @click="setRole" :class="[role.id]">
    <img
      v-if="role.id"
      class="icon"
      :src="iconUrl"
      @load="onImageLoad"
      @error="onImageError"
      :alt="role.name || role.id"
    />
    <span
      class="leaf-left"
      v-if="role.firstNight || role.firstNightReminder"
    ></span>
    <span
      class="leaf-right"
      v-if="role.otherNight || role.otherNightReminder"
    ></span>
    <span v-if="reminderLeaves" :class="['leaf-top' + reminderLeaves]"></span>
    <span class="leaf-orange" v-if="role.setup"></span>
    <svg viewBox="0 0 150 150" class="name">
      <path
        d="M 13 75 C 13 160, 138 160, 138 75"
        id="curve"
        fill="transparent"
      />
      <text
        width="150"
        x="66.6%"
        text-anchor="middle"
        class="label mozilla"
        :font-size="role.name | nameToFontSize"
      >
        <textPath xlink:href="#curve">
          {{ role.name }}
        </textPath>
      </text>
    </svg>
    <div class="edition" :class="[`edition-${role.edition}`, role.team]"></div>
    <div class="ability" v-if="role.ability">
      {{ role.ability }}
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";

export default {
  name: "Token",
  props: {
    role: {
      type: Object,
      default: () => ({})
    }
  },
  computed: {
    reminderLeaves: function() {
      return (
        (this.role.reminders || []).length +
        (this.role.remindersGlobal || []).length
      );
    },
    iconUrl() {
      console.log(`Computing iconUrl for role: ${this.role.id}`);
      console.log(`Role image:`, this.role.image);
      console.log(`isImageOptIn:`, this.grimoire.isImageOptIn);
      console.log(`useFallbackIcon:`, this.useFallbackIcon);
      
      // 如果图片加载失败，使用默认图标
      if (this.useFallbackIcon) {
        console.log(`Using fallback icon for role: ${this.role.id}`);
        return this.getFallbackIconUrl();
      }
      
      // 如果有自定义图片且启用了自定义图片
      if (this.role.image && this.grimoire.isImageOptIn) {
        console.log(`Loading custom image for role ${this.role.id}:`, this.role.image);
        // 对于远程图片，添加时间戳防止缓存问题
        const url = this.role.image;
        if (url.startsWith('http')) {
          const separator = url.includes('?') ? '&' : '?';
          // 使用当前时间戳确保每次都是新的URL
          const timestamp = Date.now();
          const finalUrl = `${url}${separator}_t=${timestamp}`;
          console.log(`Remote image URL with timestamp:`, finalUrl);
          return finalUrl;
        }
        console.log(`Local image URL:`, url);
        return url;
      }
      
      // 使用默认图标
      console.log(`Using fallback icon for role: ${this.role.id} (no custom image or image opt-in disabled)`);
      return this.getFallbackIconUrl();
    },
    ...mapState(["grimoire"])
  },
  data() {
    return {
      imageLoaded: false,
      imageError: false,
      useFallbackIcon: false
    };
  },
  filters: {
    nameToFontSize: name => (name && name.length > 10 ? "90%" : "110%")
  },
  methods: {
    setRole() {
      this.$emit("set-role");
    },
    onImageLoad() {
      this.imageLoaded = true;
      this.imageError = false;
      console.log(`Image loaded successfully for role: ${this.role.id}`);
    },
    onImageError() {
      this.imageError = true;
      this.imageLoaded = false;
      this.useFallbackIcon = true;
      console.error(`Failed to load image for role: ${this.role.id}, falling back to default icon`);
      // 强制重新渲染以使用默认图标
      this.$nextTick(() => {
        this.$forceUpdate();
      });
    },
    getFallbackIconUrl() {
      // 确定要使用的图标名称
      let iconName = this.role.imageAlt || this.role.id;
      
      // 确保图标名称是有效的本地图标
      const validIcons = [
        'good', 'outsider', 'minion', 'evil', 'fabled', 'custom',
        'imp', 'witch', 'widow', 'washerwoman', 'voudon', 'vortox', 'virgin',
        'vigormortis', 'undertaker', 'toymaker', 'towncrier', 'tinker', 'thief',
        'tealady', 'sweetheart', 'stormcatcher', 'spy', 'spiritofivory', 'soldier',
        'snitch', 'snakecharmer', 'slayer', 'shabaloth', 'sentinel', 'seamstress',
        'scarletwoman', 'scapegoat', 'savant', 'saint', 'sailor', 'sage', 'riot',
        'revolutionary', 'recluse', 'ravenkeeper', 'puzzlemaster', 'pukka',
        'psychopath', 'professor', 'preacher', 'poppygrower', 'politician',
        'poisoner', 'po', 'plus', 'pixie', 'pithag', 'philosopher', 'pacifist',
        'oracle', 'nodashii', 'noble', 'nightwatchman', 'mutant', 'moonchild',
        'monk', 'minstrel', 'mezepheles', 'mephit', 'mayor', 'matron',
        'mathematician', 'mastermind', 'marionette', 'magician', 'lycanthrope',
        'lunatic', 'lleech', 'lilmonsta', 'librarian', 'leviathan', 'legion',
        'klutz', 'king', 'juggler', 'judge', 'investigator', 'innkeeper',
        'huntsman', 'heretic', 'hellslibrarian', 'harlot', 'gunslinger',
        'grandmother', 'gossip', 'goon', 'golem', 'godfather', 'goblin',
        'general', 'gangster', 'gambler', 'fortuneteller', 'fool', 'flowergirl'
      ];
      
      // 如果图标名称不在有效列表中，使用基于团队的默认图标
      if (!validIcons.includes(iconName)) {
        console.warn(`Invalid icon name: ${iconName} for role: ${this.role.id}, using team-based fallback`);
        iconName = {
          townsfolk: 'good',
          outsider: 'outsider',
          minion: 'minion',
          demon: 'evil',
          fabled: 'fabled'
        }[this.role.team] || 'custom';
      }
      
      try {
        return require(`../assets/icons/${iconName}.png`);
      } catch (error) {
        console.error(`Failed to load icon: ${iconName}.png for role: ${this.role.id}`, error);
        // 最后的回退方案
        return require('../assets/icons/custom.png');
      }
    }
  },
  mounted() {
    // 组件挂载时重置图片状态
    console.log(`Token mounted for role: ${this.role.id}`);
    this.imageLoaded = false;
    this.imageError = false;
    this.useFallbackIcon = false;
  },
  watch: {
    'role.image': {
      handler() {
        // 当角色图片变化时，重置图片状态并强制重新计算
        console.log(`Role image changed for ${this.role.id}:`, this.role.image);
        this.imageLoaded = false;
        this.imageError = false;
        this.useFallbackIcon = false;
        this.$nextTick(() => {
          this.$forceUpdate();
        });
      },
      immediate: true
    },
    'grimoire.isImageOptIn': {
      handler() {
        // 当图片显示设置变化时，重置图片状态并强制重新计算
        console.log(`Image opt-in changed:`, this.grimoire.isImageOptIn);
        this.imageLoaded = false;
        this.imageError = false;
        this.useFallbackIcon = false;
        this.$nextTick(() => {
          this.$forceUpdate();
        });
      },
      immediate: true
    },
    'role.id': {
      handler() {
        // 当角色ID变化时，重置图片状态
        console.log(`Role ID changed:`, this.role.id);
        this.imageLoaded = false;
        this.imageError = false;
        this.useFallbackIcon = false;
        this.$nextTick(() => {
          this.$forceUpdate();
        });
      },
      immediate: true
    }
  }
};
</script>

<style scoped lang="scss">
.token {
  border-radius: 50%;
  width: 100%;
  background: url("../assets/token.png") center center;
  background-size: 100%;
  text-align: center;
  border: 3px solid black;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
  transform: scale(1);
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.7);
  }

  &:hover .name .label {
    stroke: black;
    fill: white;
    @-moz-document url-prefix() {
      &.mozilla {
        stroke: none;
        filter: drop-shadow(0 1.5px 0 black) drop-shadow(0 -1.5px 0 black)
          drop-shadow(1.5px 0 0 black) drop-shadow(-1.5px 0 0 black)
          drop-shadow(0 2px 2px rgba(0, 0, 0, 0.5));
      }
    }
  }

  .icon {
    position: absolute;
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center 30%;
    margin-top: 3%;
    pointer-events: none;
  }

  span {
    position: absolute;
    width: 100%;
    height: 100%;
    background-size: 100%;
    pointer-events: none;

    &.leaf-left {
      background-image: url("../assets/leaf-left.png");
    }

    &.leaf-orange {
      background-image: url("../assets/leaf-orange.png");
    }

    &.leaf-right {
      background-image: url("../assets/leaf-right.png");
    }

    &.leaf-top1 {
      background-image: url("../assets/leaf-top1.png");
    }

    &.leaf-top2 {
      background-image: url("../assets/leaf-top2.png");
    }

    &.leaf-top3 {
      background-image: url("../assets/leaf-top3.png");
    }

    &.leaf-top4 {
      background-image: url("../assets/leaf-top4.png");
    }

    &.leaf-top5 {
      background-image: url("../assets/leaf-top5.png");
    }
  }

  .name {
    width: 100%;
    height: 100%;
    font-size: 24px; // svg fonts are relative to document font size
    .label {
      fill: black;
      stroke: white;
      stroke-width: 2px;
      paint-order: stroke;
      font-family: "Papyrus", serif;
      font-weight: bold;
      text-shadow: 0 2px 2px rgba(0, 0, 0, 0.2);
      letter-spacing: 1px;

      @-moz-document url-prefix() {
        &.mozilla {
          // Vue doesn't support scoped media queries, so we have to use a second css class
          stroke: none;
          text-shadow: none;
          filter: drop-shadow(0 1.5px 0 white) drop-shadow(0 -1.5px 0 white)
            drop-shadow(1.5px 0 0 white) drop-shadow(-1.5px 0 0 white)
            drop-shadow(0 2px 2px rgba(0, 0, 0, 0.5));
        }
      }
    }
  }

  .edition {
    position: absolute;
    right: 0;
    bottom: 5px;
    width: 30px;
    height: 30px;
    background-size: 100%;
    display: none;
  }

  .ability {
    display: flex;
    position: absolute;
    padding: 5px 10px;
    left: 120%;
    width: 250px;
    z-index: 25;
    font-size: 80%;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 10px;
    border: 3px solid black;
    filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.5));
    text-align: left;
    justify-items: center;
    align-content: center;
    align-items: center;
    pointer-events: none;
    opacity: 0;
    transition: opacity 200ms ease-in-out;

    &:before {
      content: " ";
      border: 10px solid transparent;
      width: 0;
      height: 0;
      border-right-color: black;
      position: absolute;
      margin-right: 2px;
      right: 100%;
    }
  }

  &:hover .ability {
    opacity: 1;
  }
}
</style>
