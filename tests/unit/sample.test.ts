describe('Sample Test Suite', () => {
  test('should pass basic assertion', () => {
    expect(1 + 1).toBe(2);
  });

  test('should handle string operations', () => {
    const greeting = 'Hello, NeonHub!';
    expect(greeting).toContain('NeonHub');
    expect(greeting.length).toBeGreaterThan(0);
  });

  test('should work with arrays', () => {
    const items = ['quality', 'pipeline', 'testing'];
    expect(items).toHaveLength(3);
    expect(items).toContain('testing');
  });

  test('should handle async operations', async () => {
    const promise = Promise.resolve('success');
    await expect(promise).resolves.toBe('success');
  });
});
