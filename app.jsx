/* global window, React, ReactDOM */
const { useState } = React;

const App = () => {
  const [screen, setScreen] = useState('welcome');
  const Welcome = window.Welcome;
  const ArrivalScreen = window.ArrivalScreen;

  return (
    <div className="viewport" key={screen}>
      {screen === 'welcome' && <Welcome onOpenEntry={() => { window.scrollTo(0,0); setScreen('arrival'); }} />}
      {screen === 'arrival' && <ArrivalScreen onBack={() => { window.scrollTo(0,0); setScreen('welcome'); }} />}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
