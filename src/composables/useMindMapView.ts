// src/composables/useMindMapView.ts
import { ref } from 'vue'

export function useMindMapView() {
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

  const startPan = (e: MouseEvent) => {
    if (e.button !== 0) return
    e.preventDefault()

    isPanning.value = true
    panState.value = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: translateX.value,
      startY: translateY.value
    }

    window.addEventListener('mousemove', handlePanMove)
    window.addEventListener('mouseup', stopPan)
  }

  const handlePanMove = (e: MouseEvent) => {
    if (!isPanning.value) return
    const dx = e.clientX - panState.value.mouseX
    const dy = e.clientY - panState.value.mouseY
    translateX.value = panState.value.startX + dx
    translateY.value = panState.value.startY + dy
  }

  const stopPan = () => {
    isPanning.value = false
    window.removeEventListener('mousemove', handlePanMove)
    window.removeEventListener('mouseup', stopPan)
  }

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

  const cleanup = () => {
    window.removeEventListener('mousemove', handlePanMove)
    window.removeEventListener('mouseup', stopPan)
    window.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('keyup', handleKeyUp)
  }

  // 给外层组件去绑定 keydown/keyup
  const initKeyListeners = () => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
  }

  return {
    scale,
    translateX,
    translateY,
    isSpacePressed,

    handleWheel,
    startPan,
    initKeyListeners,
    cleanup
  }
}
