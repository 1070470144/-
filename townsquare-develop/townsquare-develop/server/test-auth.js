/**
 * 认证功能测试脚本
 */

const API_BASE = 'http://localhost:8081/api';

async function testAuth() {
  console.log('🚀 开始认证功能测试...\n');

  // 1. 测试注册
  console.log('1. 测试用户注册...');
  try {
    const registerResponse = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'testuser',
        password: '123456'
      })
    });

    const registerData = await registerResponse.json();
    console.log('   状态码:', registerResponse.status);
    console.log('   成功:', registerData.success);
    
    if (registerData.success) {
      console.log('   用户信息:', registerData.user);
      console.log('   Token:', registerData.token ? '已生成' : '未生成');
    } else {
      console.log('   错误:', registerData.error);
    }
  } catch (error) {
    console.error('   注册测试失败:', error);
  }

  console.log('\n2. 测试用户登录...');
  try {
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'testuser',
        password: '123456'
      })
    });

    const loginData = await loginResponse.json();
    console.log('   状态码:', loginResponse.status);
    console.log('   成功:', loginData.success);
    
    if (loginData.success) {
      console.log('   用户信息:', loginData.user);
      console.log('   Token:', loginData.token ? '已生成' : '未生成');
      
      // 3. 测试获取用户信息
      console.log('\n3. 测试获取用户信息...');
      try {
        const profileResponse = await fetch(`${API_BASE}/auth/profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${loginData.token}`
          }
        });

        const profileData = await profileResponse.json();
        console.log('   状态码:', profileResponse.status);
        console.log('   成功:', profileData.success);
        
        if (profileData.success) {
          console.log('   用户信息:', profileData.user);
        } else {
          console.log('   错误:', profileData.error);
        }
      } catch (error) {
        console.error('   获取用户信息失败:', error);
      }
    } else {
      console.log('   错误:', loginData.error);
    }
  } catch (error) {
    console.error('   登录测试失败:', error);
  }

  // 4. 测试重复注册
  console.log('\n4. 测试重复注册...');
  try {
    const duplicateResponse = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'testuser',
        password: '123456'
      })
    });

    const duplicateData = await duplicateResponse.json();
    console.log('   状态码:', duplicateResponse.status);
    console.log('   成功:', duplicateData.success);
    console.log('   错误:', duplicateData.error);
  } catch (error) {
    console.error('   重复注册测试失败:', error);
  }

  // 5. 测试错误密码登录
  console.log('\n5. 测试错误密码登录...');
  try {
    const wrongPasswordResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'testuser',
        password: 'wrongpassword'
      })
    });

    const wrongPasswordData = await wrongPasswordResponse.json();
    console.log('   状态码:', wrongPasswordResponse.status);
    console.log('   成功:', wrongPasswordData.success);
    console.log('   错误:', wrongPasswordData.error);
  } catch (error) {
    console.error('   错误密码登录测试失败:', error);
  }

  console.log('\n✅ 认证功能测试完成！');
}

// 运行测试
testAuth().catch(console.error); 