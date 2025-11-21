<!-- src/components/MindNode.vue -->
<script setup lang="ts">
import type { MindNode } from '../types/mindmap'
import { computed } from 'vue'

const props = defineProps<{
  node: MindNode
  selected: boolean
  isEditing: boolean
  editingTitle: string
}>()

const emit = defineEmits<{
  (e: 'node-mousedown', event: MouseEvent): void
  (e: 'node-contextmenu', event: MouseEvent): void
  (e: 'update:editingTitle', value: string): void
  (e: 'commit-edit'): void
  (e: 'cancel-edit'): void
}>()

// 把父组件传进来的 editingTitle 做一层 v-model 代理
const inputValue = computed({
  get: () => props.editingTitle,
  set: val => emit('update:editingTitle', val)
})

const handleMouseDown = (e: MouseEvent) => {
  emit('node-mousedown', e)
}

const handleContextMenu = (e: MouseEvent) => {
  emit('node-contextmenu', e)
}

const handleKeydownEnter = () => {
  emit('commit-edit')
}

const handleKeydownEsc = () => {
  emit('cancel-edit')
}

const handleBlur = () => {
  emit('commit-edit')
}
</script>

<template>
  <div
    class="mind-node"
    :class="{ 'is-selected': selected }"
    :style="{ left: node.x + 'px', top: node.y + 'px' }"
    @mousedown.stop.prevent="handleMouseDown"
    @contextmenu.stop.prevent="handleContextMenu"
  >
    <!-- 编辑态 -->
    <template v-if="isEditing">
      <el-input
        v-model="inputValue"
        size="small"
        autofocus
        @click.stop
        @mousedown.stop
        @keyup.enter.stop="handleKeydownEnter"
        @keyup.esc.stop="handleKeydownEsc"
        @blur="handleBlur"
      />
    </template>

    <!-- 普通态 -->
    <template v-else>
      {{ node.title }}
    </template>
  </div>
</template>

<style scoped>
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
</style>
