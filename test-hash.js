const crypto = require('crypto');

async function generateHash(text) {
    const data = Buffer.from(text);
    const hashBuffer = crypto.createHash('sha256').update(data).digest();
    return hashBuffer.toString('hex');
}

async function test() {
    const propertyId = '37159afd-0eb0-498f-a756-38eb487527e7';
    const cleanText = '¡Claro!';
    const sourceLang = 'es';
    const targetLang = 'en';

    // The logic from TranslationService.ts:
    // const cacheKey = `${propertyId}:${cleanText}|${sourceLang}|${targetLang}`;
    const cacheKey = `${propertyId}:${cleanText}|${sourceLang}|${targetLang}`;
    
    const hash = await generateHash(cacheKey);
    console.log('CacheKey:', cacheKey);
    console.log('Generated Hash:', hash);
    console.log('Expected Hash:  1d6b2730e5270fe096e9f4408f666eb63b5655983cd1a13a7f4e15fdadfadd46');
    console.log('Match:', hash === '1d6b2730e5270fe096e9f4408f666eb63b5655983cd1a13a7f4e15fdadfadd46');
}

test();
