const fs = require('fs').promises;
const path = require('path');

async function testCategoriesData() {
  try {
    console.log('开始测试分类数据...');
    
    // 检查分类文件是否存在
    const categoriesFile = path.join(__dirname, 'src/data/system/categories.json');
    console.log('分类文件路径:', categoriesFile);
    
    try {
      const content = await fs.readFile(categoriesFile, 'utf8');
      const categoriesData = JSON.parse(content);
      console.log('分类文件内容:', JSON.stringify(categoriesData, null, 2));
      
      if (categoriesData.categories && Array.isArray(categoriesData.categories)) {
        console.log('分类数量:', categoriesData.categories.length);
        
        categoriesData.categories.forEach((category, index) => {
          console.log(`分类 ${index + 1}:`, {
            id: category.id,
            name: category.name,
            hasId: !!category.id,
            hasName: !!category.name
          });
        });
      } else {
        console.error('分类数据格式错误');
      }
    } catch (error) {
      console.error('读取分类文件失败:', error);
    }
    
  } catch (error) {
    console.error('测试失败:', error);
  }
}

testCategoriesData(); 