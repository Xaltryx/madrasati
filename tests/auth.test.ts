import { describe, it, expect } from 'vitest'

// محاكاة لدالة التأكد من الصلاحيات
function canAccessAdmin(userRole: string) {
  return userRole === 'admin'
}

describe('نظام الصلاحيات', () => {
  it('يجب أن يمنع الطالب من دخول لوحة التحكم', () => {
    const isAllowed = canAccessAdmin('student')
    expect(isAllowed).toBe(false)
  })

  it('يجب أن يسمح للمدير بدخول لوحة التحكم', () => {
    const isAllowed = canAccessAdmin('admin')
    expect(isAllowed).toBe(true)
  })
})