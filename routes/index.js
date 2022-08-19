const express = require('express');
const router = express.Router();
const request = require('sync-request');
const cheerio = require('cheerio');
const fs = require('fs-extra')  // 文件读写
const Json2csvParser = require('json2csv').Parser;  // 数据格式转换
const iconv = require('iconv-lite');  //  数据编码转换
const path = require('path')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
router.get('/creation-js-api', async function(req, res, next) {
  console.log('进入请求')
  let url = req.query.url || ''
  const productList = []
  let count = 0
  let body = request('POST', url);
  body = body.getBody('utf8');
  let code = 10000
  const excelHeader = [
    'Handle',
    'Title',
    'Body (HTML)',
    'Vendor',
    'Standardized Product Type',
    'Custom Product Type',
    'Tags',
    'Published',
    'Option1 Name',
    'Option1 Value',
    'Option2 Name',
    'Option2 Value',
    'Option3 Name',
    'Option3 Value',
    'Variant SKU',
    'Variant Grams',
    'Variant Inventory Tracker',
    'Variant Inventory Qty',
    'Variant Inventory Policy',
    'Variant Fulfillment Service',
    'Variant Price',
    'Variant Compare At Price',
    'Variant Requires Shipping',
    'Variant Taxable',
    'Variant Barcode',
    'Image Src',
    'Image Position',
    'Image Alt Text',
    'Gift Card',
    'SEO Title',
    'SEO Description',
    'Google Shopping / Google Product Category',
    'Google Shopping / Gender',
    'Google Shopping / Age Group',
    'Google Shopping / MPN',
    'Google Shopping / AdWords Grouping',
    'Google Shopping / AdWords Labels',
    'Google Shopping / Condition',
    'Google Shopping / Custom Product',
    'Google Shopping / Custom Label 0',
    'Google Shopping / Custom Label 1',
    'Google Shopping / Custom Label 2',
    'Google Shopping / Custom Label 3',
    'Google Shopping / Custom Label 4',
    'Variant Image',
    'Variant Weight Unit',
    'Variant Tax Code',
    'Cost per item',
    'Status',
  ]
  const tmpData = {
    'Handle': '',
    'Title': '',
    'Body (HTML)': '',
    'Vendor': '',
    'Standardized Product Type': '',
    'Custom Product Type': '',
    'Tags': '',
    'Published': '',
    'Option1 Name': '',
    'Option1 Value': '',
    'Option2 Name': '',
    'Option2 Value': '',
    'Option3 Name': '',
    'Option3 Value': '',
    'Variant SKU': '',
    'Variant Grams': '',
    'Variant Inventory Tracker': '',
    'Variant Inventory Qty': '',
    'Variant Inventory Policy': 'deny',
    'Variant Fulfillment Service': 'manual',
    'Variant Price': '',
    'Variant Compare At Price': '',
    'Variant Requires Shipping': 'TRUE',
    'Variant Taxable': 'FALSE',
    'Variant Barcode': '',
    'Image Src': '',
    'Image Position': '',
    'Image Alt Text': '',
    'Gift Card': '',
    'SEO Title': '',
    'SEO Description': '',
    'Google Shopping / Google Product Category': '',
    'Google Shopping / Gender': '',
    'Google Shopping / Age Group': '',
    'Google Shopping / MPN': '',
    'Google Shopping / AdWords Grouping': '',
    'Google Shopping / AdWords Labels': '',
    'Google Shopping / Condition': '',
    'Google Shopping / Custom Product': '',
    'Google Shopping / Custom Label 0': '',
    'Google Shopping / Custom Label 1': '',
    'Google Shopping / Custom Label 2': '',
    'Google Shopping / Custom Label 3': '',
    'Google Shopping / Custom Label 4': '',
    'Variant Image': '',
    'Variant Weight Unit': 'kg',
    'Variant Tax Code': '',
    'Cost per item': '',
    'Status': '',
    'originalUrl': ''
  }
  try {
    const list = body.split('&&&')
    list.forEach((item, index) => {
      if (!item) return
      item = JSON.parse(item)
      if (item && item[1] && item[1].indexOf('data-main-slot:') >= 0) {
        //  if (count > 0) return
        count++
        let $ = cheerio.load(item[2].html)
        let pUrl = 'https://www.amazon.in' + $('.a-link-normal').attr('href')
        body = request('POST', pUrl, {
          headers: {
            "content-type": "application/json",
          },
          data: {
            'customer-action': "query"
          }
        });
        body = body.getBody('utf8')
        console.log('商品html======================================' + index)
        console.log(pUrl)
        $ = cheerio.load(body)
        const mainProduct = {}
        mainProduct['Vendor'] = 'pawsmall'
        mainProduct['Published'] = 'TRUE'
        mainProduct['Gift Card'] = 'FALSE'
        mainProduct['Status'] = 'active'
        //  备注信息
        const featureBullets = $('#feature-bullets')
        if (featureBullets) {
          //  featureBullets
          mainProduct['Body (HTML)'] = featureBullets.html()
        }
        //  颜色图片选择框
        const colorElm = $('#variation_color_name')
        const colorList = []
        if (colorElm) {
          for (let i = 0; i < colorElm.find('li').length;i++) {
            if (i === 0) {
              mainProduct['Option2 Name'] = 'Colour'
              mainProduct['Option2 Value'] = colorElm.find('img')[i].attribs['alt']
            }
            colorList.push({
              number: colorElm.find('li')[i].attribs['data-defaultasin'],
              color: colorElm.find('img')[i].attribs['alt']
            })
          }
        }
        //  尺寸选择
        const sizeElm = $('#native_dropdown_selected_size_name')
        if (sizeElm && sizeElm.find('option').length) {
          console.log('尺寸配置')
          let sizeFirst = true
          const subProductList = []
          //  有尺寸选择
          for (let i = 0; i < sizeElm.find('option').length;i++) {
            const value = (sizeElm.find('option')[i].attribs['value']).split(',')
            if (parseInt(value[0]) !== -1 && value[1]) {
              let urlLsit = pUrl.split('/')
              console.log(parseInt(value[0]), value[1])
              if (urlLsit[5] && urlLsit[5].length === 10) {
                console.log(sizeElm.find('option')[i].attribs['data-a-html-content'])
                urlLsit.splice(5, 1, value[1])
                urlLsit = urlLsit.join('/')
                console.log('尺寸产品地址')
                console.log(urlLsit)
                let productSizeBody = request('POST', urlLsit, {
                  headers: {
                    "content-type": "application/json",
                  },
                  data: {
                    'customer-action': "query"
                  },
                  timeout: 10000
                });
                productSizeBody = productSizeBody.getBody('utf8')
                $product = cheerio.load(productSizeBody)
                const discountPrice =$product('#apex_desktop .apexPriceToPay').find('.a-offscreen').html() || $('#apex_desktop .priceToPay').find('.a-offscreen').html()
                const originalPrice =$product('#apex_desktop span[data-a-color = secondary]').find('span[aria-hidden = true]').html()
                if(sizeFirst) {
                  console.log(1)
                  //  第一个尺码
                  const title = ($product('#productTitle').html()).trim()
                  console.log(2)
                  mainProduct['Handle'] = title
                  console.log(3)
                  mainProduct['Title'] = title
                  console.log(4)
                  mainProduct['Variant Grams'] = originalPrice
                  mainProduct['Variant Price'] = discountPrice
                  console.log(5)
                  mainProduct['Option1 Name'] = 'SIZE'
                  mainProduct['Option1 Value'] = sizeElm.find('option')[i].attribs['data-a-html-content']
                  mainProduct['Variant Image'] = $product('#imgTagWrapperId img')[0].attribs['data-old-hires']
                  mainProduct['originalUrl'] = urlLsit
                  sizeFirst = false
                  subProductList.push({
                    ...tmpData,
                    ...mainProduct
                  })
                  
                } else {
                  //  其他尺码
                  subProductList.push({
                    ...tmpData,
                    'Handle': ($product('#productTitle').html()).trim(),
                    'Option1 Value': sizeElm.find('option')[i].attribs['data-a-html-content'],
                    'Variant Grams': originalPrice,
                    'Variant Price': discountPrice
                  })
                }
              } else {
                code = 9999
                console.log('重定向地址')
                console.log(decodeURIComponent(urlLsit[6]))
              }
            }
          }
          productList.push(...subProductList)
        } else {
          const discountPrice = $('#apex_desktop .apexPriceToPay').find('.a-offscreen').html() || $('#apex_desktop .priceToPay').find('.a-offscreen').html()
          const originalPrice = $('#apex_desktop span[data-a-color = secondary]').find('span[aria-hidden = true]').html()
          const title = ($('#productTitle').html()).trim()
          mainProduct['Handle'] = title
          mainProduct['Title'] = title
          mainProduct['Variant Price'] = discountPrice
          mainProduct['Variant Grams'] = originalPrice
          mainProduct['Variant Image'] = $('#imgTagWrapperId img')[0].attribs['data-old-hires']
          mainProduct['originalUrl'] = pUrl

          productList.push(Object.assign(tmpData, mainProduct))
        }
      }
    })
  } catch (error) {
    const json2csvParser = new Json2csvParser({excelHeader});
    const csv = json2csvParser.parse(productList);
    const csvBuf = new Buffer(csv);
    const str = iconv.decode(csvBuf, 'utf-8');
    const str2 = iconv.encode(str, 'gbk');
    const file = `/public/aaaa.csv`;
    const filePath = path.resolve('./') + file;
    fs.outputFileSync(filePath, str2);
    res.send({
      msg: error,
      code: 2000,
      data: productList
    });
  }
});

module.exports = router;

