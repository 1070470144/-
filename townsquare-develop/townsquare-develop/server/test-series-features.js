/**
 * 剧本系列管理功能测试脚本
 */

const API_BASE = 'http://localhost:8081/api';

async function testSeriesFeatures() {
  console.log('🚀 开始剧本系列管理功能测试...\n');

  let adminToken = null;

  // 1. 管理员登录
  console.log('1. 管理员登录...');
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

  // 2. 测试创建剧本系列
  console.log('\n2. 测试创建剧本系列...');
  try {
    const createSeriesResponse = await fetch(`${API_BASE}/scripts/series`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: '测试系列',
        description: '这是一个测试系列',
        category: 'custom'
      })
    });

    const createSeriesData = await createSeriesResponse.json();
    console.log('   状态码:', createSeriesResponse.status);
    console.log('   成功:', createSeriesData.success);
    
    if (createSeriesData.success) {
      console.log('   系列创建成功:', createSeriesData.data.name);
    } else {
      console.log('   错误:', createSeriesData.error);
    }
  } catch (error) {
    console.error('   创建系列失败:', error);
  }

  // 3. 测试获取剧本系列
  console.log('\n3. 测试获取剧本系列...');
  try {
    const getSeriesResponse = await fetch(`${API_BASE}/scripts/series`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    const getSeriesData = await getSeriesResponse.json();
    console.log('   状态码:', getSeriesResponse.status);
    console.log('   成功:', getSeriesData.success);
    
    if (getSeriesData.success) {
      console.log('   系列数量:', getSeriesData.data.length);
      if (getSeriesData.data.length > 0) {
        console.log('   第一个系列:', getSeriesData.data[0].name);
      }
    } else {
      console.log('   错误:', getSeriesData.error);
    }
  } catch (error) {
    console.error('   获取系列失败:', error);
  }

  // 4. 测试排行榜功能
  console.log('\n4. 测试排行榜功能...');
  try {
    const rankingResponse = await fetch(`${API_BASE}/scripts`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    const rankingData = await rankingResponse.json();
    console.log('   状态码:', rankingResponse.status);
    console.log('   成功:', rankingData.success);
    
    if (rankingData.success) {
      const totalScripts = (rankingData.data.custom || []).length + 
                          (rankingData.data.official || []).length;
      console.log('   总剧本数:', totalScripts);
    } else {
      console.log('   错误:', rankingData.error);
    }
  } catch (error) {
    console.error('   获取排行榜失败:', error);
  }

  // 5. 测试统计功能
  console.log('\n5. 测试统计功能...');
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
    console.error('   获取统计失败:', error);
  }

  console.log('\n✅ 剧本系列管理功能测试完成！');
}

// 运行测试
testSeriesFeatures().catch(console.error); 