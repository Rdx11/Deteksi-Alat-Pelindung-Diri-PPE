/**
 * Live Camera Detection Page dengan WebSocket
 */
import { useState, useRef, useEffect } from 'react'
import Webcam from 'react-webcam'
import { Camera, StopCircle, Play, BarChart3 } from 'lucide-react'
import useLiveStore from '../store/liveStore'
import toast from 'react-hot-toast'

const DetectLivePage = () => {
  const webcamRef = useRef(null)
  const sendFrameTimeoutRef = useRef(null)
  const fpsIntervalRef = useRef(null)
  const [sessionId] = useState(() => crypto.randomUUID())
  const { isLive, websocket, latestDetection, setLive, setWebsocket, setLatestDetection, disconnect } = useLiveStore()
  const [annotatedFrame, setAnnotatedFrame] = useState(null)
  const [fps, setFps] = useState(0)
  const [frameCount, setFrameCount] = useState(0)
  
  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (sendFrameTimeoutRef.current) {
        clearTimeout(sendFrameTimeoutRef.current)
      }
      if (fpsIntervalRef.current) {
        clearInterval(fpsIntervalRef.current)
      }
      disconnect()
    }
  }, [disconnect])
  
  useEffect(() => {
    // Calculate FPS
    if (isLive) {
      fpsIntervalRef.current = setInterval(() => {
        setFps(frameCount)
        setFrameCount(0)
      }, 1000)
    } else {
      if (fpsIntervalRef.current) {
        clearInterval(fpsIntervalRef.current)
      }
      setFps(0)
      setFrameCount(0)
    }
    
    return () => {
      if (fpsIntervalRef.current) {
        clearInterval(fpsIntervalRef.current)
      }
    }
  }, [isLive, frameCount])
  
  const startDetection = () => {
    // Buat WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws/detect/${sessionId}/`
    
    const ws = new WebSocket(wsUrl)
    
    ws.onopen = () => {
      console.log('WebSocket connected')
      setWebsocket(ws)
      setLive(true)
      toast.success('Live detection dimulai')
      
      // Start sending frames
      startSendingFrames(ws)
    }
    
    ws.onmessage = (event) => {
      console.log('Received WebSocket message:', event.data)
      const data = JSON.parse(event.data)
      
      if (data.error) {
        console.error('WebSocket error:', data.error)
        toast.error(data.error)
        return
      }
      
      console.log('Detection data:', data)
      setLatestDetection(data)
      setFrameCount(prev => prev + 1) // Increment frame count for FPS
      
      // Display annotated frame
      if (data.annotated_frame) {
        console.log('Setting annotated frame')
        setAnnotatedFrame(`data:image/jpeg;base64,${data.annotated_frame}`)
      } else {
        console.warn('No annotated_frame in response')
      }
    }
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      toast.error('WebSocket error')
    }
    
    ws.onclose = () => {
      console.log('WebSocket closed')
      setLive(false)
      setWebsocket(null)
    }
  }
  
  const startSendingFrames = (ws) => {
    const sendFrame = () => {
      if (!webcamRef.current || ws.readyState !== WebSocket.OPEN) {
        console.log('Cannot send frame:', {
          hasWebcam: !!webcamRef.current,
          wsState: ws.readyState,
          wsOpen: WebSocket.OPEN
        })
        return
      }
      
      const imageSrc = webcamRef.current.getScreenshot()
      if (imageSrc) {
        console.log('Sending frame to WebSocket...')
        ws.send(JSON.stringify({ frame: imageSrc }))
      } else {
        console.warn('No screenshot available from webcam')
      }
      
      // Schedule next frame
      sendFrameTimeoutRef.current = setTimeout(sendFrame, 200)
    }
    
    // Start sending frames
    sendFrame()
  }
  
  const stopDetection = () => {
    if (sendFrameTimeoutRef.current) {
      clearTimeout(sendFrameTimeoutRef.current)
    }
    disconnect()
    setAnnotatedFrame(null)
    toast.success('Live detection dihentikan')
  }
  
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Live Camera Detection</h1>
        <p className="text-gray-600 mt-2">Deteksi PPE secara real-time menggunakan kamera</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Camera Feed */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Camera Feed</h2>
            {isLive && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-600">LIVE</span>
                </div>
                <div className="text-sm font-medium text-gray-600">
                  {fps} FPS
                </div>
              </div>
            )}
          </div>
          
          <div className="relative bg-black rounded-lg overflow-hidden">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              className="w-full"
              videoConstraints={{
                width: 640,
                height: 480,
                facingMode: 'user',
              }}
            />
            {isLive && (
              <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm font-medium">
                Detecting...
              </div>
            )}
          </div>
          
          <div className="mt-4 flex gap-3">
            {!isLive ? (
              <button
                onClick={startDetection}
                className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600 transition-colors"
              >
                <Play className="w-5 h-5" />
                Mulai Deteksi
              </button>
            ) : (
              <button
                onClick={stopDetection}
                className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white py-3 rounded-lg font-medium hover:bg-red-600 transition-colors"
              >
                <StopCircle className="w-5 h-5" />
                Stop Deteksi
              </button>
            )}
          </div>
        </div>
        
        {/* Detection Result */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Hasil Deteksi</h2>
          
          {annotatedFrame ? (
            <div>
              {/* Annotated Image */}
              <div className="relative">
                <img 
                  src={annotatedFrame} 
                  alt="Annotated" 
                  className="w-full rounded-lg border border-gray-200" 
                />
              </div>
              
              {/* Metrics Grid */}
              {latestDetection && (
                <div className="mt-6">
                  {/* Tracking Stats (if available) */}
                  {latestDetection.tracking_stats && (
                    <div className="mb-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                      <h3 className="text-sm font-semibold text-indigo-800 mb-2 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        <span>Tracking Statistics</span>
                      </h3>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <p className="text-indigo-600">Total Unique</p>
                          <p className="text-lg font-bold text-indigo-800">
                            {latestDetection.tracking_stats.total_unique_objects}
                          </p>
                        </div>
                        <div>
                          <p className="text-indigo-600">Active Tracks</p>
                          <p className="text-lg font-bold text-indigo-800">
                            {latestDetection.tracking_stats.active_tracks}
                          </p>
                        </div>
                        <div>
                          <p className="text-indigo-600">Frames</p>
                          <p className="text-lg font-bold text-indigo-800">
                            {latestDetection.tracking_stats.frame_count}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Total Orang</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {latestDetection.metrics?.total_persons || 0}
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Compliance Score</p>
                      <p className="text-2xl font-bold text-green-600">
                        {latestDetection.metrics?.compliance_score || 0}%
                      </p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Dengan Helm</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {latestDetection.metrics?.persons_with_helmet || 0}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Dengan Rompi</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {latestDetection.metrics?.persons_with_vest || 0}
                      </p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Tanpa Helm</p>
                      <p className="text-2xl font-bold text-red-600">
                        {latestDetection.metrics?.persons_without_helmet || 0}
                      </p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Tanpa Rompi</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {latestDetection.metrics?.persons_without_vest || 0}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Detection Details */}
              {latestDetection?.detections && latestDetection.detections.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    Detail Deteksi ({latestDetection.detections.length})
                  </h3>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {latestDetection.detections.map((detection, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border-l-4 ${
                          detection.status === 'safe'
                            ? 'bg-green-50 border-green-500'
                            : detection.status === 'danger'
                            ? 'bg-red-50 border-red-500'
                            : detection.status === 'warning'
                            ? 'bg-yellow-50 border-yellow-500'
                            : 'bg-blue-50 border-blue-500'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-800">
                              {detection.track_id && (
                                <span className="inline-block px-2 py-0.5 mr-2 text-xs font-bold bg-indigo-100 text-indigo-700 rounded">
                                  #{detection.track_id}
                                </span>
                              )}
                              {detection.label}
                            </p>
                            <p className="text-sm text-gray-600">
                              Confidence: {(detection.confidence * 100).toFixed(1)}%
                              {detection.hits && ` • Hits: ${detection.hits}`}
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              detection.status === 'safe'
                                ? 'bg-green-100 text-green-800'
                                : detection.status === 'danger'
                                ? 'bg-red-100 text-red-800'
                                : detection.status === 'warning'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {detection.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Timestamp */}
              {latestDetection?.timestamp && (
                <div className="mt-4 text-sm text-gray-500 text-center">
                  Last update: {new Date(latestDetection.timestamp).toLocaleTimeString('id-ID')}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Camera className="w-16 h-16 mb-4" />
              <p>Mulai deteksi untuk melihat hasil</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DetectLivePage
