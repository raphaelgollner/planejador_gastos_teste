import { neon } from '@netlify/neon';
import { createHash } from 'crypto';

// A mesma função de hash usada no cadastro
function hashPassword(password) {
  const sha256 = createHash('sha256');
  sha256.update(password);
  return sha256.digest('hex');
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { username, password } = JSON.parse(event.body);

    if (!username || !password) {
      return { statusCode: 400, body: 'Usuário e senha são obrigatórios.' };
    }

    const sql = neon();

    // 1. Busca o usuário pelo username
    const users = await sql`SELECT password_hash FROM users WHERE username = ${username}`;

    if (users.length === 0) {
      // Usuário não encontrado
      return { statusCode: 401, body: 'Usuário ou senha inválidos.' }; // 401 Unauthorized
    }

    // 2. Pega o hash salvo no banco
    const savedHash = users[0].password_hash;
    // 3. Hashea a senha que o usuário digitou agora
    const enteredPasswordHash = hashPassword(password);

    // 4. Compara os hashes
    if (savedHash === enteredPasswordHash) {
      // Senha correta! Login bem-sucedido.
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Login realizado com sucesso!' }),
      };
    } else {
      // Senha incorreta
      return { statusCode: 401, body: 'Usuário ou senha inválidos.' };
    }

  } catch (error) {
    console.error('Erro no login:', error);
    return {
      statusCode: 500,
      body: 'Erro interno ao processar a solicitação.',
    };
  }
};
