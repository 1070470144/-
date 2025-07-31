<template>
  <div class="script-skeleton">
    <div v-for="i in count" :key="i" class="skeleton-card">
      <div class="skeleton-header">
        <div class="skeleton-title"></div>
        <div class="skeleton-meta">
          <div class="skeleton-author"></div>
          <div class="skeleton-category"></div>
        </div>
      </div>

      <div class="skeleton-content">
        <div class="skeleton-description"></div>
        <div class="skeleton-description short"></div>
      </div>

      <div class="skeleton-actions">
        <div class="skeleton-button"></div>
        <div class="skeleton-button small"></div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "ScriptSkeleton",
  props: {
    count: {
      type: Number,
      default: 6,
    },
  },
};
</script>

<style scoped lang="scss">
.script-skeleton {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  padding: 20px;
}

.skeleton-card {
  background: #3a3a3a;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #4a4a4a;

  .skeleton-header {
    margin-bottom: 15px;

    .skeleton-title {
      height: 24px;
      background: linear-gradient(90deg, #4a4a4a 25%, #5a5a5a 50%, #4a4a4a 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
      margin-bottom: 10px;
    }

    .skeleton-meta {
      display: flex;
      gap: 15px;

      .skeleton-author,
      .skeleton-category {
        height: 16px;
        width: 80px;
        background: linear-gradient(
          90deg,
          #4a4a4a 25%,
          #5a5a5a 50%,
          #4a4a4a 75%
        );
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
        border-radius: 3px;
      }
    }
  }

  .skeleton-content {
    margin-bottom: 15px;

    .skeleton-description {
      height: 16px;
      background: linear-gradient(90deg, #4a4a4a 25%, #5a5a5a 50%, #4a4a4a 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 3px;
      margin-bottom: 8px;

      &.short {
        width: 60%;
      }
    }
  }

  .skeleton-actions {
    display: flex;
    gap: 10px;

    .skeleton-button {
      height: 36px;
      background: linear-gradient(90deg, #4a4a4a 25%, #5a5a5a 50%, #4a4a4a 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 6px;

      &.small {
        width: 80px;
      }

      &:first-child {
        flex: 1;
      }
    }
  }
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
</style>
