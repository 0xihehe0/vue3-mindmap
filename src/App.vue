<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Toolbar from './components/Toolbar.vue'
import MindMapCanvas from './components/MindMapCanvas.vue'
import type { MindNode } from './types/mindmap'
import { ElMessage, ElMessageBox } from 'element-plus'

const STORAGE_KEY = 'mindmap-data'

// 生成一个“只有一个父级”的空白导图
const createEmptyMindMap = (): MindNode => ({
  id: 'root',
  title: '中心主题',
  x: 600,
  y: 300,
  children: []
})

// 根节点：全局唯一状态
const rootNode = ref<MindNode>(createEmptyMindMap())

// 记录“上次保存时的 JSON”，用来判断当前是否有改动
const lastSavedJson = ref<string | null>(null)

// 导出 JSON 弹窗
const exportDialogVisible = ref(false)
const exportJson = ref('')

// 初次挂载：优先读取本地缓存
onMounted(() => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try {
      rootNode.value = JSON.parse(saved)
      lastSavedJson.value = saved
      console.log('已从本地缓存加载思维导图')
    } catch (e) {
      console.error('解析本地思维导图失败：', e)
      rootNode.value = createEmptyMindMap()
    }
  } else {
    // 没有缓存 → 使用空白导图
    rootNode.value = createEmptyMindMap()
  }
})

/**
 * 保存当前导图到 localStorage
 */
const doSave = () => {
  const json = JSON.stringify(rootNode.value)
  localStorage.setItem(STORAGE_KEY, json)
  lastSavedJson.value = json
  ElMessage.success('已保存到本地（localStorage）')
}

/**
 * Toolbar：点击“保存”
 */
const handleSave = () => {
  doSave()
}

/**
 * Toolbar：点击“新建”
 * 逻辑：
 * 1. 当前内容和已保存内容完全相同：
 *    -> 直接新建空白导图
 * 2. 当前内容和已保存内容不同：
 *    -> 提示是否先保存
 */
const handleNew = () => {
  const currentJson = JSON.stringify(rootNode.value)
  const savedJson =
    lastSavedJson.value ?? localStorage.getItem(STORAGE_KEY)

  // 情况 1：没有任何保存记录
  if (!savedJson) {
    rootNode.value = createEmptyMindMap()
    ElMessage.success('已新建空白思维导图')
    return
  }

  // 情况 2：当前内容和保存内容一致 → 无需确认，直接新建
  if (savedJson === currentJson) {
    rootNode.value = createEmptyMindMap()
    ElMessage.success('已新建空白思维导图')
    return
  }

  // 情况 3：当前有未保存修改 → 提示用户
  ElMessageBox.confirm(
    '当前思维导图尚未保存，是否先保存再新建？',
    '提示',
    {
      confirmButtonText: '保存并新建',
      cancelButtonText: '直接新建',
      type: 'warning'
    }
  )
    .then(() => {
      // 用户选择：保存并新建
      doSave()
      rootNode.value = createEmptyMindMap()
      ElMessage.success('已保存并新建空白思维导图')
    })
    .catch(() => {
      // 用户选择：直接新建（不保存）
      rootNode.value = createEmptyMindMap()
      ElMessage.info('已新建空白思维导图（未保存当前修改）')
    })
}

/**
 * Toolbar：点击“导出 JSON”
 */
const handleExport = () => {
  exportJson.value = JSON.stringify(rootNode.value, null, 2)
  exportDialogVisible.value = true
}

/**
 * 导出弹窗：复制 JSON
 */
const copyExportJson = async () => {
  try {
    await navigator.clipboard.writeText(exportJson.value)
    ElMessage.success('已复制到剪贴板')
  } catch (e) {
    console.error(e)
    ElMessage.error('复制失败，请手动复制内容')
  }
}
</script>

<template>
  <div class="app-root">
    <Toolbar
      @new="handleNew"
      @save="handleSave"
      @export="handleExport"
    />

    <!-- 把根节点数据传给画布 -->
    <MindMapCanvas :root="rootNode" />

    <!-- 导出 JSON 的弹窗 -->
    <el-dialog
      v-model="exportDialogVisible"
      title="导出 JSON"
      width="600px"
    >
      <el-input
        v-model="exportJson"
        type="textarea"
        :rows="14"
      />
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="exportDialogVisible = false">
            关闭
          </el-button>
          <el-button type="primary" @click="copyExportJson">
            复制到剪贴板
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.app-root {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
