import { describe, it, expect, vi } from 'vitest';
import {
  uploadFileToStorage,
  resolveStorageUrlSync,
} from '../services/cloudStorageService';

describe('cloudStorageService', () => {
  it('dovrebbe generare un URI di storage cloud leggero per un Blob', async () => {
    // Mock Blob and URL.createObjectURL
    globalThis.URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost/mock-blob-123');

    const fakeBlob = new Blob(['test image payload'], { type: 'image/jpeg' });
    const result = await uploadFileToStorage(fakeBlob, {
      folder: 'test_foto',
      fileName: 'cantiere_foto.jpg',
    });

    expect(result.storageUri).toContain('cloud-storage://test_foto/media_');
    expect(result.fileName).toBe('cantiere_foto.jpg');
    expect(result.mimeType).toBe('image/jpeg');
    expect(result.url).toBe('blob:http://localhost/mock-blob-123');
  });

  it('dovrebbe risolvere URL http/https e data: in modo trasparente', () => {
    const httpUrl = 'https://example.com/foto.jpg';
    const dataUrl = 'data:image/png;base64,iVBORw0KGgo=';

    expect(resolveStorageUrlSync(httpUrl)).toBe(httpUrl);
    expect(resolveStorageUrlSync(dataUrl)).toBe(dataUrl);
    expect(resolveStorageUrlSync('')).toBe('');
  });
});
