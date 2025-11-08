import { useState } from 'react'
import { motion } from 'framer-motion'
import LandingPage from './components/LandingPage'
import Header from './components/Header'
import RecipeGrid from './components/RecipeGrid'
import RecipeDetail from './components/RecipeDetail'
import CookMode from './components/CookMode'
import AddRecipe from './components/AddRecipe'
import { sampleRecipes } from './data/sampleData'

function App() {
  const [currentView, setCurrentView] = useState('landing')
  const [selectedRecipe, setSelectedRecipe] = useState(null)
  const [recipes, setRecipes] = useState(sampleRecipes)

  const handleViewChange = (view, recipe = null) => {
    setCurrentView(view)
    setSelectedRecipe(recipe)
  }

  const handleAddRecipe = (newRecipe) => {
    const recipe = {
      ...newRecipe,
      id: Date.now(),
      reactions: {},
      createdAt: new Date().toISOString()
    }
    setRecipes([recipe, ...recipes])
    setCurrentView('home')
  }

  const handleUpdateRecipe = (updatedRecipe) => {
    setRecipes(recipes.map(recipe => 
      recipe.id === updatedRecipe.id ? updatedRecipe : recipe
    ))
    setSelectedRecipe(updatedRecipe)
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'landing':
        return <LandingPage onGetStarted={() => setCurrentView('home')} />
      case 'recipe':
        return (
          <RecipeDetail 
            recipe={selectedRecipe}
            onBack={() => setCurrentView('home')}
            onStartCooking={() => setCurrentView('cook')}
            onUpdateRecipe={handleUpdateRecipe}
          />
        )
      case 'cook':
        return (
          <CookMode 
            recipe={selectedRecipe}
            onBack={() => setCurrentView('recipe')}
          />
        )
      case 'add':
        return (
          <AddRecipe 
            onSave={handleAddRecipe}
            onCancel={() => setCurrentView('home')}
          />
        )
      default:
        return (
          <RecipeGrid 
            recipes={recipes}
            onRecipeSelect={(recipe) => handleViewChange('recipe', recipe)}
            onAddRecipe={() => setCurrentView('add')}
          />
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {currentView !== 'landing' && (
        <Header 
          currentView={currentView}
          onViewChange={handleViewChange}
        />
      )}
      <motion.main 
        className={currentView === 'landing' ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {renderCurrentView()}
      </motion.main>
    </div>
  )
}

export default App