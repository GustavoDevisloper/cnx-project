// Função para criar uma nova conta e obter token JWT
async function createAccountAndGetToken(name, email, password) {
  try {
    console.log("Criando nova conta com email:", email);
    const response = await fetch('https://www.abibliadigital.com.br/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        email,
        password,
        notifications: true
      })
    });
    
    // Verificar se a resposta é JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error("Erro: API retornou formato não-JSON:", contentType);
      const text = await response.text();
      console.error("Resposta da API:", text.substring(0, 200) + "...");
      return null;
    }
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('Conta criada com sucesso!');
      console.log('Seu token JWT:', data.token);
      return data.token;
    } else {
      console.error('Erro ao criar conta:', data.msg || 'Erro desconhecido');
      return null;
    }
  } catch (error) {
    console.error('Erro de conexão:', error);
    return null;
  }
}

// Função para fazer login e obter token JWT
async function loginAndGetToken(email, password) {
  try {
    console.log("Tentando login com email:", email);
    const response = await fetch('https://www.abibliadigital.com.br/api/users/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password
      })
    });
    
    // Verificar se a resposta é JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error("Erro: API retornou formato não-JSON:", contentType);
      const text = await response.text();
      console.error("Resposta da API (primeiros 200 caracteres):", text.substring(0, 200) + "...");
      console.log("Tentando método alternativo...");
      return null;
    }
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('Login bem-sucedido!');
      console.log('Seu token JWT:', data.token);
      return data.token;
    } else {
      console.error('Erro ao fazer login:', data.msg || 'Erro desconhecido');
      return null;
    }
  } catch (error) {
    console.error('Erro de conexão:', error);
    return null;
  }
}

// Função para testar o token com uma requisição simples
async function testToken(token) {
  try {
    console.log("Testando token com uma requisição simples...");
    const response = await fetch('https://www.abibliadigital.com.br/api/books', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      console.log('Token funcional! ✅');
      return true;
    } else {
      console.error('Token inválido ou API indisponível ❌');
      return false;
    }
  } catch (error) {
    console.error('Erro ao testar token:', error);
    return false;
  }
}

// Exemplo de uso
async function main() {
  // Use informações reais aqui
  const nome = "Gustavo";
  const email = "gustavohenriquemd4@gmail.com";  // Use um email real
  const senha = "123456";       // Mínimo 6 caracteres
  
  // Tente criar uma conta primeiro (mais confiável atualmente)
  let token = await createAccountAndGetToken(nome, email, senha);
  
  // Se não conseguir criar, tenta fazer login
  if (!token) {
    console.log('Criação de conta falhou. Tentando login...');
    token = await loginAndGetToken(email, senha);
  }
  
  if (token) {
    console.log('-'.repeat(50));
    console.log('Adicione esta linha ao seu arquivo .env:');
    console.log(`VITE_BIBLE_API_KEY=${token}`);
    console.log('-'.repeat(50));
    
    // Testa o token com uma requisição simples
    await testToken(token);
  } else {
    console.error("⚠️ Não foi possível obter um token. Verifique sua conexão ou tente novamente mais tarde.");
  }
}

// Execute a função
main().catch(error => {
  console.error("Erro fatal:", error);
});
