const http = require('http');

const API_BASE = 'localhost';
const API_PORT = 8081;

// 发送HTTP请求的通用函数
function makeRequest(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_BASE,
      port: API_PORT,
      path: `/api${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({ status: res.statusCode, data: result });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// 模拟登录获取token
async function login() {
  try {
    const result = await makeRequest('POST', '/auth/login', {}, {
      username: 'admin@mm.com',
      password: '123456'
    });
    
    console.log('登录响应:', result);
    
    if (result.status === 200 && result.data.success) {
      return result.data.token;
    } else {
      throw new Error(result.data.error || '登录失败');
    }
  } catch (error) {
    console.error('登录失败:', error);
    return null;
  }
}

// 测试获取分类
async function testGetCategories(token) {
  try {
    const result = await makeRequest('GET', '/system/categories', {
      'Authorization': `Bearer ${token}`
    });
    
    console.log('获取分类响应:', result);
    return result;
  } catch (error) {
    console.error('获取分类失败:', error);
    return null;
  }
}

// 测试删除分类
async function testDeleteCategory(token, categoryId) {
  try {
    console.log(`尝试删除分类: ${categoryId}`);
    const result = await makeRequest('DELETE', `/system/categories/${categoryId}`, {
      'Authorization': `Bearer ${token}`
    });
    
    console.log('删除分类响应:', result);
    return result;
  } catch (error) {
    console.error('删除分类失败:', error);
    return null;
  }
}

// 主测试函数
async function runTests() {
  console.log('开始测试分类管理功能...');
  
  // 1. 登录
  const token = await login();
  if (!token) {
    console.error('登录失败，无法继续测试');
    return;
  }
  console.log('登录成功，Token:', token);
  
  // 2. 获取分类
  console.log('\n=== 测试获取分类 ===');
  const categoriesResult = await testGetCategories(token);
  
  if (categoriesResult.status === 200 && categoriesResult.data.success && categoriesResult.data.data && categoriesResult.data.data.categories) {
    console.log('分类数据:', categoriesResult.data.data.categories);
    
    // 3. 测试删除第一个分类
    if (categoriesResult.data.data.categories.length > 0) {
      const firstCategory = categoriesResult.data.data.categories[0];
      console.log(`\n=== 测试删除分类: ${firstCategory.name} (${firstCategory.id}) ===`);
      await testDeleteCategory(token, firstCategory.id);
    }
  } else {
    console.error('获取分类失败或数据格式错误');
  }
}

// 运行测试
runTests().catch(console.error); 