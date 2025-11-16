<script setup lang="ts">
import { computed, ref, reactive, onBeforeUnmount } from 'vue';
import type { MindNode } from '../types/mindmap';
import { mockMindMap } from '../mock/mindmap';

const rootNode = ref<MindNode>(mockMindMap);

interface Line {
    id: string;
    from: MindNode;
    to: MindNode;
}

// 当前选中节点
const selectedId = ref<string | null>('root');

// 拖拽相关
const draggingNodeId = ref<string | null>(null);
const dragState = ref({
    mouseX: 0,
    mouseY: 0,
    nodeX: 0,
    nodeY: 0
});

// 编辑相关
const editingId = ref<string | null>(null);
const editTitle = ref('');

// 右键菜单状态
const contextMenu = reactive({
    visible: false,
    x: 0,
    y: 0,
    nodeId: null as string | null
});

// -------- 工具函数 --------

// 在树中根据 id 查找节点
const findNodeById = (node: MindNode, id: string): MindNode | null => {
    if (node.id === id) return node;
    if (!node.children) return null;
    for (const child of node.children) {
        const found = findNodeById(child, id);
        if (found) return found;
    }
    return null;
};

// 简单生成唯一 id
const genId = () =>
    'node-' +
    Date.now().toString(36) +
    '-' +
    Math.random().toString(16).slice(2);

// 删除节点（整棵子树）
const removeNodeById = (id: string) => {
    if (id === rootNode.value.id) return; // 根节点不删

    const dfs = (node: MindNode): boolean => {
        if (!node.children) return false;
        const index = node.children.findIndex(c => c.id === id);
        if (index !== -1) {
            node.children.splice(index, 1);
            if (node.children.length === 0) {
                node.children = undefined;
            }
            return true;
        }
        return node.children.some(child => dfs(child));
    };

    dfs(rootNode.value);
};

// 在指定节点下添加子节点
const addChildNode = (parentId: string) => {
    const parent = findNodeById(rootNode.value, parentId);
    if (!parent) return;

    const childIndex = parent.children?.length ?? 0;

    const newNode: MindNode = {
        id: genId(),
        title: '新建节点',
        x: parent.x + 200,
        y: parent.y + childIndex * 80 - 40
    };

    if (!parent.children) parent.children = [];
    parent.children.push(newNode);

    selectedId.value = newNode.id;
    // 新建后直接进入编辑
    editingId.value = newNode.id;
    editTitle.value = newNode.title;
};

// -------- 计算属性 --------

// 拍平节点
const flatNodes = computed<MindNode[]>(() => {
    const result: MindNode[] = [];

    const dfs = (node: MindNode) => {
        result.push(node);
        node.children?.forEach(child => dfs(child));
    };

    dfs(rootNode.value);
    return result;
});

const lines = computed<Line[]>(() => {
    const result: Line[] = [];

    const walk = (node: MindNode) => {
        node.children?.forEach(child => {
            result.push({
                id: `${node.id}-${child.id}`,
                from: node,
                to: child
            });
            walk(child);
        });
    };

    walk(rootNode.value);
    return result;
});

// -------- 交互逻辑 --------

// 点击画布空白：取消选中 + 关闭菜单
const handleCanvasClick = () => {
    selectedId.value = null;
    hideContextMenu();
};

// 左键按下节点：开始拖拽
const handleNodeMouseDown = (node: MindNode, e: MouseEvent) => {
    if (e.button !== 0) return; // 只响应左键
    // 如果正在编辑这个节点，不允许拖动，避免光标混乱
    if (editingId.value === node.id) return;

    e.stopPropagation();
    e.preventDefault();

    selectedId.value = node.id;
    draggingNodeId.value = node.id;

    dragState.value = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        nodeX: node.x,
        nodeY: node.y
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
};

// 拖拽移动
const handleMouseMove = (e: MouseEvent) => {
    if (!draggingNodeId.value) return;

    const node = findNodeById(rootNode.value, draggingNodeId.value);
    if (!node) return;

    const dx = e.clientX - dragState.value.mouseX;
    const dy = e.clientY - dragState.value.mouseY;

    node.x = dragState.value.nodeX + dx;
    node.y = dragState.value.nodeY + dy;
};

// 结束拖拽
const handleMouseUp = () => {
    draggingNodeId.value = null;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
};

// 右键：显示菜单
const handleNodeContextMenu = (node: MindNode, e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    selectedId.value = node.id;
    contextMenu.visible = true;
    contextMenu.nodeId = node.id;
    contextMenu.x = e.clientX;
    contextMenu.y = e.clientY;
};

// 关闭菜单
const hideContextMenu = () => {
    contextMenu.visible = false;
    contextMenu.nodeId = null;
};

// 菜单：重命名
const handleMenuRename = () => {
    if (!contextMenu.nodeId) return;
    const node = findNodeById(rootNode.value, contextMenu.nodeId);
    hideContextMenu();
    if (!node) return;

    editingId.value = node.id;
    editTitle.value = node.title;
};

// 菜单：新增子节点
const handleMenuAddChild = () => {
    if (!contextMenu.nodeId) return;
    const id = contextMenu.nodeId;
    hideContextMenu();
    addChildNode(id);
};

// 菜单：删除节点
const handleMenuDelete = () => {
    if (!contextMenu.nodeId) return;
    const id = contextMenu.nodeId;
    hideContextMenu();

    if (id === rootNode.value.id) {
        // 根节点不删，简单忽略
        return;
    }
    removeNodeById(id);
    if (selectedId.value === id) {
        selectedId.value = null;
    }
    if (editingId.value === id) {
        editingId.value = null;
        editTitle.value = '';
    }
};

// 编辑提交 / 取消
const commitEdit = () => {
    if (!editingId.value) return;
    const node = findNodeById(rootNode.value, editingId.value);
    if (node) {
        const text = editTitle.value.trim();
        node.title = text || '未命名节点';
    }
    editingId.value = null;
    editTitle.value = '';
};

const cancelEdit = () => {
    editingId.value = null;
    editTitle.value = '';
};

onBeforeUnmount(() => {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
});
</script>

<template>
    <div class="canvas-wrapper">
        <div class="canvas-inner" @click="handleCanvasClick">
            <!-- 连线 -->
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
                <!-- 编辑状态：显示输入框 -->
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

                <!-- 普通状态：显示文本 -->
                <template v-else>
                    {{ node.title }}
                </template>
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
                    <li @click.stop="handleMenuAddChild">新增子节点</li>
                    <li @click.stop="handleMenuRename">重命名</li>
                    <li class="danger" @click.stop="handleMenuDelete">删除</li>
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
}

.canvas-lines {
    position: absolute;
    top: 0;
    left: 0;
    /* ✅ 关键：明确宽高 */
    width: 100%;
    height: 100%;
    z-index: 0;
    pointer-events: none;
    /* 调试用：先加个淡背景，方便看 svg 区域 */
    /* background: rgba(0, 0, 0, 0.03); */
}

.canvas-line-item {
    stroke: red; /* ✅ 先用红色 */
    stroke-width: 4; /* ✅ 粗一点 */
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

/* 右键菜单 */
.context-menu {
    position: fixed; /* 使用视口坐标 */
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
</style>
