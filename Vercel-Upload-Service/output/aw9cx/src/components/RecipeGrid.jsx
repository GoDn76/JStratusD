import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPlus, FiFilter } from 'react-icons/fi'
import RecipeCard from './RecipeCard'

const categories = ['All', 'Quick & Easy', 'Healthy', 'Comfort Food', 'Desserts', 'International']
const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced']

function RecipeGrid({ recipes, onRecipeSelect, onAddRecipe }) {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedDifficulty, setSelectedDifficulty] = useState('All')
  const [showFilters, setShowFilters] = useState(false)

  const filteredRecipes = recipes.filter(recipe => {
    const categoryMatch = selectedCategory === 'All' || recipe.category === selectedCategory
    const difficultyMatch = selectedDifficulty === 'All' || recipe.difficulty === selectedDifficulty
    return categoryMatch && difficultyMatch
  })

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            Discover Amazing Recipes
          </h2>
          <p className="text-lg text-gray-600">Find your next favorite dish from our community</p>
        </div>
        
        <div className="flex gap-3">
          <motion.button
            className="btn btn-outline"
            onClick={() => setShowFilters(!showFilters)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiFilter className="w-4 h-4" />
            Filters
          </motion.button>
          
          <motion.button
            className="btn btn-primary"
            onClick={onAddRecipe}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiPlus className="w-4 h-4" />
            Add Recipe
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            className="card p-6"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Category</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(category => (
                    <motion.button
                      key={category}
                      className={`tag ${selectedCategory === category ? 'tag-primary' : 'tag-gray'}`}
                      onClick={() => setSelectedCategory(category)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {category}
                    </motion.button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Difficulty</label>
                <div className="flex flex-wrap gap-2">
                  {difficulties.map(difficulty => (
                    <motion.button
                      key={difficulty}
                      className={`tag ${selectedDifficulty === difficulty ? 'tag-secondary' : 'tag-gray'}`}
                      onClick={() => setSelectedDifficulty(difficulty)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {difficulty}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        layout
      >
        <AnimatePresence>
          {filteredRecipes.map((recipe, index) => (
            <motion.div
              key={recipe.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              layout
            >
              <RecipeCard 
                recipe={recipe}
                onClick={() => onRecipeSelect(recipe)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {filteredRecipes.length === 0 && (
        <motion.div
          className="text-center py-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">No recipes found</h3>
          <p className="text-gray-600 mb-6">Try adjusting your filters or add a new recipe</p>
          <button className="btn btn-primary" onClick={onAddRecipe}>
            <FiPlus className="w-4 h-4" />
            Add New Recipe
          </button>
        </motion.div>
      )}
    </div>
  )
}

export default RecipeGrid