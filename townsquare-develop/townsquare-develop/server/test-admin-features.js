/**
 * 管理员功能测试脚本
 */

const API_BASE = 'http://localhost:8081/api';

async function testAdminFeatures() {
  console.log('🚀 开始管理员功能测试...\n');

  let adminToken = null;
  let testUserId = null;

  // 1. 创建管理员用户
  console.log('1. 创建管理员用户...');
  try {
    const registerResponse = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });

    const registerData = await registerResponse.json();
    console.log('   状态码:', registerResponse.status);
    console.log('   成功:', registerData.success);
    
    if (registerData.success) {
      adminToken = registerData.token;
      console.log('   管理员Token已获取');
    } else {
      console.log('   错误:', registerData.error);
    }
  } catch (error) {
    console.error('   注册管理员失败:', error);
  }

  // 2. 登录管理员
  console.log('\n2. 管理员登录...');
  try {
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });

    const loginData = await loginResponse.json();
    console.log('   状态码:', loginResponse.status);
    console.log('   成功:', loginData.success);
    
    if (loginData.success) {
      adminToken = loginData.token;
      console.log('   管理员登录成功');
    } else {
      console.log('   错误:', loginData.error);
    }
  } catch (error) {
    console.error('   管理员登录失败:', error);
  }

  if (!adminToken) {
    console.log('❌ 无法获取管理员Token，测试终止');
    return;
  }

  // 3. 测试获取用户列表
  console.log('\n3. 测试获取用户列表...');
  try {
    const usersResponse = await fetch(`${API_BASE}/auth/users`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    const usersData = await usersResponse.json();
    console.log('   状态码:', usersResponse.status);
    console.log('   成功:', usersData.success);
    
    if (usersData.success) {
      console.log('   用户数量:', usersData.data.length);
      testUserId = usersData.data[0]?.id;
    } else {
      console.log('   错误:', usersData.error);
    }
  } catch (error) {
    console.error('   获取用户列表失败:', error);
  }

  // 4. 测试系统统计
  console.log('\n4. 测试系统统计...');
  try {
    const statsResponse = await fetch(`${API_BASE}/system/stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    const statsData = await statsResponse.json();
    console.log('   状态码:', statsResponse.status);
    console.log('   成功:', statsData.success);
    
    if (statsData.success) {
      console.log('   系统统计:', statsData.data);
    } else {
      console.log('   错误:', statsData.error);
    }
  } catch (error) {
    console.error('   获取系统统计失败:', error);
  }

  // 5. 测试注册开关
  console.log('\n5. 测试注册开关...');
  try {
    const toggleResponse = await fetch(`${API_BASE}/system/registration`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ enabled: false })
    });

    const toggleData = await toggleResponse.json();
    console.log('   状态码:', toggleResponse.status);
    console.log('   成功:', toggleData.success);
    
    if (toggleData.success) {
      console.log('   注册状态:', toggleData.enabled ? '已启用' : '已禁用');
    } else {
      console.log('   错误:', toggleData.error);
    }
  } catch (error) {
    console.error('   切换注册状态失败:', error);
  }

  // 6. 测试剧本审核功能
  console.log('\n6. 测试剧本审核功能...');
  try {
    const pendingResponse = await fetch(`${API_BASE}/scripts/pending`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    const pendingData = await pendingResponse.json();
    console.log('   状态码:', pendingResponse.status);
    console.log('   成功:', pendingData.success);
    
    if (pendingData.success) {
      console.log('   待审核剧本数量:', pendingData.data.length);
    } else {
      console.log('   错误:', pendingData.error);
    }
  } catch (error) {
    console.error('   获取待审核剧本失败:', error);
  }

  // 7. 测试点赞和使用功能
  console.log('\n7. 测试点赞和使用功能...');
  try {
    // 先获取一个剧本
    const scriptsResponse = await fetch(`${API_BASE}/scripts`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    const scriptsData = await scriptsResponse.json();
    if (scriptsData.success && scriptsData.data.custom.length > 0) {
      const scriptId = scriptsData.data.custom[0].id;
      
      // 测试点赞
      const likeResponse = await fetch(`${API_BASE}/scripts/${scriptId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      const likeData = await likeResponse.json();
      console.log('   点赞测试:', likeData.success ? '成功' : '失败');

      // 测试使用
      const useResponse = await fetch(`${API_BASE}/scripts/${scriptId}/use`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      const useData = await useResponse.json();
      console.log('   使用测试:', useData.success ? '成功' : '失败');
    } else {
      console.log('   没有可测试的剧本');
    }
  } catch (error) {
    console.error('   点赞/使用测试失败:', error);
  }

  console.log('\n✅ 管理员功能测试完成！');
}

// 运行测试
testAdminFeatures().catch(console.error); 