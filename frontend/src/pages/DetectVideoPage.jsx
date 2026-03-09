/**
 * Detect Video Page dengan progress tracking dan hasil deteksi
 */
import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Video as VideoIcon, CheckCircle, AlertCircle, BarChart3, Info } from 'lucide-react'
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
  const [trackingStats, setTrackingStats] = useState(null)
  
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
    setProgress(0)
    setStatus('PROCESSING')
    
    try {
      const formData = new FormData()
      formData.append('video', selectedFile)
      formData.append('name', selectedFile.name)
      
      // Simulate progress (karena proses synchronous)
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev
          return prev + 10
        })
      }, 1000)
      
      const response = await detectionService.detectVideo(formData)
      
      clearInterval(progressInterval)
      setProgress(100)
      setStatus('SUCCESS')
      setIsProcessing(false)
      
      // Set session data
      if (response.session) {
        setSessionData(response.session)
        setSessionId(response.session.id)
      }
      
      // Show tracking stats if available
      if (response.stats?.tracking) {
        const trackingStats = response.stats.tracking
        setTrackingStats(trackingStats)
        toast.success(
          `Video berhasil diproses! ${trackingStats.total_unique_objects} objek unik terdeteksi.`,
          { duration: 5000 }
        )
      } else {
        toast.success(response.message || 'Video berhasil diproses!')
      }
      
      // Load detection results with a small delay to ensure DB commit
      if (response.session?.id) {
        setTimeout(() => {
          loadSessionData(response.session.id)
        }, 500)
      }
    } catch (error) {
      setStatus('FAILURE')
      setIsProcessing(false)
      toast.error('Gagal memproses video: ' + (error.response?.data?.error || error.message))
    }
  }
  
  const loadSessionData = async (sessId) => {
    try {
      console.log('Loading results for session:', sessId)
      
      // Load detection results for this session
      const response = await detectionService.getResults({ session: sessId })
      
      console.log('Detection results response:', response)
      console.log('Response type:', typeof response)
      console.log('Is array:', Array.isArray(response))
      
      // Handle both array response and paginated response
      let results = []
      if (Array.isArray(response)) {
        results = response
      } else if (response && response.results) {
        results = response.results
      } else if (response && typeof response === 'object') {
        // If response is a single object, wrap it in array
        results = [response]
      }
      
      console.log('Processed results:', results)
      
      if (results && results.length > 0) {
        setDetectionResults(results)
        toast.success(`Berhasil memuat ${results.length} hasil deteksi`)
      } else {
        console.warn('No results found in response')
        toast.info('Tidak ada hasil deteksi ditemukan')
      }
    } catch (error) {
      console.error('Error loading session data:', error)
      console.error('Error response:', error.response)
      toast.error('Gagal memuat hasil deteksi: ' + (error.response?.data?.detail || error.message))
    }
  }
  
  // Calculate aggregate metrics from all detection results using unique track IDs
  const calculateAggregateMetrics = () => {
    if (detectionResults.length === 0) return null
    
    // Collect unique track IDs across all frames
    const uniquePersonTracks = new Set()
    const uniqueHelmetTracks = new Set()
    const uniqueVestTracks = new Set()
    const uniqueNoHelmetTracks = new Set()
    const uniqueNoVestTracks = new Set()
    
    // Iterate through all frames and collect unique track IDs
    detectionResults.forEach(result => {
      if (result.detections && Array.isArray(result.detections)) {
        result.detections.forEach(det => {
          const trackId = det.track_id
          const className = det.class_name
          
          // Only count if track_id exists (tracking enabled)
          if (trackId !== undefined && trackId !== null) {
            if (className === 'person') {
              uniquePersonTracks.add(trackId)
            } else if (className === 'hardhat' || className === 'helmet') {
              uniqueHelmetTracks.add(trackId)
            } else if (className === 'safety-vest' || className === 'vest') {
              uniqueVestTracks.add(trackId)
            } else if (className === 'no-hardhat' || className === 'no-helmet') {
              uniqueNoHelmetTracks.add(trackId)
            } else if (className === 'no-safety-vest' || className === 'no-vest') {
              uniqueNoVestTracks.add(trackId)
            }
          }
        })
      }
    })
    
    // Calculate totals from unique tracks
    const totalPersons = uniquePersonTracks.size || Math.max(
      uniqueHelmetTracks.size + uniqueNoHelmetTracks.size,
      uniqueVestTracks.size + uniqueNoVestTracks.size
    )
    
    const withHelmet = uniqueHelmetTracks.size
    const withVest = uniqueVestTracks.size
    const withoutHelmet = uniqueNoHelmetTracks.size
    const withoutVest = uniqueNoVestTracks.size
    
    // Calculate average compliance from all frames
    const avgCompliance = detectionResults.reduce((sum, r) => sum + (r.compliance_score || 0), 0) / detectionResults.length
    
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
              {/* Tracking Statistics (if available) */}
              {trackingStats && (
                <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <h3 className="text-sm font-semibold text-indigo-800 mb-3 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    <span>Tracking Statistics (Unique Objects)</span>
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white p-3 rounded">
                      <p className="text-xs text-indigo-600">Total Unique</p>
                      <p className="text-xl font-bold text-indigo-800">
                        {trackingStats.total_unique_objects}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <p className="text-xs text-indigo-600">Frames Processed</p>
                      <p className="text-xl font-bold text-indigo-800">
                        {trackingStats.frame_count}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <p className="text-xs text-indigo-600">Active Tracks</p>
                      <p className="text-xl font-bold text-indigo-800">
                        {trackingStats.active_tracks}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-indigo-600 mt-2 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    <span>Metrics di bawah dihitung dari unique track IDs untuk menghindari double counting</span>
                  </p>
                </div>
              )}
              
              {/* Aggregate Metrics Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Unique Orang</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {metrics.totalPersons}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Berdasarkan tracking</p>
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
                            src={`/media/${result.annotated_image}`}
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
                                {det.track_id ? `#${det.track_id} ` : ''}{det.label}
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
