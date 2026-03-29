import { describe, it, expect } from 'vitest'
import { ArabicNormalizer } from '@/lib/answer_matcher'

describe('اختبار معالج النصوص العربية', () => {
  const normalizer = new ArabicNormalizer()

  it('يجب أن يتجاهل التشكيل والهمزات', () => {
    const input = 'أَحْمَدُ'
    const expected = 'احمد'
    expect(normalizer.normalize(input)).toBe(expected)
  })

  it('يجب أن يعامل التاء المربوطة والهاء كشيء واحد في المقارنة الخفيفة', () => {
    const word1 = normalizer.normalize('مدرسة')
    const word2 = normalizer.normalize('مدرسه')
    expect(word1).toBe(word2)
  })
})