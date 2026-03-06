/**
 * Detect Image Page dengan drag & drop upload
 */
import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Image as ImageIcon } from 'lucide-react'
import { detectionService } from '../services/detectionService'
import DetectionCanvas from '../components/DetectionCanvas'
import toast from 'react-hot-toast'

const DetectImagePage = () => {
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  
  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0]
    if (file) {
      setSelectedFile(file)
      setPreview(URL.createObjectURL(file))
      setResult(null)
    }
  }
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png'] },
    multiple: false,
  })
  
  const handleDetect = async () => {
    if (!selectedFile) {
      toast.error('Pilih gambar terlebih dahulu')
      return
    }
    
    setIsProcessing(true)
    
    try {
      const formData = new FormData()
      formData.append('image', selectedFile)
      formData.append('name', selectedFile.name)
      
      const response = await detectionService.detectImage(formData)
      setResult(response)
      toast.success('Deteksi berhasil!')
    } catch (error) {
      toast.error('Gagal melakukan deteksi: ' + (error.response?.data?.error || error.message))
    } finally {
      setIsProcessing(false)
    }
  }
  
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Deteksi Gambar</h1>
        <p className="text-gray-600 mt-2">Upload gambar untuk mendeteksi penggunaan PPE</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Area */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Upload Gambar</h2>
          
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-primary bg-blue-50' : 'border-gray-300 hover:border-primary'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            {isDragActive ? (
              <p className="text-primary">Drop gambar di sini...</p>
            ) : (
              <div>
                <p className="text-gray-600">Drag & drop gambar atau klik untuk memilih</p>
                <p className="text-sm text-gray-400 mt-2">Format: JPG, PNG</p>
              </div>
            )}
          </div>
          
          {preview && (
            <div className="mt-6">
              <img src={preview} alt="Preview" className="w-full rounded-lg" />
              <button
                onClick={handleDetect}
                disabled={isProcessing}
                className="w-full mt-4 bg-primary text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {isProcessing ? 'Memproses...' : 'Deteksi PPE'}
              </button>
            </div>
          )}
        </div>
        
        {/* Result Area */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Hasil Deteksi</h2>
          
          {result ? (
            <div>
              <DetectionCanvas result={result.result} />
              
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Orang</p>
                  <p className="text-2xl font-bold text-gray-800">{result.result.total_persons}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Compliance Score</p>
                  <p className="text-2xl font-bold text-green-600">{result.result.compliance_score}%</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Tanpa Helm</p>
                  <p className="text-2xl font-bold text-red-600">{result.result.persons_without_helmet}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Tanpa Rompi</p>
                  <p className="text-2xl font-bold text-yellow-600">{result.result.persons_without_vest}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <ImageIcon className="w-16 h-16 mb-4" />
              <p>Hasil deteksi akan muncul di sini</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DetectImagePage
