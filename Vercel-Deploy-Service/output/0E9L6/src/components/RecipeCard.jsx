import { motion } from 'framer-motion'
import { FiClock, FiUsers, FiStar, FiBookmark } from 'react-icons/fi'

function RecipeCard({ recipe, onClick }) {
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-500'
      case 'Intermediate': return 'bg-yellow-500'
      case 'Advanced': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <motion.div
      className="card overflow-hidden cursor-pointer group"
      onClick={onClick}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <div className="relative h-48 overflow-hidden">
        <img 
          src={recipe.image} 
          alt={recipe.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <motion.button
          className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation()
            // Handle bookmark
          }}
        >
          <FiBookmark className="w-4 h-4 text-gray-700" />
        </motion.button>
        
        <div className={`absolute bottom-3 left-3 px-2 py-1 rounded-full text-white text-xs font-semibold ${getDifficultyColor(recipe.difficulty)}`}>
          {recipe.difficulty}
        </div>
      </div>
      
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-semibold text-gray-900 text-lg leading-tight line-clamp-2 flex-1">
            {recipe.title}
          </h3>
          <div className="flex items-center gap-1 text-yellow-500 flex-shrink-0">
            <FiStar className="w-4 h-4 fill-current" />
            <span className="text-sm font-medium text-gray-700">{recipe.rating}</span>
          </div>
        </div>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
          {recipe.description}
        </p>
        
        <div className="flex flex-wrap gap-1 mb-4">
          {recipe.tags.slice(0, 3).map((tag, index) => (
            <span key={index} className="tag tag-accent text-xs">
              {tag}
            </span>
          ))}
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4 py-3 border-t border-gray-100">
          <div className="flex items-center gap-1">
            <FiClock className="w-4 h-4" />
            <span>{recipe.prepTime + recipe.cookTime} min</span>
          </div>
          <div className="flex items-center gap-1">
            <FiUsers className="w-4 h-4" />
            <span>{recipe.servings} servings</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
              {recipe.author.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-gray-700">{recipe.author}</span>
          </div>
          <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">
            {recipe.category}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

export default RecipeCard