/**
 * Dashboard Page dengan statistics dan charts
 */
import { useQuery } from '@tanstack/react-query'
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Activity, AlertTriangle, CheckCircle, Users } from 'lucide-react'
import { detectionService } from '../services/detectionService'

const DashboardPage = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => detectionService.getDashboardStats(7),
  })
  
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
  
  const statCards = [
    {
      title: 'Total Sesi',
      value: stats?.summary?.total_sessions || 0,
      icon: Activity,
      color: 'bg-blue-500',
    },
    {
      title: 'Total Deteksi',
      value: stats?.summary?.total_detections || 0,
      icon: Users,
      color: 'bg-green-500',
    },
    {
      title: 'Compliance Score',
      value: `${stats?.summary?.avg_compliance || 0}%`,
      icon: CheckCircle,
      color: 'bg-purple-500',
    },
    {
      title: 'Peringatan Aktif',
      value: stats?.summary?.unacknowledged_alerts || 0,
      icon: AlertTriangle,
      color: 'bg-red-500',
    },
  ]
  
  // Data untuk pie chart
  const pieData = [
    { name: 'Tanpa Helm', value: stats?.violations?.no_helmet || 0, color: '#ef4444' },
    { name: 'Tanpa Rompi', value: stats?.violations?.no_vest || 0, color: '#f59e0b' },
  ]
  
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600 mt-2">Monitoring compliance keselamatan kerja</p>
      </div>
      
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart - Compliance Trend */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Tren Compliance (7 Hari)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats?.compliance_trend || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="avg_score" stroke="#3b82f6" name="Compliance Score" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Pie Chart - Violations */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Pelanggaran PPE</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
