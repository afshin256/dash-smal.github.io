// api/fetch-canva.js
import axios from 'axios';
import * as cheerio from 'cheerio';

// تبدیل نوع فارسی به کلید انگلیسی برای جستجو
const typeToEnglish = {
  flyer: 'flyer',
  banner: 'banner',
  poster: 'poster',
  sign: 'sign',
  menu: 'menu',
  brochure: 'brochure',
  'business-card': 'business-card',
  logo: 'logo'
};

export default async function handler(req, res) {
  // فقط POST مجاز است
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, subject = '', industry = '' } = req.body;

  if (!type || !typeToEnglish[type]) {
    return res.status(400).json({ error: 'نوع طرح نامعتبر است' });
  }

  // ترکیب عبارت جستجو
  const englishType = typeToEnglish[type];
  const queryParts = [englishType, subject, industry].filter(part => part.trim() !== '');
  let query = queryParts.join(' ').toLowerCase().replace(/\s+/g, '-');

  // محدود کردن طول query (اختیاری)
  if (query.length > 100) {
    query = query.substring(0, 100);
  }

  const url = `https://www.canva.com/templates/?query=${encodeURIComponent(query)}&pricing=FREE`;

  try {
    // درخواست به Canva
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DesignBot/1.0; +https://www.dash-smal.ir)'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const imageUrls = [];

    // استخراج تصاویر از کارت‌ها
    $('img.w3KZWA').each((i, el) => {
      let src = $(el).attr('src');
      if (src && src.startsWith('https://marketplace.canva.com/')) {
        // حذف فضاهای اضافه
        src = src.trim();
        if (!imageUrls.includes(src)) {
          imageUrls.push(src);
        }
      }
      // حداکثر 12 نمونه
      if (imageUrls.length >= 12) return false;
    });

    res.status(200).json({
      success: true,
      query: query,
      canvaUrl: url,
      templates: imageUrls
    });

  } catch (error) {
    console.error('خطا در واکشی از Canva:', error.message);
    res.status(500).json({
      error: 'دریافت نمونه‌ها از Canva با خطا مواجه شد',
      message: error.message
    });
  }
}
