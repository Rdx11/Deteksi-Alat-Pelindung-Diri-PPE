/**
 * Detect Video Page dengan progress tracking dan hasil deteksi
 */
import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Video as VideoIcon, CheckCircle, AlertCircle } from 'lucide-react'
import { detectionService } from '../services/detectionService'
import toast from 'react-hot-toast'

const DetectVideoPage = () => {
  const [selectedFile, setSelectedFile] = useState(null)
  const [taskId, setTaskId] = useState(null)
  const [sessionId, setSessionId] = useState(null)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [sessionData, setSessionData] = useState(null)
  const [detectionResults, setDetectionResults] = useState([])
  
  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0]
    if (file) {
      setSelectedFile(file)
      setTaskId(null)
      setSessionId(null)
      setProgress(0)
      setStatus(null)
      setSessionData(null)
      setDetectionResults([])
    }
  }
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'video/*': ['.mp4', '.avi', '.mov'] },
    multiple: false,
  })
  
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Pilih video terlebih dahulu')
      return
    }
    
    setIsProcessing(true)
    
    try {
      const formData = new FormData()
      formData.append('video', selectedFile)
      formData.append('name', selectedFile.name)
      
      const response = await detectionService.detectVideo(formData)
      setTaskId(response.task_id)
      setSessionId(response.session_id)
      toast.success('Video berhasil diupload. Sedang diproses...')
      
      // Start polling task status
      pollTaskStatus(response.task_id, response.session_id)
    } catch (error) {
      toast.error('Gagal upload video: ' + (error.response?.data?.error || error.message))
      setIsProcessing(false)
    }
  }
  
  const pollTaskStatus = async (id, sessId) => {
    const interval = setInterval(async () => {
      try {
        const response = await detectionService.checkTaskStatus(id)
        setStatus(response.status)
        
        if (response.status === 'PROGRESS') {
          setProgress(response.progress || 0)
        } else if (response.status === 'SUCCESS') {
          setProgress(100)
          setIsProcessing(false)
          toast.success('Video berhasil diproses!')
          clearInterval(interval)
          
          // Load session data dan hasil deteksi
          loadSessionData(sessId)
        } else if (response.status === 'FAILURE') {
          setIsProcessing(false)
          toast.error('Gagal memproses video')
          clearInterval(interval)
        }
      } catch (error) {
        console.error('Error polling task:', error)
      }
    }, 2000)
  }
  
  const loadSessionData = async (sessId) => {
    try {
      const session = await detectionService.getSession(sessId)
      setSessionData(session)
      
      // Load detection results
      if (session.results && session.results.length > 0) {
        setDetectionResults(session.results)
      }
    } catch (error) {
      console.error('Error loading session data:', error)
      toast.error('Gagal memuat hasil deteksi')
    }
  }
  
  // Calculate aggregate metrics from all detection results
  const calculateAggregateMetrics = () => {
    if (detectionResults.length === 0) return null
    
    const totalPersons = detectionResults.reduce((sum, r) => sum + (r.total_persons || 0), 0)
    const avgCompliance = detectionResults.reduce((sum, r) => sum + (r.compliance_score || 0), 0) / detectionResults.length
    const withHelmet = detectionResults.reduce((sum, r) => sum + (r.persons_with_helmet || 0), 0)
    const withVest = detectionResults.reduce((sum, r) => sum + (r.persons_with_vest || 0), 0)
    const withoutHelmet = detectionResults.reduce((sum, r) => sum + (r.persons_without_helmet || 0), 0)
    const withoutVest = detectionResults.reduce((sum, r) => sum + (r.persons_without_vest || 0), 0)
    
    return {
      totalPersons,
      avgCompliance: avgCompliance.toFixed(1),
      withHelmet,
      withVest,
      withoutHelmet,
      withoutVest,
    }
  }
  
  const metrics = calculateAggregateMetrics()
  
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Deteksi Video</h1>
        <p className="text-gray-600 mt-2">Upload video untuk deteksi PPE secara batch</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Upload Video</h2>
          
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-primary bg-blue-50' : 'border-gray-300 hover:border-primary'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            {isDragActive ? (
              <p className="text-primary">Drop video di sini...</p>
            ) : (
              <div>
                <p className="text-gray-600">Drag & drop video atau klik untuk memilih</p>
                <p className="text-sm text-gray-400 mt-2">Format: MP4, AVI, MOV</p>
              </div>
            )}
          </div>
          
          {selectedFile && (
            <div className="mt-6">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <VideoIcon className="w-8 h-8 text-primary" />
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              
              {!isProcessing && !taskId && (
                <button
                  onClick={handleUpload}
                  className="w-full mt-4 bg-primary text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
                >
                  Upload & Proses Video
                </button>
              )}
            </div>
          )}
          
          {isProcessing && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Progress</span>
                <span className="text-sm font-medium text-primary">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-primary h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-2 text-center">
                {status === 'PROGRESS' ? 'Memproses video...' : 'Menunggu...'}
              </p>
            </div>
          )}
          
          {status === 'SUCCESS' && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Video berhasil diproses!</p>
                  <p className="text-sm text-green-600">
                    {detectionResults.length} frame telah dianalisis
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {status === 'FAILURE' && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-red-600" />
                <div>
                  <p className="font-medium text-red-800">Gagal memproses video</p>
                  <p className="text-sm text-red-600">Silakan coba lagi</p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Results Section */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Hasil Deteksi</h2>
          
          {metrics ? (
            <div>
              {/* Aggregate Metrics Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Deteksi Orang</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {metrics.totalPersons}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Avg Compliance</p>
                  <p className="text-2xl font-bold text-green-600">
                    {metrics.avgCompliance}%
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Dengan Helm</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {metrics.withHelmet}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Dengan Rompi</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {metrics.withVest}
                  </p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Tanpa Helm</p>
                  <p className="text-2xl font-bold text-red-600">
                    {metrics.withoutHelmet}
                  </p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Tanpa Rompi</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {metrics.withoutVest}
                  </p>
                </div>
              </div>
              
              {/* Frame-by-Frame Results */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Detail Per Frame ({detectionResults.length} frames)
                </h3>
                <div className="max-h-96 overflow-y-auto space-y-3">
                  {detectionResults.map((result, index) => (
                    <div
                      key={result.id || index}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-medium text-gray-800">
                            Frame {result.frame_number}
                          </p>
                          <p className="text-sm text-gray-500">
                            Timestamp: {result.timestamp?.toFixed(2)}s
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            result.compliance_score >= 80
                              ? 'bg-green-100 text-green-800'
                              : result.compliance_score >= 50
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {result.compliance_score}% Compliance
                        </span>
                      </div>
                      
                      {/* Frame Metrics */}
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="bg-gray-50 p-2 rounded">
                          <p className="text-gray-600 text-xs">Orang</p>
                          <p className="font-semibold text-gray-800">
                            {result.total_persons || 0}
                          </p>
                        </div>
                        <div className="bg-blue-50 p-2 rounded">
                          <p className="text-gray-600 text-xs">+ Helm</p>
                          <p className="font-semibold text-blue-600">
                            {result.persons_with_helmet || 0}
                          </p>
                        </div>
                        <div className="bg-red-50 p-2 rounded">
                          <p className="text-gray-600 text-xs">- Helm</p>
                          <p className="font-semibold text-red-600">
                            {result.persons_without_helmet || 0}
                          </p>
                        </div>
                      </div>
                      
                      {/* Annotated Image Preview */}
                      {result.annotated_image && (
                        <div className="mt-3">
                          <img
                            src={`http://localhost/media/${result.annotated_image}`}
                            alt={`Frame ${result.frame_number}`}
                            className="w-full rounded border border-gray-200"
                            loading="lazy"
                            onError={(e) => {
                              console.error('Image load error:', e.target.src)
                              e.target.style.display = 'none'
                            }}
                          />
                        </div>
                      )}
                      
                      {/* Detection Details */}
                      {result.detections && result.detections.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs text-gray-600 mb-2">
                            {result.detections.length} objek terdeteksi
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {result.detections.slice(0, 5).map((det, idx) => (
                              <span
                                key={idx}
                                className={`px-2 py-1 rounded text-xs ${
                                  det.status === 'safe'
                                    ? 'bg-green-100 text-green-700'
                                    : det.status === 'danger'
                                    ? 'bg-red-100 text-red-700'
                                    : det.status === 'warning'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-blue-100 text-blue-700'
                                }`}
                              >
                                {det.label}
                              </span>
                            ))}
                            {result.detections.length > 5 && (
                              <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-600">
                                +{result.detections.length - 5} lainnya
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <VideoIcon className="w-16 h-16 mb-4" />
              <p>Upload dan proses video untuk melihat hasil</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DetectVideoPage
