<!-- src/components/MindMapCanvas.vue -->
<script setup lang="ts">
import {
  onMounted,
  onBeforeUnmount,
  watch
} from 'vue'
import type { MindNode } from '../types/mindmap'
import { useMindMapView } from '../composables/useMindMapView'
import { useMindMapInteraction } from '../composables/useMindMapInteraction'
import MindNodeComp from './MindNode.vue'

const props = defineProps<{
  root: MindNode
}>()

// 视图：缩放 + 平移
const {
  scale,
  translateX,
  translateY,
  isSpacePressed,
  handleWheel,
  startPan,
  initKeyListeners,
  cleanup: cleanupView
} = useMindMapView()

// 节点交互：拖拽 / 右键菜单 / 编辑
const {
  selectedId,
  flatNodes,
  lines,
  contextMenu,
  editingId,
  editTitle,
  handleCanvasClick,
  handleNodeMouseDown,
  handleNodeContextMenu,
  handleMenuAddChild,
  handleMenuRename,
  handleMenuDelete,
  commitEdit,
  cancelEdit
} = useMindMapInteraction(
  () => props.root,
  () => scale.value
)

// 当 root 替换（点击“新建”）时，自动选中新 root
watch(
  () => props.root,
  newRoot => {
    if (newRoot) {
      selectedId.value = newRoot.id
    }
  },
  { immediate: true }
)

const updateEditingTitle = (val: string) => {
  editTitle.value = val
}

onMounted(() => {
  initKeyListeners()
})

onBeforeUnmount(() => {
  cleanupView()
})
</script>

<template>
  <div class="canvas-wrapper">
    <div
      class="canvas-inner"
      :class="{ 'is-panning': isSpacePressed }"
      @click="handleCanvasClick"
      @mousedown="isSpacePressed ? startPan($event) : null"
      @wheel.prevent="handleWheel"
    >
      <!-- 缩放 + 平移容器 -->
      <div
        class="canvas-content"
        :style="{
          transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`
        }"
      >
        <!-- 连线 -->
        <svg
          class="canvas-lines"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line
            v-for="line in lines"
            :key="line.id"
            class="canvas-line-item"
            :x1="line.from.x"
            :y1="line.from.y"
            :x2="line.to.x"
            :y2="line.to.y"
          />
        </svg>

        <!-- 节点组件 -->
        <MindNodeComp
          v-for="node in flatNodes"
          :key="node.id"
          :node="node"
          :selected="node.id === selectedId"
          :is-editing="editingId === node.id"
          :editing-title="editTitle"
          @node-mousedown="(e) => handleNodeMouseDown(node, e)"
          @node-contextmenu="(e) => handleNodeContextMenu(node, e)"
          @update:editing-title="updateEditingTitle"
          @commit-edit="commitEdit"
          @cancel-edit="cancelEdit"
        />
      </div>

      <!-- 右键菜单 -->
      <div
        v-if="contextMenu.visible"
        class="context-menu"
        :style="{
          left: contextMenu.x + 'px',
          top: contextMenu.y + 'px'
        }"
      >
        <ul>
          <li @click.stop="handleMenuAddChild">
            新增子节点
          </li>
          <li @click.stop="handleMenuRename">
            重命名
          </li>
          <li
            class="danger"
            @click.stop="handleMenuDelete"
          >
            删除
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.canvas-wrapper {
  flex: 1;
  background: #f5f7fa;
  width: 100%;
  height: calc(100vh - 56px);
  overflow: hidden;
}

.canvas-inner {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.canvas-content {
  width: 100%;
  height: 100%;
  position: relative;
  transform-origin: center center;
}

/* 关键：SVG 要铺满，不然线可能又“消失” */
.canvas-lines {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}

.canvas-line-item {
  stroke: #c0c4cc;
  stroke-width: 2;
}

/* 右键菜单 */
.context-menu {
  position: fixed;
  z-index: 10;
  background: #ffffff;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  font-size: 13px;
  padding: 4px 0;
  min-width: 120px;
}

.context-menu ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.context-menu li {
  padding: 6px 14px;
  cursor: pointer;
  white-space: nowrap;
}

.context-menu li:hover {
  background: #ecf5ff;
}

.context-menu li.danger {
  color: #f56c6c;
}

.context-menu li.danger:hover {
  background: #fef0f0;
}

/* 空格按下：拖动画布的视觉提示 */
.canvas-inner.is-panning {
  cursor: grab;
}
.canvas-inner.is-panning:active {
  cursor: grabbing;
}
</style>
