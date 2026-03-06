/**
 * Alerts Page - Manajemen peringatan
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { detectionService } from '../services/detectionService'
import toast from 'react-hot-toast'

const AlertsPage = () => {
  const queryClient = useQueryClient()
  
  const { data: alerts, isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: detectionService.getAlerts,
  })
  
  const acknowledgeMutation = useMutation({
    mutationFn: detectionService.acknowledgeAlert,
    onSuccess: () => {
      queryClient.invalidateQueries(['alerts'])
      toast.success('Alert berhasil di-acknowledge')
    },
  })
  
  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'danger': return AlertTriangle
      case 'warning': return AlertTriangle
      case 'info': return Info
      default: return Info
    }
  }
  
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'danger': return 'bg-red-100 text-red-600 border-red-200'
      case 'warning': return 'bg-yellow-100 text-yellow-600 border-yellow-200'
      case 'info': return 'bg-blue-100 text-blue-600 border-blue-200'
      default: return 'bg-gray-100 text-gray-600 border-gray-200'
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
        <h1 className="text-3xl font-bold text-gray-800">Peringatan</h1>
        <p className="text-gray-600 mt-2">Manajemen alert dan peringatan keselamatan</p>
      </div>
      
      <div className="space-y-4">
        {alerts?.results?.map((alert) => {
          const Icon = getSeverityIcon(alert.severity)
          const colorClass = getSeverityColor(alert.severity)
          
          return (
            <div
              key={alert.id}
              className={`bg-white rounded-xl shadow-md p-6 border-l-4 ${colorClass}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <Icon className="w-6 h-6 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800">{alert.title}</h3>
                    <p className="text-gray-600 mt-1">{alert.message}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {new Date(alert.created_at).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
                
                <div className="ml-4">
                  {alert.is_acknowledged ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">Acknowledged</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => acknowledgeMutation.mutate(alert.id)}
                      disabled={acknowledgeMutation.isLoading}
                      className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        
        {(!alerts?.results || alerts.results.length === 0) && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="text-gray-500">Tidak ada peringatan</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AlertsPage
