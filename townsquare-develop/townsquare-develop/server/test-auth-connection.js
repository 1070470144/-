/**
 * 认证API连接测试脚本
 */

// 使用内置的 fetch (Node.js 18+)

const API_BASE = 'http://localhost:8081/api';

async function testAuthConnection() {
  console.log('🔍 开始测试认证API连接...\n');

  try {
    // 测试1: 检查服务器是否运行
    console.log('📡 测试1: 检查服务器连接...');
    const response = await fetch(`${API_BASE}/auth/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ 服务器响应状态: ${response.status}`);
    console.log(`📊 响应头: ${response.headers.get('content-type')}`);
    
    if (response.status === 401) {
      console.log('✅ 服务器正常运行，认证端点可访问');
    } else {
      console.log(`⚠️  意外状态码: ${response.status}`);
    }

    // 测试2: 测试注册功能
    console.log('\n📡 测试2: 测试注册功能...');
    const registerResponse = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'testuser_' + Date.now(),
        password: 'testpass123'
      })
    });

    console.log(`📊 注册响应状态: ${registerResponse.status}`);
    console.log(`📊 注册响应类型: ${registerResponse.headers.get('content-type')}`);

    if (registerResponse.ok) {
      const registerData = await registerResponse.json();
      console.log('✅ 注册功能正常');
      console.log('📄 注册响应:', registerData);
    } else {
      const errorText = await registerResponse.text();
      console.log('❌ 注册功能异常');
      console.log('📄 错误响应:', errorText.substring(0, 200));
    }

    // 测试3: 测试登录功能
    console.log('\n📡 测试3: 测试登录功能...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'testuser_' + Date.now(),
        password: 'testpass123'
      })
    });

    console.log(`📊 登录响应状态: ${loginResponse.status}`);
    console.log(`📊 登录响应类型: ${loginResponse.headers.get('content-type')}`);

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ 登录功能正常');
      console.log('📄 登录响应:', loginData);
    } else {
      const errorText = await loginResponse.text();
      console.log('❌ 登录功能异常');
      console.log('📄 错误响应:', errorText.substring(0, 200));
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('🔍 错误详情:', {
      message: error.message,
      stack: error.stack,
      API_BASE: API_BASE
    });
  }

  console.log('\n✅ 认证API连接测试完成！');
}

// 运行测试
testAuthConnection(); 