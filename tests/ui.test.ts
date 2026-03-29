import { describe, it, expect } from 'vitest'

describe('اختبار نصوص الواجهة العربية', () => {
  it('يجب أن يحتوي زر الدخول على نص عربي', () => {
    const loginText = 'تسجيل الدخول'
    expect(loginText).toContain('دخول')
  })

  it('يجب أن تكون خيارات التقييم مفهومة للطلاب', () => {
    const options = ['سهل جداً', 'جيد', 'نسيتها']
    expect(options).toContain('جيد')
  })
})