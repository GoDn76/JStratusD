import { useState } from 'react'
import { motion } from 'framer-motion'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { FiSave, FiX, FiPlus, FiMic, FiImage } from 'react-icons/fi'

function AddRecipe({ onSave, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Quick & Easy',
    difficulty: 'Beginner',
    prepTime: 15,
    cookTime: 30,
    servings: 4,
    image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
    tags: []
  })

  const [ingredients, setIngredients] = useState([
    { id: 'ing-1', content: '' }
  ])

  const [instructions, setInstructions] = useState([
    { id: 'inst-1', content: '' }
  ])

  const [currentTagInput, setCurrentTagInput] = useState('')
  const [isListening, setIsListening] = useState(false)

  const categories = ['Quick & Easy', 'Healthy', 'Comfort Food', 'Desserts', 'International']
  const difficulties = ['Beginner', 'Intermediate', 'Advanced']

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleDragEnd = (result, items, setItems) => {
    if (!result.destination) return

    const newItems = Array.from(items)
    const [reorderedItem] = newItems.splice(result.source.index, 1)
    newItems.splice(result.destination.index, 0, reorderedItem)

    setItems(newItems)
  }

  const addItem = (items, setItems, prefix) => {
    const newItem = {
      id: `${prefix}-${Date.now()}`,
      content: ''
    }
    setItems([...items, newItem])
  }

  const updateItem = (items, setItems, id, content) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, content } : item
    ))
  }

  const removeItem = (items, setItems, id) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id))
    }
  }

  const addTag = () => {
    if (currentTagInput.trim() && !formData.tags.includes(currentTagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTagInput.trim()]
      }))
      setCurrentTagInput('')
    }
  }

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const simulateVoiceToText = () => {
    setIsListening(true)
    setTimeout(() => {
      setIsListening(false)
      const voiceTexts = [
        "Heat olive oil in a large pan over medium heat",
        "Add the diced onions and cook until translucent",
        "Season with salt and pepper to taste"
      ]
      const randomText = voiceTexts[Math.floor(Math.random() * voiceTexts.length)]
      
      const lastInstruction = instructions[instructions.length - 1]
      if (lastInstruction.content === '') {
        updateItem(instructions, setInstructions, lastInstruction.id, randomText)
      } else {
        const newInstruction = {
          id: `inst-${Date.now()}`,
          content: randomText
        }
        setInstructions([...instructions, newInstruction])
      }
    }, 2000)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const recipe = {
      ...formData,
      ingredients: ingredients.map(ing => ing.content).filter(content => content.trim()),
      instructions: instructions.map(inst => inst.content).filter(content => content.trim()),
      rating: 4.5,
      author: 'You',
      reactions: {}
    }

    onSave(recipe)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Create New Recipe</h1>
        <p className="text-lg text-gray-600">Share your culinary creation with the community</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-8">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Basic Information */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Basic Information</h2>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Recipe Title</label>
              <input
                type="text"
                className="input"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter your recipe title..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <textarea
                className="input min-h-[120px] resize-y"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Tell us about your recipe..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                <select
                  className="input"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Difficulty</label>
                <select
                  className="input"
                  value={formData.difficulty}
                  onChange={(e) => handleInputChange('difficulty', e.target.value)}
                >
                  {difficulties.map(difficulty => (
                    <option key={difficulty} value={difficulty}>{difficulty}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Prep Time (min)</label>
                <input
                  type="number"
                  className="input"
                  value={formData.prepTime}
                  onChange={(e) => handleInputChange('prepTime', parseInt(e.target.value))}
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Cook Time (min)</label>
                <input
                  type="number"
                  className="input"
                  value={formData.cookTime}
                  onChange={(e) => handleInputChange('cookTime', parseInt(e.target.value))}
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Servings</label>
                <input
                  type="number"
                  className="input"
                  value={formData.servings}
                  onChange={(e) => handleInputChange('servings', parseInt(e.target.value))}
                  min="1"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Recipe Image</label>
              <div className="flex gap-3">
                <input
                  type="url"
                  className="input flex-1"
                  value={formData.image}
                  onChange={(e) => handleInputChange('image', e.target.value)}
                  placeholder="Enter image URL..."
                />
                <motion.button
                  type="button"
                  className="btn btn-outline"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiImage className="w-4 h-4" />
                  Browse
                </motion.button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tags</label>
              <div className="flex gap-3 mb-3">
                <input
                  type="text"
                  className="input flex-1"
                  value={currentTagInput}
                  onChange={(e) => setCurrentTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Add a tag..."
                />
                <motion.button
                  type="button"
                  className="btn btn-outline"
                  onClick={addTag}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Add
                </motion.button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map(tag => (
                    <motion.span
                      key={tag}
                      className="tag tag-primary flex items-center gap-1"
                      whileHover={{ scale: 1.05 }}
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-red-600 transition-colors"
                      >
                        <FiX className="w-3 h-3" />
                      </button>
                    </motion.span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Ingredients */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Ingredients</h2>
            <p className="text-sm text-gray-600">Drag to reorder ingredients</p>
            
            <DragDropContext onDragEnd={(result) => handleDragEnd(result, ingredients, setIngredients)}>
              <Droppable droppableId="ingredients">
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`space-y-3 min-h-[100px] p-3 rounded-lg transition-colors ${
                      snapshot.isDraggingOver ? 'bg-primary-50 border-2 border-dashed border-primary-300' : ''
                    }`}
                  >
                    {ingredients.map((ingredient, index) => (
                      <Draggable key={ingredient.id} draggableId={ingredient.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg transition-all ${
                              snapshot.isDragging ? 'shadow-lg rotate-2 bg-white border-primary-300' : 'hover:bg-gray-100'
                            }`}
                          >
                            <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                              {index + 1}
                            </div>
                            <input
                              type="text"
                              className="input flex-1 m-0"
                              value={ingredient.content}
                              onChange={(e) => updateItem(ingredients, setIngredients, ingredient.id, e.target.value)}
                              placeholder="Enter ingredient..."
                            />
                            {ingredients.length > 1 && (
                              <button
                                type="button"
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                onClick={() => removeItem(ingredients, setIngredients, ingredient.id)}
                              >
                                <FiX className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            <motion.button
              type="button"
              className="btn btn-outline"
              onClick={() => addItem(ingredients, setIngredients, 'ing')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiPlus className="w-4 h-4" />
              Add Ingredient
            </motion.button>
          </div>

          {/* Instructions */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Instructions</h2>
              <motion.button
                type="button"
                className={`btn ${isListening ? 'btn-primary animate-pulse' : 'btn-outline'}`}
                onClick={simulateVoiceToText}
                disabled={isListening}
                whileHover={{ scale: isListening ? 1 : 1.05 }}
                whileTap={{ scale: isListening ? 1 : 0.95 }}
              >
                <FiMic className="w-4 h-4" />
                {isListening ? 'Listening...' : 'Voice Input'}
              </motion.button>
            </div>
            <p className="text-sm text-gray-600">Drag to reorder steps</p>
            
            <DragDropContext onDragEnd={(result) => handleDragEnd(result, instructions, setInstructions)}>
              <Droppable droppableId="instructions">
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`space-y-4 min-h-[100px] p-3 rounded-lg transition-colors ${
                      snapshot.isDraggingOver ? 'bg-primary-50 border-2 border-dashed border-primary-300' : ''
                    }`}
                  >
                    {instructions.map((instruction, index) => (
                      <Draggable key={instruction.id} draggableId={instruction.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`flex gap-4 p-4 bg-gray-50 border border-gray-200 rounded-lg transition-all ${
                              snapshot.isDragging ? 'shadow-lg rotate-1 bg-white border-primary-300' : 'hover:bg-gray-100'
                            }`}
                          >
                            <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 mt-1">
                              {index + 1}
                            </div>
                            <textarea
                              className="input flex-1 m-0 min-h-[80px] resize-y"
                              value={instruction.content}
                              onChange={(e) => updateItem(instructions, setInstructions, instruction.id, e.target.value)}
                              placeholder="Describe this step..."
                            />
                            {instructions.length > 1 && (
                              <button
                                type="button"
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors flex-shrink-0"
                                onClick={() => removeItem(instructions, setInstructions, instruction.id)}
                              >
                                <FiX className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            <motion.button
              type="button"
              className="btn btn-outline"
              onClick={() => addItem(instructions, setInstructions, 'inst')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiPlus className="w-4 h-4" />
              Add Step
            </motion.button>
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-12 pt-8 border-t border-gray-200">
          <motion.button
            type="button"
            className="btn btn-outline"
            onClick={onCancel}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Cancel
          </motion.button>
          
          <motion.button
            type="submit"
            className="btn btn-primary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiSave className="w-4 h-4" />
            Save Recipe
          </motion.button>
        </div>
      </form>
    </div>
  )
}

export default AddRecipe