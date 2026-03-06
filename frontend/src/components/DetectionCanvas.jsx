/**
 * Canvas component untuk menampilkan hasil deteksi dengan bounding boxes
 */
import { useEffect, useRef } from 'react'

const DetectionCanvas = ({ result }) => {
  const canvasRef = useRef(null)
  const imageRef = useRef(null)
  
  useEffect(() => {
    if (result?.annotated_image) {
      const img = new Image()
      img.src = result.annotated_image
      img.onload = () => {
        imageRef.current = img
        drawCanvas()
      }
    }
  }, [result])
  
  const drawCanvas = () => {
    const canvas = canvasRef.current
    const img = imageRef.current
    
    if (!canvas || !img) return
    
    const ctx = canvas.getContext('2d')
    canvas.width = img.width
    canvas.height = img.height
    
    // Gambar image
    ctx.drawImage(img, 0, 0)
  }
  
  if (!result?.annotated_image) {
    return null
  }
  
  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="w-full rounded-lg border border-gray-200"
      />
    </div>
  )
}

export default DetectionCanvas
