<script setup lang="ts">
import {
  computed,
  ref,
  reactive,
  onMounted,
  onBeforeUnmount
} from 'vue'
import type { MindNode } from '../types/mindmap'

// 从父组件传入根节点
const props = defineProps<{
  root: MindNode
}>()

interface Line {
  id: string
  from: MindNode
  to: MindNode
}

// ======= 选中 / 拖拽节点 =======

const selectedId = ref<string | null>(props.root.id)

const draggingNodeId = ref<string | null>(null)
const dragState = ref({
  mouseX: 0,
  mouseY: 0,
  nodeX: 0,
  nodeY: 0
})

// ======= 编辑 =======

const editingId = ref<string | null>(null)
const editTitle = ref('')

// ======= 右键菜单 =======

const contextMenu = reactive({
  visible: false,
  x: 0,
  y: 0,
  nodeId: null as string | null
})

// ======= 视图：缩放 + 平移 =======

const scale = ref(1)
const MIN_SCALE = 0.3
const MAX_SCALE = 2.5
const translateX = ref(0)
const translateY = ref(0)

const isSpacePressed = ref(false)
const isPanning = ref(false)
const panState = ref({
  mouseX: 0,
  mouseY: 0,
  startX: 0,
  startY: 0
})

// ======= 工具函数 =======

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

const genId = () =>
  'node-' +
  Date.now().toString(36) +
  '-' +
  Math.random().toString(16).slice(2)

const removeNodeById = (id: string) => {
  if (id === props.root.id) return

  const dfs = (node: MindNode): boolean => {
    if (!node.children) return false
    const index = node.children.findIndex(
      c => c.id === id
    )
    if (index !== -1) {
      node.children.splice(index, 1)
      if (node.children.length === 0) {
        node.children = undefined
      }
      return true
    }
    return node.children.some(child => dfs(child))
  }

  dfs(props.root)
}

const addChildNode = (parentId: string) => {
  const parent = findNodeById(props.root, parentId)
  if (!parent) return

  const childIndex = parent.children?.length ?? 0

  const newNode: MindNode = {
    id: genId(),
    title: '新建节点',
    x: parent.x + 200,
    y: parent.y + childIndex * 80 - 40
  }

  if (!parent.children) parent.children = []
  parent.children.push(newNode)

  selectedId.value = newNode.id
  editingId.value = newNode.id
  editTitle.value = newNode.title
}

// ======= 计算属性 =======

const flatNodes = computed<MindNode[]>(() => {
  const result: MindNode[] = []

  const dfs = (node: MindNode) => {
    result.push(node)
    node.children?.forEach(child => dfs(child))
  }

  dfs(props.root)
  return result
})

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

  walk(props.root)
  return result
})

// ======= 交互：画布点击 / 缩放 / 平移 =======

const handleCanvasClick = () => {
  selectedId.value = null
  hideContextMenu()
}

const handleCanvasMouseDown = (e: MouseEvent) => {
  if (!isSpacePressed.value) return
  if (e.button !== 0) return
  e.preventDefault()

  isPanning.value = true
  panState.value = {
    mouseX: e.clientX,
    mouseY: e.clientY,
    startX: translateX.value,
    startY: translateY.value
  }

  window.addEventListener('mousemove', handlePanMouseMove)
  window.addEventListener('mouseup', handlePanMouseUp)
}

const handlePanMouseMove = (e: MouseEvent) => {
  if (!isPanning.value) return
  const dx = e.clientX - panState.value.mouseX
  const dy = e.clientY - panState.value.mouseY
  translateX.value = panState.value.startX + dx
  translateY.value = panState.value.startY + dy
}

const handlePanMouseUp = () => {
  isPanning.value = false
  window.removeEventListener(
    'mousemove',
    handlePanMouseMove
  )
  window.removeEventListener('mouseup', handlePanMouseUp)
}

const handleWheel = (e: WheelEvent) => {
  e.preventDefault()
  const delta = e.deltaY
  const zoomFactor = 0.0015
  const next = scale.value - delta * zoomFactor
  scale.value = Math.min(
    MAX_SCALE,
    Math.max(MIN_SCALE, next)
  )
}

// ======= 节点拖拽 =======

const handleNodeMouseDown = (
  node: MindNode,
  e: MouseEvent
) => {
  if (e.button !== 0) return
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

const handleMouseMove = (e: MouseEvent) => {
  if (!draggingNodeId.value) return

  const node = findNodeById(
    props.root,
    draggingNodeId.value
  )
  if (!node) return

  const dx =
    (e.clientX - dragState.value.mouseX) / scale.value
  const dy =
    (e.clientY - dragState.value.mouseY) / scale.value

  node.x = dragState.value.nodeX + dx
  node.y = dragState.value.nodeY + dy
}

const handleMouseUp = () => {
  draggingNodeId.value = null
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', handleMouseUp)
}

// ======= 右键菜单 =======

const handleNodeContextMenu = (
  node: MindNode,
  e: MouseEvent
) => {
  e.preventDefault()
  e.stopPropagation()

  selectedId.value = node.id
  contextMenu.visible = true
  contextMenu.nodeId = node.id
  contextMenu.x = e.clientX
  contextMenu.y = e.clientY
}

const hideContextMenu = () => {
  contextMenu.visible = false
  contextMenu.nodeId = null
}

const handleMenuRename = () => {
  if (!contextMenu.nodeId) return
  const node = findNodeById(
    props.root,
    contextMenu.nodeId
  )
  hideContextMenu()
  if (!node) return

  editingId.value = node.id
  editTitle.value = node.title
}

const handleMenuAddChild = () => {
  if (!contextMenu.nodeId) return
  const id = contextMenu.nodeId
  hideContextMenu()
  addChildNode(id)
}

const handleMenuDelete = () => {
  if (!contextMenu.nodeId) return
  const id = contextMenu.nodeId
  hideContextMenu()

  if (id === props.root.id) return

  removeNodeById(id)
  if (selectedId.value === id) {
    selectedId.value = null
  }
  if (editingId.value === id) {
    editingId.value = null
    editTitle.value = ''
  }
}

// ======= 编辑 =======

const commitEdit = () => {
  if (!editingId.value) return
  const node = findNodeById(
    props.root,
    editingId.value
  )
  if (node) {
    const text = editTitle.value.trim()
    node.title = text || '未命名节点'
  }
  editingId.value = null
  editTitle.value = ''
}

const cancelEdit = () => {
  editingId.value = null
  editTitle.value = ''
}

// ======= 键盘：空格用于平移 =======


const handleKeyDown = (e: KeyboardEvent) => {
  if (e.code === 'Space') {
    const target = e.target as HTMLElement | null
    const tag = target?.tagName
    if (
      tag === 'INPUT' ||
      tag === 'TEXTAREA' ||
      target?.isContentEditable
    ) {
      return
    }
    e.preventDefault()
    isSpacePressed.value = true
  }
}

const handleKeyUp = (e: KeyboardEvent) => {
  if (e.code === 'Space') {
    isSpacePressed.value = false
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', handleMouseUp)
  window.removeEventListener(
    'mousemove',
    handlePanMouseMove
  )
  window.removeEventListener('mouseup', handlePanMouseUp)
})
</script>

<template>
  <div class="canvas-wrapper">
    <div
      class="canvas-inner"
      :class="{ 'is-panning': isSpacePressed }"
      @click="handleCanvasClick"
      @mousedown="handleCanvasMouseDown"
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
