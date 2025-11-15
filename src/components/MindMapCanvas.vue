<script setup lang="ts">
import { computed, ref, onBeforeUnmount } from 'vue'
import type { MindNode } from '../types/mindmap'
import { mockMindMap } from '../mock/mindmap'

const rootNode = ref<MindNode>(mockMindMap)

interface Line {
  id: string
  from: MindNode
  to: MindNode
}

// 当前选中的节点
const selectedId = ref<string | null>('root')

// 当前正在拖拽的节点 id（没有拖拽时为 null）
const draggingNodeId = ref<string | null>(null)

// 记录拖拽开始时的一些数据
const dragState = ref({
  mouseX: 0,
  mouseY: 0,
  nodeX: 0,
  nodeY: 0
})

// 辅助函数：根据 id 在树里找到对应节点
const findNodeById = (node: MindNode, id: string): MindNode | null => {
  if (node.id === id) return node
  if (!node.children) return null
  for (const child of node.children) {
    const found = findNodeById(child, id)
    if (found) return found
  }
  return null
}

// 拍平节点，方便 v-for 渲染
const flatNodes = computed<MindNode[]>(() => {
  const result: MindNode[] = []

  const dfs = (node: MindNode) => {
    result.push(node)
    node.children?.forEach(child => dfs(child))
  }

  dfs(rootNode.value)
  return result
})

// 生成父子之间的连线
const lines = computed<Line[]>(() => {
  const result: Line[] = []

  const walk = (node: MindNode) => {
    node.children?.forEach(child => {
      result.push({
        id: `${node.id}-${child.id}`,
        from: node,
        to: child
      })
      walk(child)
    })
  }

  walk(rootNode.value)
  return result
})

// 点击空白画布：取消选中
const clearSelection = () => {
  selectedId.value = null
}

// 鼠标按下节点：开始拖拽 + 选中
const handleNodeMouseDown = (node: MindNode, e: MouseEvent) => {
  if (e.button !== 0) return // 只响应左键
  e.stopPropagation()
  e.preventDefault()

  selectedId.value = node.id
  draggingNodeId.value = node.id

  // 记录起始的鼠标位置和节点位置
  dragState.value = {
    mouseX: e.clientX,
    mouseY: e.clientY,
    nodeX: node.x,
    nodeY: node.y
  }

  // 绑定全局监听，防止拖到画布外失去事件
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleMouseUp)
}

// 鼠标移动：如果正在拖拽，则更新节点坐标
const handleMouseMove = (e: MouseEvent) => {
  if (!draggingNodeId.value) return

  const node = findNodeById(rootNode.value, draggingNodeId.value)
  if (!node) return

  const dx = e.clientX - dragState.value.mouseX
  const dy = e.clientY - dragState.value.mouseY

  node.x = dragState.value.nodeX + dx
  node.y = dragState.value.nodeY + dy
}

// 鼠标抬起：结束拖拽
const handleMouseUp = () => {
  draggingNodeId.value = null
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', handleMouseUp)
}

// 组件销毁时，防止监听器残留
onBeforeUnmount(() => {
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', handleMouseUp)
})
</script>

<template>
  <div class="canvas-wrapper">
    <!-- 点击空白处清空选中 -->
    <div class="canvas-inner" @click="clearSelection">
      <!-- SVG 连线层 -->
      <svg class="canvas-lines" xmlns="http://www.w3.org/2000/svg">
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

      <!-- 节点层 -->
      <div
        v-for="node in flatNodes"
        :key="node.id"
        class="mind-node"
        :class="{ 'is-selected': node.id === selectedId }"
        :style="{ left: node.x + 'px', top: node.y + 'px' }"
        @mousedown.stop.prevent="handleNodeMouseDown(node, $event)"
      >
        {{ node.title }}
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
  max-width: 200px;
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
