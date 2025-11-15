/*
 * @Author: yaojinxi 864554492@qq.com
 * @Date: 2025-11-14 16:21:31
 * @LastEditors: yaojinxi 864554492@qq.com
 * @LastEditTime: 2025-11-14 16:21:37
 * @FilePath: \mindmap-vue3\src\types\mindmap.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
// src/types/mindmap.ts
export interface MindNode {
  id: string
  title: string
  x: number
  y: number
  children?: MindNode[]
}
