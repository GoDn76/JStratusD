import { useState } from 'react'
import { motion } from 'framer-motion'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { FiArrowLeft, FiPlay, FiUsers, FiClock, FiVideo, FiMic } from 'react-icons/fi'
import EmojiReactions from './EmojiReactions'
import VideoCallLayout from './VideoCallLayout'

function RecipeDetail({ recipe, onBack, onStartCooking, onUpdateRecipe }) {
  const [ingredients, setIngredients] = useState(
    recipe.ingredients.map((ingredient, index) => ({
      id: `ingredient-${index}`,
      content: ingredient,
      completed: false
    }))
  )
  const [showVideoCall, setShowVideoCall] = useState(false)
  const [activeStep, setActiveStep] = useState(0)

  const handleDragEnd = (result) => {
    if (!result.destination) return

    const items = Array.from(ingredients)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setIngredients(items)
  }

  const toggleIngredient = (id) => {
    setIngredients(ingredients.map(ingredient =>
      ingredient.id === id
        ? { ...ingredient, completed: !ingredient.completed }
        : ingredient
    ))
  }

  const handleStepReaction = (stepIndex, emoji) => {
    const updatedRecipe = {
      ...recipe,
      reactions: {
        ...recipe.reactions,
        [stepIndex]: {
          ...recipe.reactions[stepIndex],
          [emoji]: (recipe.reactions[stepIndex]?.[emoji] || 0) + 1
        }
      }
    }
    onUpdateRecipe(updatedRecipe)
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-500'
      case 'Intermediate': return 'bg-yellow-500'
      case 'Advanced': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <motion.button
          className="btn btn-ghost self-start"
          onClick={onBack}
          whileHover={{ x: -4 }}
          whileTap={{ x: 0 }}
        >
          <FiArrowLeft className="w-4 h-4" />
          Back
        </motion.button>
        
        <div className="flex gap-3">
          <motion.button
            className={`btn ${showVideoCall ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setShowVideoCall(!showVideoCall)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiVideo className="w-4 h-4" />
            {showVideoCall ? 'Hide Video' : 'Cook Together'}
          </motion.button>
          
          <motion.button
            className="btn btn-primary"
            onClick={onStartCooking}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiPlay className="w-4 h-4" />
            Start Cooking
          </motion.button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative h-96 rounded-2xl overflow-hidden">
        <img 
          src={recipe.image} 
          alt={recipe.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
          <h1 className="text-4xl lg:text-5xl font-bold mb-4">{recipe.title}</h1>
          <p className="text-lg mb-6 opacity-90">{recipe.description}</p>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <FiClock className="w-5 h-5" />
              <span className="font-medium">{recipe.prepTime + recipe.cookTime} min</span>
            </div>
            <div className="flex items-center gap-2">
              <FiUsers className="w-5 h-5" />
              <span className="font-medium">{recipe.servings} servings</span>
            </div>
            <div className={`px-3 py-1 rounded-full text-white text-sm font-semibold ${getDifficultyColor(recipe.difficulty)}`}>
              {recipe.difficulty}
            </div>
          </div>
        </div>
      </div>

      {showVideoCall && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <VideoCallLayout />
        </motion.div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Ingredients */}
        <div className="lg:col-span-1">
          <div className="card p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Ingredients</h2>
            <p className="text-gray-600 text-sm mb-6">Drag to reorder, check off as you prep</p>
            
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="ingredients">
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`space-y-3 min-h-[100px] p-2 rounded-lg transition-colors ${
                      snapshot.isDraggingOver ? 'bg-primary-50 border-2 border-dashed border-primary-300' : ''
                    }`}
                  >
                    {ingredients.map((ingredient, index) => (
                      <Draggable key={ingredient.id} draggableId={ingredient.id} index={index}>
                        {(provided, snapshot) => (
                          <motion.div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer transition-all ${
                              ingredient.completed ? 'bg-green-50 border-green-200 opacity-70' : 'hover:bg-gray-100'
                            } ${snapshot.isDragging ? 'shadow-lg rotate-2 bg-white border-primary-300' : ''}`}
                            onClick={() => toggleIngredient(ingredient.id)}
                            whileHover={{ scale: 1.02 }}
                          >
                            <div className={`w-5 h-5 border-2 rounded flex items-center justify-center text-xs font-bold transition-colors ${
                              ingredient.completed 
                                ? 'bg-green-500 border-green-500 text-white' 
                                : 'border-gray-300'
                            }`}>
                              {ingredient.completed && '✓'}
                            </div>
                            <span className={`flex-1 font-medium ${ingredient.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                              {ingredient.content}
                            </span>
                            <div className="text-gray-400 text-xs">⋮⋮</div>
                          </motion.div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </div>

        {/* Instructions */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Instructions</h2>
            <p className="text-gray-600 text-sm mb-6">Follow along step by step</p>
            
            <div className="space-y-6">
              {recipe.instructions.map((instruction, index) => (
                <motion.div
                  key={index}
                  className={`flex gap-6 p-6 rounded-xl border-2 cursor-pointer transition-all ${
                    index === activeStep 
                      ? 'bg-primary-50 border-primary-300 shadow-md' 
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setActiveStep(index)}
                  whileHover={{ scale: 1.01 }}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 ${
                    index === activeStep ? 'bg-primary-500' : 'bg-gray-400'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-800 leading-relaxed mb-4">{instruction}</p>
                    <div className="flex items-center gap-4">
                      <motion.button
                        className="p-2 bg-gray-200 rounded-full hover:bg-primary-500 hover:text-white transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title="Voice note"
                      >
                        <FiMic className="w-4 h-4" />
                      </motion.button>
                      <EmojiReactions
                        reactions={recipe.reactions[index] || {}}
                        onReact={(emoji) => handleStepReaction(index, emoji)}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RecipeDetail