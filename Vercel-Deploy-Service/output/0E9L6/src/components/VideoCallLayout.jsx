import { motion } from 'framer-motion'
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiUsers, FiSettings } from 'react-icons/fi'

const mockParticipants = [
  { id: 1, name: 'Sarah Chen', avatar: 'S', muted: false, video: true },
  { id: 2, name: 'Mike Johnson', avatar: 'M', muted: true, video: true },
  { id: 3, name: 'Emma Davis', avatar: 'E', muted: false, video: false },
  { id: 4, name: 'Alex Rivera', avatar: 'A', muted: false, video: true },
]

function VideoCallLayout() {
  return (
    <motion.div
      className="card p-6 mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="font-semibold text-gray-900">Cook Together Session</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <FiUsers className="w-4 h-4" />
            <span className="text-sm">{mockParticipants.length} participants</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <motion.button
            className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiMic className="w-4 h-4 text-gray-700" />
          </motion.button>
          <motion.button
            className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiVideo className="w-4 h-4 text-gray-700" />
          </motion.button>
          <motion.button
            className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiSettings className="w-4 h-4 text-gray-700" />
          </motion.button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {mockParticipants.map((participant, index) => (
          <motion.div
            key={participant.id}
            className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            {participant.video ? (
              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {participant.avatar}
                </div>
              </div>
            ) : (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {participant.avatar}
                </div>
              </div>
            )}
            
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
              <div className="flex items-center justify-between">
                <span className="text-white text-sm font-medium">{participant.name}</span>
                <div className="flex gap-1">
                  {!participant.muted && <FiMic className="w-3 h-3 text-green-400" />}
                  {participant.muted && <FiMicOff className="w-3 h-3 text-red-400" />}
                  {participant.video && <FiVideo className="w-3 h-3 text-green-400" />}
                  {!participant.video && <FiVideoOff className="w-3 h-3 text-red-400" />}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-gray-900">Cooking Chat</h4>
          <span className="px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded-full uppercase">
            Live
          </span>
        </div>
        <div className="space-y-2 max-h-24 overflow-y-auto">
          <div className="text-sm">
            <span className="font-semibold text-primary-500">Sarah:</span>
            <span className="text-gray-700 ml-2">My onions are perfectly caramelized! 🧅</span>
          </div>
          <div className="text-sm">
            <span className="font-semibold text-primary-500">Mike:</span>
            <span className="text-gray-700 ml-2">Great tip about the low heat, thanks!</span>
          </div>
          <div className="text-sm">
            <span className="font-semibold text-primary-500">Emma:</span>
            <span className="text-gray-700 ml-2">Adding the garlic now... smells amazing! 👍</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default VideoCallLayout