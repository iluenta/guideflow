import React, { useEffect, useState } from 'react';
import { Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './ThemeProvider';
export function ThemeSwitcher() {
  const { theme, nextTheme, themeData } = useTheme();
  const [showLabel, setShowLabel] = useState(false);
  const handleSwitch = () => {
    nextTheme();
    setShowLabel(true);
    // Reset timer if clicked again quickly
    const timer = setTimeout(() => {
      setShowLabel(false);
    }, 2000);
    return () => clearTimeout(timer);
  };
  // Capitalize first letter
  const themeName = theme.charAt(0).toUpperCase() + theme.slice(1);
  return (
    <div className="absolute bottom-6 right-6 z-50 flex items-center gap-3">
      <AnimatePresence>
        {showLabel &&
        <motion.div
          initial={{
            opacity: 0,
            x: 10
          }}
          animate={{
            opacity: 1,
            x: 0
          }}
          exit={{
            opacity: 0,
            x: 10
          }}
          className="bg-black/70 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">

            {themeData.propertyName}
          </motion.div>
        }
      </AnimatePresence>

      <motion.button
        onClick={handleSwitch}
        whileHover={{
          scale: 1.1
        }}
        whileTap={{
          scale: 0.9
        }}
        className="w-12 h-12 rounded-full bg-white/80 backdrop-blur-md border border-white/50 shadow-lg flex items-center justify-center text-gray-700 hover:bg-white transition-colors"
        style={{
          color: 'var(--color-primary)'
        }}>

        <motion.div
          key={theme}
          initial={{
            rotate: -90,
            opacity: 0
          }}
          animate={{
            rotate: 0,
            opacity: 1
          }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 15
          }}>

          <Palette size={20} />
        </motion.div>
      </motion.button>
    </div>);

}