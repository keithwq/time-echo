require('./jest.setup.js');

console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? `已设置 (长度: ${process.env.OPENAI_API_KEY.length})` : '❌ 未设置');
console.log('OPENAI_BASE_URL:', process.env.OPENAI_BASE_URL || '❌ 未设置');
console.log('OPENAI_MODEL:', process.env.OPENAI_MODEL || '❌ 未设置');
