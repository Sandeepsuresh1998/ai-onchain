import logo from './logo.svg';
import './App.css';
import Navbar from 'react-bootstrap/Navbar';

function App() {
  return (
    <div className="App">
      <header className="App-header">
      <Navbar bg="light" expand="lg">
        <button>Connect Wallet</button>
        <button>Create</button>
        <button>Marketplace</button>
      </Navbar>
        <img src={logo} className="App-logo" alt="logo" />
      </header>
    </div>
  );
}

export default App;
