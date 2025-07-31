const http = require('http');

// 测试API连接
function testAPI() {
  const options = {
    hostname: 'localhost',
    port: 8081,
    path: '/api/test',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`状态码: ${res.statusCode}`);
    console.log(`响应头: ${JSON.stringify(res.headers)}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('响应数据:', data);
    });
  });

  req.on('error', (e) => {
    console.error(`请求错误: ${e.message}`);
  });

  req.end();
}

// 测试剧本API
function testScriptsAPI() {
  const options = {
    hostname: 'localhost',
    port: 8081,
    path: '/api/scripts/stats/info',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`剧本API状态码: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('剧本API响应:', data);
    });
  });

  req.on('error', (e) => {
    console.error(`剧本API请求错误: ${e.message}`);
  });

  req.end();
}

console.log('开始测试API...');
testAPI();
setTimeout(testScriptsAPI, 1000); 