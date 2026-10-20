import { ShareCardExportService } from './share-card-export.service';

describe('ShareCardExportService', () => {
  it('downloads a PNG with its filename', () => {
    const service = new ShareCardExportService();
    const file = new File(['png'], 'coliclic-annonce-2025-07-14.png', { type: 'image/png' });
    const link = document.createElement('a');
    const createObjectUrl = spyOn(URL, 'createObjectURL').and.returnValue('blob:test-announcement');
    const revokeObjectUrl = spyOn(URL, 'revokeObjectURL');
    const createElement = spyOn(document, 'createElement').and.returnValue(link);
    const click = spyOn(link, 'click');

    service.downloadFile(file);

    expect(createObjectUrl).toHaveBeenCalledOnceWith(file);
    expect(createElement).toHaveBeenCalledOnceWith('a');
    expect(link.href).toBe('blob:test-announcement');
    expect(link.download).toBe(file.name);
    expect(click).toHaveBeenCalledTimes(1);
    expect(revokeObjectUrl).toHaveBeenCalledOnceWith('blob:test-announcement');
  });
});
