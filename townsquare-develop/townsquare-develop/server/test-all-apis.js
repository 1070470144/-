const http = require('http');

const API_BASE = 'http://localhost:8081/api';

// 测试数据
const testScript = {
  id: 'test_script_' + Date.now(),
  name: '测试剧本',
  author: '测试作者',
  description: '这是一个测试剧本',
  roles: ['1_82', '2_1'],
  roleDetails: [
    {
      id: '1_82',
      name: '乞丐',
      team: 'traveler',
      ability: '你只能使用投票标记投票...'
    },
    {
      id: '2_1',
      name: '镇民',
      team: 'townsfolk',
      ability: '你是镇民...'
    }
  ],
  category: '测试分类',
  level: 'Beginner'
};

// 测试函数
async function testAPI(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 8081,
      path: `/api${endpoint}`,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            success: res.statusCode >= 200 && res.statusCode < 300,
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            success: false,
            data: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// 运行所有测试
async function runAllTests() {
  console.log('🚀 开始API测试...\n');

  try {
    // 1. 测试获取存储统计
    console.log('1. 测试获取存储统计...');
    const statsResult = await testAPI('/scripts/stats/info');
    console.log(`   状态码: ${statsResult.status}`);
    console.log(`   成功: ${statsResult.success}`);
    console.log(`   数据: ${JSON.stringify(statsResult.data, null, 2)}\n`);

    // 2. 测试获取所有剧本
    console.log('2. 测试获取所有剧本...');
    const getAllResult = await testAPI('/scripts');
    console.log(`   状态码: ${getAllResult.status}`);
    console.log(`   成功: ${getAllResult.success}`);
    console.log(`   剧本数量: ${getAllResult.success ? Object.values(getAllResult.data).flat().length : 'N/A'}\n`);

    // 3. 测试保存剧本
    console.log('3. 测试保存剧本...');
    const saveResult = await testAPI('/scripts?type=custom', 'POST', testScript);
    console.log(`   状态码: ${saveResult.status}`);
    console.log(`   成功: ${saveResult.success}`);
    console.log(`   响应: ${JSON.stringify(saveResult.data, null, 2)}\n`);

    // 4. 测试获取单个剧本
    console.log('4. 测试获取单个剧本...');
    const getOneResult = await testAPI(`/scripts/${testScript.id}?type=custom`);
    console.log(`   状态码: ${getOneResult.status}`);
    console.log(`   成功: ${getOneResult.success}`);
    console.log(`   剧本名称: ${getOneResult.success ? getOneResult.data.data.name : 'N/A'}\n`);

    // 5. 测试更新剧本
    console.log('5. 测试更新剧本...');
    const updateData = { ...testScript, name: '更新后的测试剧本' };
    const updateResult = await testAPI(`/scripts/${testScript.id}?type=custom`, 'PUT', updateData);
    console.log(`   状态码: ${updateResult.status}`);
    console.log(`   成功: ${updateResult.success}\n`);

    // 6. 测试批量导入
    console.log('6. 测试批量导入...');
    const importData = {
      scripts: [
        { ...testScript, id: 'batch_test_1', name: '批量测试剧本1' },
        { ...testScript, id: 'batch_test_2', name: '批量测试剧本2' }
      ],
      type: 'custom'
    };
    const importResult = await testAPI('/scripts/import?type=custom', 'POST', importData);
    console.log(`   状态码: ${importResult.status}`);
    console.log(`   成功: ${importResult.success}`);
    console.log(`   导入结果: ${JSON.stringify(importResult.data, null, 2)}\n`);

    // 7. 测试删除剧本
    console.log('7. 测试删除剧本...');
    const deleteResult = await testAPI(`/scripts/${testScript.id}?type=custom`, 'DELETE');
    console.log(`   状态码: ${deleteResult.status}`);
    console.log(`   成功: ${deleteResult.success}\n`);

    // 8. 最终统计
    console.log('8. 最终统计...');
    const finalStats = await testAPI('/scripts/stats/info');
    console.log(`   状态码: ${finalStats.status}`);
    console.log(`   成功: ${finalStats.success}`);
    console.log(`   最终统计: ${JSON.stringify(finalStats.data, null, 2)}\n`);

    console.log('✅ 所有API测试完成！');

  } catch (error) {
    console.error('❌ API测试失败:', error.message);
  }
}

// 运行测试
runAllTests(); 