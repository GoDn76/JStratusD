import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const availableEmojis = ['👍', '❤️', '😋', '🔥', '👏', '💯']

function EmojiReactions({ reactions, onReact }) {
  const [showPicker, setShowPicker] = useState(false)

  const totalReactions = Object.values(reactions).reduce((sum, count) => sum + count, 0)
  const topEmojis = Object.entries(reactions)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)

  return (
    <div className="flex items-center gap-3">
      {totalReactions > 0 && (
        <div className="flex items-center gap-2">
          {topEmojis.map(([emoji, count]) => (
            <motion.div
              key={emoji}
              className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full cursor-pointer hover:bg-gray-200 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onReact(emoji)}
            >
              <span className="text-sm">{emoji}</span>
              <span className="text-xs font-semibold text-gray-700">{count}</span>
            </motion.div>
          ))}
        </div>
      )}
      
      <div className="relative">
        <motion.button
          className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
          onClick={() => setShowPicker(!showPicker)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          😊
        </motion.button>
        
        <AnimatePresence>
          {showPicker && (
            <motion.div
              className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex gap-1 z-10"
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              {availableEmojis.map((emoji) => (
                <motion.button
                  key={emoji}
                  className="p-2 rounded hover:bg-gray-100 transition-colors"
                  onClick={() => {
                    onReact(emoji)
                    setShowPicker(false)
                  }}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <span className="text-lg">{emoji}</span>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default EmojiReactions