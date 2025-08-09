import { motion } from 'framer-motion'
import { FiHome, FiPlus, FiUser, FiSearch } from 'react-icons/fi'

function Header({ currentView, onViewChange }) {
  return (
    <motion.header 
      className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200"
      initial={{ y: -60 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <motion.div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => onViewChange('home')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-2xl">🍳</span>
            <h1 className="text-xl font-bold gradient-text">CookTogether</h1>
          </motion.div>
          
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search recipes..." 
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50"
              />
            </div>
          </div>
          
          <nav className="flex items-center gap-2">
            <motion.button
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                currentView === 'home' 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
              onClick={() => onViewChange('home')}
              whileHover={{ y: -2 }}
              whileTap={{ y: 0 }}
            >
              <FiHome className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </motion.button>
            
            <motion.button
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                currentView === 'add' 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
              onClick={() => onViewChange('add')}
              whileHover={{ y: -2 }}
              whileTap={{ y: 0 }}
            >
              <FiPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Recipe</span>
            </motion.button>
            
            <motion.button
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200"
              whileHover={{ y: -2 }}
              whileTap={{ y: 0 }}
            >
              <FiUser className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </motion.button>
          </nav>
        </div>
      </div>
    </motion.header>
  )
}

export default Header