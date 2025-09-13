import React from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar"; // keep your Navbar here
import cutie from "../images/DesignSyncLogo.png";
import { Shirt, Users, MessageSquare, Clock, LayoutDashboard, Download } from "lucide-react";

const LandingPage: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="font-sans text-white bg-gradient-to-r from-white to-teal-50"
    >
      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="relative flex flex-col items-center justify-between px-5 py-20 md:flex-row"
      >
        <div className="max-w-3xl px-10">
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="px-4 py-1 text-sm font-semibold text-teal-700 bg-teal-100 rounded-full"
          >
            Reimagine T-Shirt Design Collaboration
          </motion.span>
          <h1 className="mt-5 text-5xl font-extrabold text-gray-900">
            Create Perfect T-Shirts <br />
            <span className="text-teal-500">Together</span> in Real-Time
          </h1>
          <p className="mt-5 text-lg text-gray-600">
            TechShirt connects designers and clients on one platform, enabling real-time
            collaboration to craft the perfect t-shirt design with fewer revisions.
          </p>
          <div className="flex gap-4 mt-7">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="px-3 py-3 text-lg font-semibold text-white transition-all duration-300 bg-teal-500 rounded-full shadow-lg hover:bg-teal-600"
            >
              <a href="/sign-up"> Get Started →</a>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="px-3 py-3 text-lg font-semibold text-teal-500 transition-all duration-300 border-2 border-teal-500 rounded-full hover:bg-teal-500 hover:text-white"
            >
              <a href="/features">Learn More</a>
            </motion.button>
          </div>
        </div>

        {/* Decorative Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="mt-10 md:mt-0 md:w-1/3"
        >
          <img
            src={cutie}
            alt="Decorative"
            className="w-full max-w-xs mx-auto md:max-w-md ml-[-10px]"
          />
        </motion.div>
      </motion.section>

      {/* Features Intro */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.2 }}
        className="px-6 py-16 text-center text-gray-900 relative"
      >
        <h2 className="text-4xl font-bold text-gray-800 mb-4">
          Powerful Features for <span className="text-teal-600">Seamless</span> Collaboration
        </h2>
        <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
          Our platform combines powerful design tools with collaborative features to streamline
          the t-shirt design process and bring your creative vision to life.
        </p>
      </motion.section>

      {/* Features Section */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.2 }}
        className="px-6 py-20 text-gray-900 relative"
      >
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-teal-50 rounded-full opacity-40 blur-3xl pointer-events-none"></div>

        <div className="relative grid grid-cols-1 gap-8 mx-auto md:grid-cols-3 max-w-7xl">
          {[
            {
              title: "3D T-Shirt Customization",
              desc: "Design directly on realistic 3D models with intuitive tools.",
              icon: <Shirt size={28} strokeWidth={2} className="text-teal-600" />
            },
            {
              title: "Real-Time Collaboration",
              desc: "Work together with clients in real-time on the same design.",
              icon: <Users size={28} strokeWidth={2} className="text-teal-600" />
            },
            {
              title: "Annotations Tools",
              desc: "Communicate efficiently with built-in annotation tools.",
              icon: <MessageSquare size={28} strokeWidth={2} className="text-teal-600" />
            },
            {
              title: "Design Revision Tracking",
              desc: "Track all revisions with a visual timeline and version control.",
              icon: <Clock size={28} strokeWidth={2} className="text-teal-600" />
            },
            {
              title: "Dashboard Interface",
              desc: "Manage all your projects efficiently with intuitive dashboards.",
              icon: <LayoutDashboard size={28} strokeWidth={2} className="text-teal-600" />
            },
            {
              title: "Export Options",
              desc: "Download your designs in multiple formats for any purpose.",
              icon: <Download size={28} strokeWidth={2} className="text-teal-600" />
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="p-8 bg-white rounded-xl shadow-sm transition-all duration-300 transform
                hover:scale-[1.03] hover:shadow-[0px_5px_12px_rgba(46,196,182,0.18)] min-h-[220px]
                flex flex-col items-center text-center relative overflow-hidden
                border border-teal-500 group"
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-teal-500 opacity-10 rounded-full group-hover:opacity-20 transform translate-x-8 -translate-y-8 transition-all"></div>
              <div className="absolute bottom-0 left-0 w-20 h-20 bg-teal-500 opacity-5 rounded-full group-hover:opacity-10 transform -translate-x-10 translate-y-10 transition-all"></div>
              <div className="flex items-center justify-center w-16 h-16 mb-6 bg-teal-50 rounded-full group-hover:scale-110 group-hover:bg-teal-100 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="mb-3 text-xl font-bold text-gray-800 group-hover:text-teal-600 transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Call to Action */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="py-16 text-center text-white bg-teal-500"
      >
        <h2 className="text-3xl font-bold">Ready to Transform Your Design Process?</h2>
        <p className="mt-2">Join TechShirt today and experience seamless collaboration.</p>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="px-6 py-3 mt-6 font-semibold text-teal-500 bg-white rounded-lg"
        >
          <a href="/sign-up"> Get Started Now</a>
        </motion.button>
      </motion.section>

      {/* Footer */}
      <footer className="w-full px-6 py-10 text-gray-400 bg-gray-900">
        <div className="grid max-w-6xl grid-cols-1 gap-6 mx-auto md:grid-cols-3">
          <div>
            <h3 className="text-lg font-bold text-white">TechShirt</h3>
            <p>The collaborative platform for t-shirt design that connects clients and designers.</p>
          </div>
          <div>
            <h4 className="font-bold text-white">Product</h4>
            <a href="/features" className="block mt-2">Features</a>
            <a href="/how-it-works" className="block mt-2">How It Works</a>
            <a href="/pricing" className="block mt-2">Pricing</a>
          </div>
          <div>
            <h4 className="font-bold text-white">Company</h4>
            <a href="/about" className="block mt-2">About Us</a>
            <a href="/contact" className="block mt-2">Contact</a>
            <a href="/careers" className="block mt-2">Careers</a>
          </div>
        </div>
      </footer>
    </motion.div>
  );
};

export default LandingPage;
