<script setup lang="ts">
import {
  computed,
  ref,
  onMounted,
  onBeforeUnmount
} from 'vue'
import type { MindNode } from '../types/mindmap'
import { mockMindMap } from '../mock/mindmap'

const rootNode = ref<MindNode>(mockMindMap)

interface Line {
  id: string
  from: MindNode
  to: MindNode
}

// 当前选中节点
const selectedId = ref<string | null>('root')

// 正在拖拽的节点
const draggingNodeId = ref<string | null>(null)

// 拖拽起始状态
const dragState = ref({
  mouseX: 0,
  mouseY: 0,
  nodeX: 0,
  nodeY: 0
})

// 编辑状态
const editingId = ref<string | null>(null)
const editTitle = ref('')

// =============== 工具函数 ===============

// 在树中根据 id 查找节点
const findNodeById = (
  node: MindNode,
  id: string
): MindNode | null => {
  if (node.id === id) return node
  if (!node.children) return null
  for (const child of node.children) {
    const found = findNodeById(child, id)
    if (found) return found
  }
  return null
}

// 生成唯一 id（简单版）
const genId = () =>
  'node-' +
  Date.now().toString(36) +
  '-' +
  Math.random().toString(16).slice(2)

// 删除某个节点（连同子树）
const removeNodeById = (id: string) => {
  if (rootNode.value.id === id) return // 根节点不删

  const dfs = (node: MindNode): boolean => {
    if (!node.children) return false
    const idx = node.children.findIndex(c => c.id === id)
    if (idx !== -1) {
      node.children.splice(idx, 1)
      if (node.children.length === 0) {
        node.children = undefined
      }
      return true
    }
    return node.children.some(child => dfs(child))
  }

  dfs(rootNode.value)
}

// 在某节点下新增子节点
const addChildNode = (parentId: string) => {
  const parent = findNodeById(rootNode.value, parentId)
  if (!parent) return

  const index = parent.children?.length ?? 0

  const newNode: MindNode = {
    id: genId(),
    title: '新建节点',
    x: parent.x + 200,
    y: parent.y + index * 80 - 40
  }

  if (!parent.children) parent.children = []
  parent.children.push(newNode)

  // 选中并进入编辑
  selectedId.value = newNode.id
  editingId.value = newNode.id
  editTitle.value = newNode.title
}

// =============== 计算属性 ===============

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

// 父子连线列表
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

// =============== 交互逻辑 ===============

// 清空选中（点击空白）
const clearSelection = () => {
  selectedId.value = null
}

// 开始编辑节点标题（双击）
const startEdit = (node: MindNode) => {
  selectedId.value = node.id
  editingId.value = node.id
  editTitle.value = node.title
}

// 提交编辑
const commitEdit = () => {
  if (!editingId.value) return
  const node = findNodeById(rootNode.value, editingId.value)
  if (node) {
    const text = editTitle.value.trim()
    node.title = text || '未命名节点'
  }
  editingId.value = null
  editTitle.value = ''
}

// 取消编辑
const cancelEdit = () => {
  editingId.value = null
  editTitle.value = ''
}

// 节点按下：开始拖拽 + 选中
const handleNodeMouseDown = (
  node: MindNode,
  e: MouseEvent
) => {
  if (e.button !== 0) return // 只响应左键
  // 如果当前在编辑，就不拖拽
  if (editingId.value === node.id) return

  e.stopPropagation()
  e.preventDefault()

  selectedId.value = node.id
  draggingNodeId.value = node.id

  dragState.value = {
    mouseX: e.clientX,
    mouseY: e.clientY,
    nodeX: node.x,
    nodeY: node.y
  }

  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleMouseUp)
}

// 鼠标移动：更新节点坐标
const handleMouseMove = (e: MouseEvent) => {
  if (!draggingNodeId.value) return

  const node = findNodeById(
    rootNode.value,
    draggingNodeId.value
  )
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

// 键盘快捷键：Enter / Esc / Tab / Delete
const handleKeyDown = (e: KeyboardEvent) => {
  // 编辑状态下
  if (editingId.value) {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitEdit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelEdit()
    }
    return
  }

  if (!selectedId.value) return

  // 新增子节点：Tab
  if (e.key === 'Tab') {
    e.preventDefault()
    addChildNode(selectedId.value)
    return
  }

  // 删除节点：Delete / Backspace（根节点不删）
  if (
    e.key === 'Delete' ||
    e.key === 'Backspace'
  ) {
    if (selectedId.value === rootNode.value.id) return
    e.preventDefault()
    removeNodeById(selectedId.value)
    selectedId.value = null
    return
  }

  // 开始编辑：Enter
  if (e.key === 'Enter') {
    e.preventDefault()
    const node = findNodeById(
      rootNode.value,
      selectedId.value
    )
    if (node) startEdit(node)
  }
}

// 绑定 / 解绑全局键盘事件
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', handleMouseUp)
})
</script>

<template>
  <div class="canvas-wrapper">
    <!-- 点击空白处清空选中 -->
    <div class="canvas-inner" @click="clearSelection">
      <!-- 连线层 -->
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

      <!-- 节点层 -->
      <div
        v-for="node in flatNodes"
        :key="node.id"
        class="mind-node"
        :class="{ 'is-selected': node.id === selectedId }"
        :style="{ left: node.x + 'px', top: node.y + 'px' }"
        @mousedown.stop.prevent="handleNodeMouseDown(node, $event)"
        @dblclick.stop="startEdit(node)"
      >
        <!-- 编辑中：显示输入框 -->
        <template v-if="editingId === node.id">
          <el-input
            v-model="editTitle"
            size="small"
            autofocus
            @click.stop
            @mousedown.stop
            @blur="commitEdit"
          />
        </template>
        <!-- 非编辑：显示文字 -->
        <template v-else>
          {{ node.title }}
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.canvas-wrapper {
  flex: 1;
  background: #f5f7fa;
  width: 100%;
  height: calc(100vh - 56px); /* 顶部 toolbar 56px */
  overflow: hidden;
}

.canvas-inner {
  width: 100%;
  height: 100%;
  position: relative;
}

.canvas-lines {
  position: absolute;
  inset: 0;
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
</style>
