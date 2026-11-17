import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'
import { Login } from './components/login.jsx'
import { Register } from './components/register.jsx'

function App() {

  return (
    <>
      {/* Login */}     
      <Login /> 
      {/* Register */}
      <Register />  
      
    </>
  )

}


export default App
