// Script de prueba simple para el endpoint forgot-password
import fetch from 'node-fetch'

const testForgotPassword = async () => {
  try {
    console.log('Probando endpoint forgot-password...')
    
    const response = await fetch('http://localhost:3001/api/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@test.com'
      })
    })
    
    const data = await response.json()
    console.log('Respuesta:', data)
    console.log('Status:', response.status)
    
  } catch (error) {
    console.error('Error en la prueba:', error)
  }
}

testForgotPassword()