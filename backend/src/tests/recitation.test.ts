import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveRecitationDetails } from '../services/RecitationService.js';
import { SURAHS } from '../constants/surahs.js';

describe('Recitation Business Logic', () => {
  it('correctly computes entire Surah Al-Fatiha', () => {
    const fatiha = SURAHS.find((s) => s.number === 1)!;
    const resolved = resolveRecitationDetails({
      surahNumber: 1,
      type: 'entire',
    });

    assert.equal(resolved.ayahCount, 7);
    assert.equal(resolved.fromAyah, 1);
    assert.equal(resolved.toAyah, 7);
    assert.equal(resolved.surahName, fatiha.transliteration);
  });

  it('correctly computes custom range within a Surah', () => {
    // Al-Baqarah (286 ayahs)
    const resolved = resolveRecitationDetails({
      surahNumber: 2,
      type: 'custom',
      fromAyah: 1,
      toAyah: 255, // Ayat-ul-Kursi
    });

    assert.equal(resolved.ayahCount, 255);
    assert.equal(resolved.fromAyah, 1);
    assert.equal(resolved.toAyah, 255);
  });

  it('rejects inverted range (fromAyah > toAyah)', () => {
    assert.throws(
      () => {
        resolveRecitationDetails({
          surahNumber: 1,
          type: 'custom',
          fromAyah: 6,
          toAyah: 2,
        });
      },
      (err: any) => err.status === 400 && err.message.includes('fromAyah cannot be greater than toAyah')
    );
  });

  it('rejects range exceeding total Surah ayahs', () => {
    assert.throws(
      () => {
        resolveRecitationDetails({
          surahNumber: 1, // Al-Fatiha has 7 ayahs
          type: 'custom',
          fromAyah: 1,
          toAyah: 10,
        });
      },
      (err: any) => err.status === 400 && err.message.includes('toAyah cannot exceed Surah total Ayahs')
    );
  });

  it('handles custom dhikr or freeform recitation without surah bounds', () => {
    const resolved = resolveRecitationDetails({
      surahName: 'Durood Ibrahim',
      ayahCount: 100,
    });

    assert.equal(resolved.surahName, 'Durood Ibrahim');
    assert.equal(resolved.ayahCount, 100);
    assert.equal(resolved.surahNumber, 0);
  });
});
