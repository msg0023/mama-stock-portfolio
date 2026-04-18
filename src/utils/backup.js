/**
 * 포트폴리오 데이터를 JSON 파일로 내보내기
 */
export function exportJSON(stocks) {
  const data = {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    stocks,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  const date = new Date().toLocaleDateString('ko-KR').replace(/\. /g, '-').replace('.', '');
  a.href     = url;
  a.download = `포트폴리오_백업_${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * JSON 파일을 읽어서 파싱
 * @returns {Promise<{stocks: Array}>}
 */
export function importJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.stocks || !Array.isArray(data.stocks)) {
          throw new Error('올바른 백업 파일이 아닙니다.');
        }
        resolve(data);
      } catch (err) {
        reject(new Error('파일을 읽을 수 없습니다: ' + err.message));
      }
    };
    reader.onerror = () => reject(new Error('파일 읽기 오류'));
    reader.readAsText(file);
  });
}
