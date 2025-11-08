import { motion } from 'framer-motion'
import { FiPlay, FiUsers, FiChef, FiHeart, FiStar, FiArrowRight, FiCheck } from 'react-icons/fi'

function LandingPage({ onGetStarted }) {
  const features = [
    {
      icon: <FiChef className="w-8 h-8" />,
      title: "Interactive Cooking",
      description: "Step-by-step guidance with drag-and-drop ingredients and smart timers"
    },
    {
      icon: <FiUsers className="w-8 h-8" />,
      title: "Cook Together",
      description: "Video collaboration with friends and family while cooking the same recipe"
    },
    {
      icon: <FiHeart className="w-8 h-8" />,
      title: "Community Reactions",
      description: "Share feedback with emoji reactions on each cooking step"
    }
  ]

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Home Chef",
      avatar: "S",
      text: "CookTogether transformed how I cook! The drag-and-drop ingredients make meal prep so organized.",
      rating: 5
    },
    {
      name: "Mike Johnson",
      role: "Food Blogger",
      avatar: "M", 
      text: "The collaborative cooking feature is amazing. I cook with my family across the country now!",
      rating: 5
    },
    {
      name: "Emma Davis",
      role: "Cooking Enthusiast",
      avatar: "E",
      text: "Voice-to-text for adding instructions is a game changer. So convenient while cooking!",
      rating: 5
    }
  ]

  const stats = [
    { number: "10K+", label: "Recipes Shared" },
    { number: "5K+", label: "Active Cooks" },
    { number: "50K+", label: "Cooking Sessions" },
    { number: "4.9", label: "Average Rating" }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-accent-50 hero-pattern">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-accent-500/5"></div>
        
        {/* Navigation */}
        <nav className="relative z-10 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="text-4xl">🍳</span>
              <h1 className="text-2xl font-bold gradient-text">CookTogether</h1>
            </motion.div>
            
            <motion.div 
              className="hidden md:flex items-center gap-8"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <a href="#features" className="text-gray-600 hover:text-primary-500 transition-colors">Features</a>
              <a href="#testimonials" className="text-gray-600 hover:text-primary-500 transition-colors">Reviews</a>
              <button 
                onClick={onGetStarted}
                className="btn btn-primary"
              >
                Get Started
              </button>
            </motion.div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 leading-tight mb-6">
                Cook
                <span className="gradient-text"> Together</span>
                <br />
                Create Magic
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Transform your cooking experience with interactive recipes, collaborative cooking sessions, 
                and a community that shares your passion for great food.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <motion.button
                  onClick={onGetStarted}
                  className="btn btn-primary text-lg px-8 py-4"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiPlay className="w-5 h-5" />
                  Start Cooking
                </motion.button>
                <motion.button
                  className="btn btn-outline text-lg px-8 py-4"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Watch Demo
                </motion.button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                  >
                    <div className="text-2xl font-bold text-primary-500">{stat.number}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="relative"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="relative z-10">
                <img 
                  src="https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg"
                  alt="Delicious food"
                  className="rounded-2xl shadow-2xl w-full h-96 object-cover"
                />
                
                {/* Floating Cards */}
                <motion.div
                  className="absolute -top-4 -left-4 bg-white rounded-xl shadow-lg p-4 floating"
                  style={{ animationDelay: '0s' }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <FiUsers className="w-4 h-4 text-primary-500" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">4 people cooking</div>
                      <div className="text-xs text-gray-500">Live session</div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="absolute -bottom-4 -right-4 bg-white rounded-xl shadow-lg p-4 floating"
                  style={{ animationDelay: '2s' }}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <FiStar key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <div>
                      <div className="text-sm font-medium">4.9 rating</div>
                      <div className="text-xs text-gray-500">2.1k reviews</div>
                    </div>
                  </div>
                </motion.div>
              </div>
              
              {/* Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-200/20 to-accent-200/20 rounded-2xl transform rotate-3 -z-10"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Why Choose <span className="gradient-text">CookTogether</span>?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience cooking like never before with our innovative features designed 
              to make every meal preparation enjoyable and collaborative.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="card p-8 text-center group hover:shadow-xl"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
              >
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-primary-500 group-hover:text-white transition-all duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              How It <span className="gradient-text">Works</span>
            </h2>
            <p className="text-xl text-gray-600">Simple steps to start your cooking journey</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Choose Your Recipe",
                description: "Browse our collection of interactive recipes or create your own with drag-and-drop ingredients."
              },
              {
                step: "2", 
                title: "Start Cook Mode",
                description: "Follow step-by-step instructions with built-in timers and voice guidance for perfect results."
              },
              {
                step: "3",
                title: "Cook Together",
                description: "Invite friends to join your cooking session via video call and share the experience in real-time."
              }
            ].map((item, index) => (
              <motion.div
                key={item.step}
                className="relative"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <div className="card p-8 text-center relative z-10">
                  <div className="w-12 h-12 bg-primary-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-bold">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.description}</p>
                </div>
                
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-0">
                    <FiArrowRight className="w-8 h-8 text-primary-300" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              What Our <span className="gradient-text">Community</span> Says
            </h2>
            <p className="text-xl text-gray-600">Join thousands of happy cooks worldwide</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                className="card p-8"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
              >
                <div className="flex text-yellow-400 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <FiStar key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 leading-relaxed">"{testimonial.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-500 text-white rounded-full flex items-center justify-center font-semibold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-bg">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Cooking?
            </h2>
            <p className="text-xl text-white/90 mb-8 leading-relaxed">
              Join our community of passionate cooks and discover a new way to create, 
              share, and enjoy amazing meals together.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                onClick={onGetStarted}
                className="bg-white text-primary-500 hover:bg-gray-100 btn text-lg px-8 py-4 font-semibold"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiPlay className="w-5 h-5" />
                Start Cooking Now
              </motion.button>
              <motion.button
                className="border-2 border-white text-white hover:bg-white hover:text-primary-500 btn text-lg px-8 py-4 font-semibold"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Learn More
              </motion.button>
            </div>

            <div className="mt-12 flex items-center justify-center gap-8 text-white/80">
              <div className="flex items-center gap-2">
                <FiCheck className="w-5 h-5" />
                <span>Free to start</span>
              </div>
              <div className="flex items-center gap-2">
                <FiCheck className="w-5 h-5" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <FiCheck className="w-5 h-5" />
                <span>Join 10k+ cooks</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">🍳</span>
                <h3 className="text-xl font-bold">CookTogether</h3>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Transforming the way people cook, share, and connect through food.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Recipes</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Instagram</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Facebook</a></li>
                <li><a href="#" className="hover:text-white transition-colors">YouTube</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 CookTogether. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage