<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import type { MindNode } from '../types/mindmap'
import { useMindMapView } from '../composables/useMindMapView'
import { useMindMapInteraction } from '../composables/useMindMapInteraction'

const props = defineProps<{
  root: MindNode
}>()

// 视图（缩放 + 平移）
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

// 节点交互（拖拽、选中、编辑、右键菜单）
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
} = useMindMapInteraction(() => props.root, () => scale.value)

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

        <!-- 节点 -->
        <div
          v-for="node in flatNodes"
          :key="node.id"
          class="mind-node"
          :class="{ 'is-selected': node.id === selectedId }"
          :style="{ left: node.x + 'px', top: node.y + 'px' }"
          @mousedown.stop.prevent="handleNodeMouseDown(node, $event)"
          @contextmenu.stop.prevent="handleNodeContextMenu(node, $event)"
        >
          <template v-if="editingId === node.id">
            <el-input
              v-model="editTitle"
              size="small"
              autofocus
              @click.stop
              @mousedown.stop
              @keyup.enter.stop="commitEdit"
              @keyup.esc.stop="cancelEdit"
              @blur="commitEdit"
            />
          </template>
          <template v-else>
            {{ node.title }}
          </template>
        </div>
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
          <li @click.stop="handleMenuAddChild">新增子节点</li>
          <li @click.stop="handleMenuRename">重命名</li>
          <li class="danger" @click.stop="handleMenuDelete">
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

.mind-node {
  position: absolute;
  z-index: 1;
  transform: translate(-50%, -50%);
  min-width: 120px;
  max-width: 220px;
  padding: 8px 12px;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  font-size: 14px;
  line-height: 1.4;
  text-align: center;
  cursor: grab;
  user-select: none;
  border: 1px solid #e4e7ed;
  transition: box-shadow 0.15s ease, border-color 0.15s ease,
    transform 0.15s ease;
}

.mind-node.is-selected {
  border-color: #409eff;
  box-shadow: 0 0 0 1px rgba(64, 158, 255, 0.3),
    0 6px 16px rgba(0, 0, 0, 0.08);
  transform: translate(-50%, -50%) scale(1.02);
}

.mind-node:active {
  cursor: grabbing;
}

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

.canvas-inner.is-panning {
  cursor: grab;
}
.canvas-inner.is-panning:active {
  cursor: grabbing;
}
</style>
