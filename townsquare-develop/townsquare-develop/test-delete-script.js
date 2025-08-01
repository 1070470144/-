const fetch = require('node-fetch');

async function testDeleteScript() {
  const scriptId = 'snv'; // 测试删除的剧本ID
  const type = 'custom'; // 剧本类型
  
  try {
    console.log(`测试删除剧本: ${scriptId}, 类型: ${type}`);
    
    const response = await fetch(`http://localhost:8081/api/scripts/${scriptId}?type=${type}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // 测试用token
      }
    });
    
    const result = await response.json();
    console.log('删除结果:', result);
    
    if (result.success) {
      console.log('✅ 删除成功');
    } else {
      console.log('❌ 删除失败:', result.error);
    }
  } catch (error) {
    console.error('❌ 请求失败:', error);
  }
}

testDeleteScript(); 