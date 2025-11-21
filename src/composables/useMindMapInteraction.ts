// src/composables/useMindMapInteraction.ts
import { computed, reactive, ref, onBeforeUnmount } from 'vue';
import type { MindNode } from '../types/mindmap';
import {
    findNodeById,
    removeNodeById,
    addChildNode
} from '../utils/mindmapTree';

interface Line {
    id: string;
    from: MindNode;
    to: MindNode;
}

export function useMindMapInteraction(
    root: () => MindNode,
    scale: () => number
) {
    const selectedId = ref<string | null>(root().id);
    const draggingNodeId = ref<string | null>(null);
    const dragState = ref({
        mouseX: 0,
        mouseY: 0,
        nodeX: 0,
        nodeY: 0
    });

    const editingId = ref<string | null>(null);
    const editTitle = ref('');

    const contextMenu = reactive({
        visible: false,
        x: 0,
        y: 0,
        nodeId: null as string | null
    });

    // 拍平节点
    const flatNodes = computed<MindNode[]>(() => {
        const result: MindNode[] = [];
        const dfs = (node: MindNode) => {
            result.push(node);
            node.children?.forEach(child => dfs(child));
        };
        dfs(root());
        return result;
    });

    // 生成连线
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
        walk(root());
        return result;
    });

    // 画布点击
    const handleCanvasClick = () => {
        selectedId.value = null;
        hideContextMenu();
    };

    // 节点拖拽
    const handleNodeMouseDown = (node: MindNode, e: MouseEvent) => {
        if (e.button !== 0) return;
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

    const handleMouseMove = (e: MouseEvent) => {
        if (!draggingNodeId.value) return;
        const node = findNodeById(root(), draggingNodeId.value);
        if (!node) return;

        const s = scale();
        const dx = (e.clientX - dragState.value.mouseX) / s;
        const dy = (e.clientY - dragState.value.mouseY) / s;

        node.x = dragState.value.nodeX + dx;
        node.y = dragState.value.nodeY + dy;
    };

    const handleMouseUp = () => {
        draggingNodeId.value = null;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };

    // 右键菜单
    const handleNodeContextMenu = (node: MindNode, e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        selectedId.value = node.id;
        contextMenu.visible = true;
        contextMenu.nodeId = node.id;
        contextMenu.x = e.clientX;
        contextMenu.y = e.clientY;
    };

    const hideContextMenu = () => {
        contextMenu.visible = false;
        contextMenu.nodeId = null;
    };

    const handleMenuRename = () => {
        if (!contextMenu.nodeId) return;
        const node = findNodeById(root(), contextMenu.nodeId);
        hideContextMenu();
        if (!node) return;
        editingId.value = node.id;
        editTitle.value = node.title;
    };

    const handleMenuAddChild = () => {
        if (!contextMenu.nodeId) return;
        const node = addChildNode(root(), contextMenu.nodeId);
        hideContextMenu();
        if (!node) return;
        selectedId.value = node.id;
        editingId.value = node.id;
        editTitle.value = node.title;
    };

    const handleMenuDelete = () => {
        if (!contextMenu.nodeId) return;
        const targetId = contextMenu.nodeId;
        hideContextMenu();
        removeNodeById(root(), targetId);
        if (selectedId.value === targetId) selectedId.value = null;
        if (editingId.value === targetId) {
            editingId.value = null;
            editTitle.value = '';
        }
    };

    // 编辑
    const commitEdit = () => {
        if (!editingId.value) return;
        const node = findNodeById(root(), editingId.value);
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

    return {
        // 状态
        selectedId,
        flatNodes,
        lines,
        contextMenu,
        editingId,
        editTitle,

        // 画布
        handleCanvasClick,

        // 节点
        handleNodeMouseDown,
        handleNodeContextMenu,

        // 菜单操作
        handleMenuAddChild,
        handleMenuRename,
        handleMenuDelete,

        // 编辑
        commitEdit,
        cancelEdit
    };
}
