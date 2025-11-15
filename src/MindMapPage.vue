<script setup lang="ts">
import { computed, ref } from 'vue'
import type { MindNode } from '../types/mindmap'
import { mockMindMap } from '../mock/mindmap'

// 当前思维导图数据（先用静态 mock）
const rootNode = ref<MindNode>(mockMindMap)

interface Line {
  id: string
  from: MindNode
  to: MindNode
}

// 把树结构拍平，方便 v-for 渲染节点
const flatNodes = computed<MindNode[]>(() => {
  const result: MindNode[] = []

  const dfs = (node: MindNode) => {
    result.push(node)
    node.children?.forEach(child => dfs(child))
  }

  dfs(rootNode.value)
  return result
})

// 从树里生成所有“父子连线”
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
</script>

<template>
  <div class="canvas-wrapper">
    <div class="canvas-inner">
      <!-- SVG 连线层 -->
      <svg class="canvas-lines">
        <line
          v-for="line in lines"
          :key="line.id"
          :x1="line.from.x"
          :y1="line.from.y"
          :x2="line.to.x"
          :y2="line.to.y"
          stroke="#c0c4cc"
          stroke-width="2"
        />
      </svg>

      <!-- 节点层 -->
      <div
        v-for="node in flatNodes"
        :key="node.id"
        class="mind-node"
        :style="{ left: node.x + 'px', top: node.y + 'px' }"
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
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.canvas-inner {
  width: 100%;
  height: 100%;
  position: relative;
}

/* SVG 覆盖整个画布区域 */
.canvas-lines {
  position: absolute;
  inset: 0;
}

/* 思维导图节点样式 */
.mind-node {
  position: absolute;
  transform: translate(-50%, -50%); /* 让 x/y 表示节点中心 */
  min-width: 120px;
  max-width: 200px;
  padding: 8px 12px;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  font-size: 14px;
  line-height: 1.4;
  text-align: center;
  cursor: default;
  user-select: none;
  border: 1px solid #e4e7ed;
}
</style>
