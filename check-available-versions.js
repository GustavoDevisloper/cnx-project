// Script para verificar as versões da Bíblia disponíveis na API
async function checkAvailableVersions(token) {
  try {
    const response = await fetch('https://www.abibliadigital.com.br/api/versions', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      console.error(`Erro: ${response.status} - ${response.statusText}`);
      return;
    }
    
    const versions = await response.json();
    console.log('Versões disponíveis na API:');
    console.table(versions);
    
    // Criar mapeamento para usar no código
    console.log('\nCódigo para atualizar apiVersionMapping:');
    const mappingCode = {};
    versions.forEach(v => {
      // Converter para sigla em maiúsculas (ex: 'nvi' para 'NVI')
      const sigla = v.version.toUpperCase();
      mappingCode[sigla] = v.version;
    });
    
    console.log(JSON.stringify(mappingCode, null, 2));
    
  } catch (error) {
    console.error('Erro ao verificar versões:', error);
  }
}

// Use seu token JWT aqui
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdHIiOiJUaHUgTWFyIDEzIDIwMjUgMDE6NDc6MzUgR01UKzAwMDAuZ3VzdGF2b2hlbnJpcXVlbWQ0QGdtYWlsLmNvbSIsImlhdCI6MTc0MTgzMDQ1NX0.2ErPmj2iYcpJeVNmkO9a8qqEX5fO8iEvAgPkjTEL8lU';
checkAvailableVersions(token); 