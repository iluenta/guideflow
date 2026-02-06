import React, { useState } from 'react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { GuideScreen } from './components/GuideScreen';
import { InfoCasaScreen } from './components/InfoCasaScreen';
import { NormasScreen } from './components/NormasScreen';
import { GuiaUsoScreen } from './components/GuiaUsoScreen';
import { ThemeProvider } from './components/ThemeProvider';
import { ThemeSwitcher } from './components/ThemeSwitcher';
import { AnimatePresence, motion } from 'framer-motion';
type Screen = 'welcome' | 'guide' | 'info' | 'normas' | 'guia-uso';
export function App() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const slideIn = {
    initial: {
      opacity: 0,
      x: 30
    },
    animate: {
      opacity: 1,
      x: 0
    },
    exit: {
      opacity: 0,
      x: -30
    },
    transition: {
      duration: 0.25
    }
  };
  const slideBack = {
    initial: {
      opacity: 0,
      x: -30
    },
    animate: {
      opacity: 1,
      x: 0
    },
    exit: {
      opacity: 0,
      x: 30
    },
    transition: {
      duration: 0.25
    }
  };
  return (
    <ThemeProvider>
      <div className="min-h-screen w-full bg-gray-200 flex justify-center overflow-hidden">
        <div className="w-full max-w-md h-full min-h-screen bg-white shadow-2xl overflow-y-auto relative no-scrollbar">
          <AnimatePresence mode="wait">
            {screen === 'welcome' &&
            <motion.div key="welcome" className="min-h-screen" {...slideBack}>
                <WelcomeScreen onOpenGuide={() => setScreen('guide')} />
              </motion.div>
            }

            {screen === 'guide' &&
            <motion.div key="guide" className="min-h-screen" {...slideIn}>
                <GuideScreen
                onBack={() => setScreen('welcome')}
                onNavigate={(sub) => setScreen(sub)} />

              </motion.div>
            }

            {screen === 'info' &&
            <motion.div key="info" className="min-h-screen" {...slideIn}>
                <InfoCasaScreen onBack={() => setScreen('guide')} />
              </motion.div>
            }

            {screen === 'normas' &&
            <motion.div key="normas" className="min-h-screen" {...slideIn}>
                <NormasScreen onBack={() => setScreen('guide')} />
              </motion.div>
            }

            {screen === 'guia-uso' &&
            <motion.div key="guia-uso" className="min-h-screen" {...slideIn}>
                <GuiaUsoScreen onBack={() => setScreen('guide')} />
              </motion.div>
            }
          </AnimatePresence>

          <ThemeSwitcher />
        </div>
      </div>
    </ThemeProvider>);

}