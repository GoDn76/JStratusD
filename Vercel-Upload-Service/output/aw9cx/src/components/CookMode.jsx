import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiArrowLeft, FiPlay, FiPause, FiSkipForward, FiSkipBack, FiVolume2 } from 'react-icons/fi'

function CookMode({ recipe, onBack }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(null)
  const [completedSteps, setCompletedSteps] = useState(new Set())

  useEffect(() => {
    let interval
    if (isPlaying && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsPlaying(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isPlaying, timeRemaining])

  const nextStep = () => {
    if (currentStep < recipe.instructions.length - 1) {
      setCompletedSteps(prev => new Set([...prev, currentStep]))
      setCurrentStep(currentStep + 1)
      setTimeRemaining(null)
      setIsPlaying(false)
    }
  }

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      setCompletedSteps(prev => {
        const newSet = new Set(prev)
        newSet.delete(currentStep - 1)
        return newSet
      })
      setTimeRemaining(null)
      setIsPlaying(false)
    }
  }

  const startTimer = (minutes) => {
    setTimeRemaining(minutes * 60)
    setIsPlaying(true)
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progress = ((currentStep + 1) / recipe.instructions.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white -mx-4 -my-8 px-4 py-8 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8 pb-6 border-b border-gray-200">
          <motion.button
            className="btn btn-ghost self-start"
            onClick={onBack}
            whileHover={{ x: -4 }}
            whileTap={{ x: 0 }}
          >
            <FiArrowLeft className="w-4 h-4" />
            Exit Cook Mode
          </motion.button>
          
          <div className="flex-1 lg:max-w-md">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">{recipe.title}</h1>
            <div className="flex items-center gap-4 text-gray-600">
              <span className="text-sm font-medium">Step {currentStep + 1} of {recipe.instructions.length}</span>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Instruction */}
          <div className="lg:col-span-3">
            <div className="card p-8 lg:p-12 min-h-[400px] flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  className="text-center max-w-2xl"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="inline-block bg-gradient-to-r from-primary-500 to-accent-500 text-white px-6 py-2 rounded-full text-sm font-semibold uppercase tracking-wide mb-6">
                    Step {currentStep + 1}
                  </div>
                  <h2 className="text-2xl lg:text-3xl font-semibold text-gray-900 leading-relaxed mb-8">
                    {recipe.instructions[currentStep]}
                  </h2>
                  
                  <div className="flex flex-col items-center gap-6">
                    <motion.button
                      className="btn btn-outline text-base px-8"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FiVolume2 className="w-5 h-5" />
                      Read Aloud
                    </motion.button>
                    
                    <div className="flex flex-wrap gap-3 justify-center">
                      {[5, 10, 15].map(minutes => (
                        <motion.button
                          key={minutes}
                          className="px-4 py-2 bg-gray-100 hover:bg-primary-500 hover:text-white rounded-lg font-medium transition-colors"
                          onClick={() => startTimer(minutes)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {minutes} min
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 gap-6">
              <motion.button
                className="btn btn-outline"
                onClick={previousStep}
                disabled={currentStep === 0}
                whileHover={{ scale: currentStep === 0 ? 1 : 1.05 }}
                whileTap={{ scale: currentStep === 0 ? 1 : 0.95 }}
              >
                <FiSkipBack className="w-4 h-4" />
                Previous
              </motion.button>
              
              <motion.button
                className="btn btn-primary text-lg px-8"
                onClick={nextStep}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {currentStep === recipe.instructions.length - 1 ? 'Finish Recipe' : 'Next Step'}
                <FiSkipForward className="w-4 h-4" />
              </motion.button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Timer */}
            {timeRemaining !== null && (
              <motion.div
                className="card p-6 text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <div className={`w-24 h-24 mx-auto mb-4 border-4 rounded-full flex items-center justify-center transition-colors ${
                  timeRemaining === 0 ? 'border-green-500 bg-green-50 animate-pulse' : 'border-gray-300 bg-gray-50'
                }`}>
                  <span className="text-xl font-bold text-gray-900">{formatTime(timeRemaining)}</span>
                </div>
                <div className="flex justify-center">
                  <motion.button
                    className="p-3 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors"
                    onClick={() => setIsPlaying(!isPlaying)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {isPlaying ? <FiPause className="w-4 h-4" /> : <FiPlay className="w-4 h-4" />}
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Steps Overview */}
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 mb-4">All Steps</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recipe.instructions.map((instruction, index) => (
                  <motion.div
                    key={index}
                    className={`flex gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                      index === currentStep 
                        ? 'bg-primary-50 border border-primary-200' 
                        : completedSteps.has(index)
                        ? 'bg-green-50 border border-green-200 opacity-70'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    onClick={() => setCurrentStep(index)}
                    whileHover={{ x: 4 }}
                    whileTap={{ x: 0 }}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      index === currentStep 
                        ? 'bg-primary-500 text-white' 
                        : completedSteps.has(index)
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {completedSteps.has(index) ? '✓' : index + 1}
                    </div>
                    <span className={`text-sm leading-relaxed ${
                      index === currentStep ? 'text-gray-900 font-medium' : 'text-gray-700'
                    }`}>
                      {instruction}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CookMode