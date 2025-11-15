/*
 * @Author: yaojinxi 864554492@qq.com
 * @Date: 2025-11-14 16:21:55
 * @LastEditors: yaojinxi 864554492@qq.com
 * @LastEditTime: 2025-11-14 16:22:00
 * @FilePath: \mindmap-vue3\src\mock\mindmap.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
// src/mock/mindmap.ts
import type { MindNode } from '../types/mindmap'

export const mockMindMap: MindNode = {
  id: 'root',
  title: 'AI 智能家居产品脑暴',
  x: 600,
  y: 260,
  children: [
    {
      id: 'market',
      title: '市场需求',
      x: 900,
      y: 160,
      children: [
        { id: 'convenience', title: '便捷：任务自动化', x: 1150, y: 80 },
        { id: 'saving', title: '节能：降低电费', x: 1150, y: 160 },
        { id: 'security', title: '安全：家庭防护', x: 1150, y: 240 }
      ]
    },
    {
      id: 'tech',
      title: '技术可行性',
      x: 900,
      y: 320,
      children: [
        { id: 'chip', title: '高性能处理器', x: 1150, y: 320 },
        { id: 'protocol', title: '多协议兼容', x: 1150, y: 400 }
      ]
    },
    {
      id: 'design',
      title: '设计概念',
      x: 300,
      y: 200,
      children: [
        { id: 'style', title: '极简美学', x: 100, y: 140 },
        { id: 'ux', title: '用户体验', x: 100, y: 220 }
      ]
    },
    {
      id: 'cost',
      title: '成本估计',
      x: 300,
      y: 340
    }
  ]
}
