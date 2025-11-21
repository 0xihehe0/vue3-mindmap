/*
 * @Author: yaojinxi 864554492@qq.com
 * @Date: 2025-11-21 23:45:40
 * @LastEditors: yaojinxi 864554492@qq.com
 * @LastEditTime: 2025-11-21 23:46:26
 * @FilePath: \mindmap-vue3\src\utils\mindmapTree.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
// src/utils/mindmapTree.ts
import type { MindNode } from '../types/mindmap'

// DFS 查找节点
export function findNodeById(
  node: MindNode,
  id: string
): MindNode | null {
  if (node.id === id) return node
  if (!node.children) return null
  for (const child of node.children) {
    const found = findNodeById(child, id)
    if (found) return found
  }
  return null
}

// 简单生成唯一 id
export function genId() {
  return (
    'node-' +
    Date.now().toString(36) +
    '-' +
    Math.random().toString(16).slice(2)
  )
}

// 从整棵树中删除指定 id 的节点（连同子树）
export function removeNodeById(
  root: MindNode,
  targetId: string
) {
  if (root.id === targetId) return // 根节点不删

  const dfs = (node: MindNode): boolean => {
    if (!node.children) return false
    const index = node.children.findIndex(
      c => c.id === targetId
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

  dfs(root)
}

// 在 parentId 对应节点下新增子节点，并返回新节点
export function addChildNode(
  root: MindNode,
  parentId: string
): MindNode | null {
  const parent = findNodeById(root, parentId)
  if (!parent) return null

  const childIndex = parent.children?.length ?? 0
  const newNode: MindNode = {
    id: genId(),
    title: '新建节点',
    x: parent.x + 200,
    y: parent.y + childIndex * 80 - 40
  }

  if (!parent.children) parent.children = []
  parent.children.push(newNode)
  return newNode
}
