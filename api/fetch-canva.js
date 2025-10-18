// api/fetch-canva.js
import axios from 'axios';
import * as cheerio from 'cheerio';

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
    return res.status(405).json({ error: 'Only POST requests are allowed' });
  }

  const { type, subject = '', industry = '' } = req.body;

  if (!type || !typeToEnglish[type]) {
    return res.status(400).json({ error: 'Invalid design type' });
  }

  // ساخت عبارت جستجو
  const englishType = typeToEnglish[type];
  const queryParts = [englishType, subject, industry].filter(p => p.trim() !== '');
  let query = queryParts.join(' ').toLowerCase().replace(/\s+/g, '-');
  if (query.length > 100) query = query.substring(0, 100);

  const url = `https://www.canva.com/templates/?query=${encodeURIComponent(query)}&pricing=FREE`;

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
      },
      timeout: 12000
    });

    const $ = cheerio.load(response.data);
    const imageUrls = [];

    // استخراج تصاویر از کارت‌های نتیجه
    $('img.w3KZWA').each((i, el) => {
      let src = $(el).attr('src');
      if (src && src.startsWith('https://marketplace.canva.com/')) {
        src = src.trim();
        if (!imageUrls.includes(src)) {
          imageUrls.push(src);
        }
      }
      if (imageUrls.length >= 12) return false; // حداکثر 12 نمونه
    });

    res.status(200).json({
      success: true,
      query: query,
      canvaUrl: url,
      templates: imageUrls
    });

  } catch (error) {
    console.error('Error fetching Canva templates:', error.message);
    res.status(500).json({
      error: 'Failed to fetch templates from Canva',
      message: error.message
    });
  }
}
