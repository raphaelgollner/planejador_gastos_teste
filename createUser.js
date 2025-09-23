import { neon } from '@netlify/neon';
import { createHash } from 'crypto'; // Módulo nativo do Node.js para criptografia

// Função simples para hashear a senha (para produção, considere bibliotecas como bcrypt)
function hashPassword(password) {
  const sha256 = createHash('sha256');
  sha256.update(password);
  return sha256.digest('hex');
}

export const handler = async (event) => {
  // O Netlify Functions espera que o handler seja exportado
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { name, username, password } = JSON.parse(event.body);

    if (!name || !username || !password) {
      return { statusCode: 400, body: 'Nome, usuário e senha são obrigatórios.' };
    }

    // Conecta ao banco de dados Neon
    const sql = neon();

    // 1. Verifica se o usuário já existe
    const existingUser = await sql`SELECT id FROM users WHERE username = ${username}`;
    if (existingUser.length > 0) {
      return { statusCode: 409, body: 'Este nome de usuário já está em uso.' }; // 409 Conflict
    }

    // 2. Hashea a senha
    const passwordHash = hashPassword(password);

    // 3. Insere o novo usuário no banco de dados
    await sql`INSERT INTO users (name, username, password_hash) VALUES (${name}, ${username}, ${passwordHash})`;

    return {
      statusCode: 201, // 201 Created
      body: JSON.stringify({ message: 'Usuário criado com sucesso!' }),
    };

  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return {
      statusCode: 500,
      body: 'Erro interno ao processar a solicitação.',
    };
  }
};
