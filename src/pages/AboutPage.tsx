import React from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import about1 from "../images/picture1.jpg";
import about2 from "../images/picture2.jpg";
import about3 from "../images/picture3.jpg";

// Define the shape of each about item
interface AboutItem {
  title: string;
  text: string;
  image: string;
}

const aboutItems: AboutItem[] = [
  {
    title: "Delicious Menu Options",
    text: "We believe that creativity thrives in comfort. Our studio’s relaxed, cozy ambiance is inspired by the warmth of your favorite café, encouraging effortless design collaboration.",
    image: about1,
  },
  {
    title: "Customizable Collaboration",
    text: "Every t-shirt tells a story — yours. Our platform adapts to each project’s needs, letting you customize your design experience with real-time feedback, color palettes, and sizing options.",
    image: about2,
  },
  {
    title: "Seamless Experience",
    text: "Whether you're starting a design from scratch or refining one with a designer, our smooth and intuitive process ensures your vision becomes wearable reality.",
    image: about3,
  },
];

const AboutPage: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="font-sans text-gray-800 bg-gradient-to-r from-white to-teal-50"
    >
      <Navbar />

      {/* Intro Section */}
      <section className="px-6 py-20 text-center">
        <h1 className="text-4xl font-bold text-gray-900">About DesignSync</h1>
        <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
          Where creativity meets collaboration. DesignSync is more than a design
          tool — it's a community where clients and designers come together to
          make fashion ideas real.
        </p>
      </section>

      {/* About Cards */}
      <section className="grid grid-cols-1 gap-12 px-6 pb-20 md:grid-cols-3 max-w-7xl mx-auto">
        {aboutItems.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.2 }}
            className="flex flex-col items-center text-center"
          >
            <img
              src={item.image}
              alt={item.title}
              className="mb-6 rounded-lg shadow-md object-cover w-full h-60"
            />
            <h3 className="text-lg font-semibold text-teal-600 uppercase tracking-wider">
              {item.title}
            </h3>
            <p className="mt-3 text-gray-700">{item.text}</p>
          </motion.div>
        ))}
      </section>

      {/* Call to Action */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="py-16 text-center text-white bg-teal-500"
      >
        <h2 className="text-3xl font-bold">Design with Us, Not Alone</h2>
        <p className="mt-2">
          Join our platform and discover how smooth collaboration can be.
        </p>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="px-6 py-3 mt-6 font-semibold text-teal-500 bg-white rounded-lg"
        >
          <a href="/signup">Start Your Journey</a>
        </motion.button>
      </motion.section>

      {/* Footer */}
      <footer className="w-full px-6 py-10 text-gray-400 bg-gray-900">
        <div className="grid max-w-6xl grid-cols-1 gap-6 mx-auto md:grid-cols-3">
          <div>
            <h3 className="text-lg font-bold text-white">DesignSync</h3>
            <p>
              Where creativity meets collaboration. Build t-shirts, build
              connections.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-white">Explore</h4>
            <a href="/features" className="block mt-2">
              Features
            </a>
            <a href="/how-it-works" className="block mt-2">
              How It Works
            </a>
            <a href="/pricing" className="block mt-2">
              Pricing
            </a>
          </div>
          <div>
            <h4 className="font-bold text-white">Company</h4>
            <a href="/about" className="block mt-2">
              About Us
            </a>
            <a href="/contact" className="block mt-2">
              Contact
            </a>
            <a href="/careers" className="block mt-2">
              Careers
            </a>
          </div>
        </div>
      </footer>
    </motion.div>
  );
};

export default AboutPage;
