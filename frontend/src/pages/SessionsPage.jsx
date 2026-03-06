/**
 * Sessions Page - Riwayat sesi deteksi
 */
import { useQuery } from '@tanstack/react-query'
import { Image, Video, Camera, Calendar } from 'lucide-react'
import { detectionService } from '../services/detectionService'

const SessionsPage = () => {
  const { data: sessions, isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: detectionService.getSessions,
  })
  
  const getSessionIcon = (type) => {
    switch (type) {
      case 'image': return Image
      case 'video': return Video
      case 'live': return Camera
      default: return Image
    }
  }
  
  const getSessionColor = (type) => {
    switch (type) {
      case 'image': return 'bg-blue-100 text-blue-600'
      case 'video': return 'bg-purple-100 text-purple-600'
      case 'live': return 'bg-green-100 text-green-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Riwayat Sesi</h1>
        <p className="text-gray-600 mt-2">Daftar semua sesi deteksi yang telah dilakukan</p>
      </div>
      
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipe
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hasil
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Compliance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sessions?.results?.map((session) => {
                const Icon = getSessionIcon(session.session_type)
                const colorClass = getSessionColor(session.session_type)
                
                return (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${colorClass}`}>
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium capitalize">{session.session_type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{session.name}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-900">{session.results_count} deteksi</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {session.latest_result && (
                        <span className="text-sm font-medium text-green-600">
                          {session.latest_result.compliance_score}%
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        {new Date(session.created_at).toLocaleDateString('id-ID')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        session.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {session.is_active ? 'Aktif' : 'Selesai'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        
        {(!sessions?.results || sessions.results.length === 0) && (
          <div className="text-center py-12">
            <p className="text-gray-500">Belum ada sesi deteksi</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default SessionsPage
