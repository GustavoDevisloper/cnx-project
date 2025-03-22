// Função para criar uma conta e obter a API key
async function getBibleApiKey(name, email, password) {
  try {
    const response = await fetch('https://www.abibliadigital.com.br/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        email,
        password,
        notifications: true // opcional
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('Conta criada com sucesso!');
      console.log('Sua API key/token:', data.token);
      return data.token;
    } else {
      console.error('Erro ao criar conta:', data.msg);
      return null;
    }
  } catch (error) {
    console.error('Erro de conexão:', error);
    return null;
  }
}

// Exemplo de uso
async function main() {
  const nome = "Gustavo";
  const email = "gustavomd4@gmail.com";
  const senha = "Bilola123";
  
  const apiKey = await getBibleApiKey(nome, email, senha);
  
  if (apiKey) {
    // Após obter a chave, você pode adicioná-la ao seu arquivo .env
    console.log('Adicione esta linha ao seu arquivo .env:');
    console.log(`VITE_BIBLE_API_KEY=${apiKey}`);
  }
}

// Execute a função
main();
