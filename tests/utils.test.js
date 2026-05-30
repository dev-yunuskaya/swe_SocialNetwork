const { extractHashtags } = require('../src/utils/hashtags');

describe('Hashtag extraction utility', () => {
  test('metinden hashtag çıkarır ve küçük harfe çevirir', () => {
    expect(extractHashtags('Love #Technology and #SCIENCE')).toEqual([
      'technology',
      'science',
    ]);
  });

  test('tekrarlayan hashtagleri tekilleştirir', () => {
    expect(extractHashtags('#music is #music')).toEqual(['music']);
  });

  test('hashtag yoksa boş dizi döner', () => {
    expect(extractHashtags('plain text')).toEqual([]);
  });

  test('sadece rakam olan hashtagleri yok sayar', () => {
    expect(extractHashtags('Seri #3 ve #art')).toEqual(['art']);
  });
});
