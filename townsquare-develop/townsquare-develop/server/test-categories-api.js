const fetch = require('node-fetch');

async function testCategoriesAPI() {
  try {
    console.log('🧪 测试分类API...');
    
    const response = await fetch('http://localhost:8081/api/system/categories', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 响应状态:', response.status);
    console.log('📄 响应头:', response.headers.get('content-type'));

    if (response.ok) {
      const data = await response.json();
      console.log('✅ 分类API测试成功:', data);
    } else {
      const text = await response.text();
      console.error('❌ 分类API测试失败:', text);
    }
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testCategoriesAPI(); 