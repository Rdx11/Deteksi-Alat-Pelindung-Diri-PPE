/**
 * Login Page
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HardHat, AlertCircle } from 'lucide-react'
import { authService } from '../services/authService'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

const LoginPage = () => {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({
    username: '',
    password: '',
    general: '',
  })
  
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
    
    // Clear error saat user mulai mengetik
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
        general: '',
      })
    }
  }
  
  const validateForm = () => {
    const newErrors = {
      username: '',
      password: '',
      general: '',
    }
    
    // Validasi username
    if (!formData.username.trim()) {
      newErrors.username = 'Username tidak boleh kosong'
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username minimal 3 karakter'
    }
    
    // Validasi password
    if (!formData.password) {
      newErrors.password = 'Password tidak boleh kosong'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password minimal 6 karakter'
    }
    
    setErrors(newErrors)
    return !newErrors.username && !newErrors.password
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Clear previous errors
    setErrors({
      username: '',
      password: '',
      general: '',
    })
    
    // Validasi form
    if (!validateForm()) {
      return
    }
    
    setIsLoading(true)
    
    try {
      const response = await authService.login(formData.username, formData.password)
      setAuth(response.user, response.access, response.refresh)
      toast.success('Login berhasil!')
      navigate('/dashboard')
    } catch (error) {
      console.error('Login error:', error)
      
      // Handle different error types
      if (error.response) {
        const status = error.response.status
        const data = error.response.data
        
        if (status === 401) {
          // Unauthorized - wrong credentials
          setErrors({
            username: '',
            password: '',
            general: 'Username atau password salah. Silakan coba lagi.',
          })
          toast.error('Username atau password salah')
        } else if (status === 400) {
          // Bad request - validation errors
          if (data.username) {
            setErrors(prev => ({ ...prev, username: data.username[0] }))
          }
          if (data.password) {
            setErrors(prev => ({ ...prev, password: data.password[0] }))
          }
          if (data.detail) {
            setErrors(prev => ({ ...prev, general: data.detail }))
          }
          toast.error('Data login tidak valid')
        } else if (status === 404) {
          // User not found
          setErrors({
            username: '',
            password: '',
            general: 'Akun tidak ditemukan. Silakan periksa username Anda.',
          })
          toast.error('Akun tidak ditemukan')
        } else {
          // Other errors
          setErrors({
            username: '',
            password: '',
            general: data.detail || 'Terjadi kesalahan. Silakan coba lagi.',
          })
          toast.error('Login gagal')
        }
      } else if (error.request) {
        // Network error
        setErrors({
          username: '',
          password: '',
          general: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.',
        })
        toast.error('Koneksi gagal')
      } else {
        // Other errors
        setErrors({
          username: '',
          password: '',
          general: 'Terjadi kesalahan. Silakan coba lagi.',
        })
        toast.error('Login gagal')
      }
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <HardHat className="w-16 h-16 text-primary mb-4" />
          <h1 className="text-3xl font-bold text-gray-800">PPE Detection</h1>
          <p className="text-gray-600 mt-2">Sistem Deteksi Alat Pelindung Diri</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Error Message */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{errors.general}</span>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                errors.username 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300'
              }`}
              placeholder="Masukkan username"
              disabled={isLoading}
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.username}
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                errors.password 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300'
              }`}
              placeholder="Masukkan password"
              disabled={isLoading}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.password}
              </p>
            )}
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Memproses...
              </span>
            ) : (
              'Login'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default LoginPage
