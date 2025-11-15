<!--
 * @Author: yaojinxi 864554492@qq.com
 * @Date: 2025-11-14 16:18:09
 * @LastEditors: yaojinxi 864554492@qq.com
 * @LastEditTime: 2025-11-14 16:18:32
 * @FilePath: \mindmap-vue3\src\components\Toolbar.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<script setup lang="ts">
const handleNew = () => {
  console.log('新建思维导图')
}

const handleSave = () => {
  console.log('保存当前导图')
}

const handleExport = () => {
  console.log('导出为 JSON')
}
</script>

<template>
  <div class="toolbar">
    <div class="toolbar-left">
      <span class="logo">AI 思维导图</span>
    </div>
    <div class="toolbar-right">
      <el-button size="small" @click="handleNew">新建</el-button>
      <el-button size="small" @click="handleSave">保存</el-button>
      <el-button size="small" type="primary" @click="handleExport">
        导出 JSON
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  height: 56px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #ebeef5;
  background: #fff;
  box-sizing: border-box;
}

.logo {
  font-size: 18px;
  font-weight: 600;
}

.toolbar-right {
  display: flex;
  gap: 8px;
}
</style>
