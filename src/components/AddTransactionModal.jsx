import { useState } from 'react';
import { getAssetUnit } from '../utils/calculations';

const today = () => new Date().toISOString().slice(0, 10);

export default function AddTransactionModal({ stock, existing, onClose, onSubmit, onDelete }) {
  const isEdit = !!existing;
  const unitLabel = getAssetUnit(stock.market);
  const [type, setType] = useState(existing?.type || 'BUY');
  const [date, setDate] = useState(existing?.date || today());
  const [quantity, setQuantity] = useState(existing?.quantity?.toString() || '');
  const [price, setPrice] = useState(existing?.price?.toString() || '');
  const [memo, setMemo] = useState(existing?.memo || '');
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(false);
  const typeLabel = type === 'SELL' ? '매도' : '매수';

  const handleSubmit = () => {
    if (!date) { setError(`${typeLabel}일을 입력해 주세요.`); return; }
    if (!quantity || Number(quantity) <= 0) { setError('수량을 입력해 주세요.'); return; }
    if (!price || Number(price) <= 0) { setError(`${typeLabel}가를 입력해 주세요.`); return; }
    setError('');
    onSubmit({ type, date, quantity, price, memo });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />

        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
          {isEdit ? `✏️ ${typeLabel} 수정` : `➕ ${typeLabel} 추가`}
        </h2>
        <p style={{ fontSize: 14, color: '#64748b', marginBottom: 20 }}>
          {stock.name} ({stock.symbol})
        </p>

        <Label>거래 유형</Label>
        <div className="segmented-control" style={{ marginBottom: 16 }}>
          {['BUY', 'SELL'].map((value) => (
            <button
              key={value}
              type="button"
              className={type === value ? 'segmented-control__button is-active' : 'segmented-control__button'}
              onClick={() => setType(value)}
            >
              {value === 'BUY' ? '매수' : '매도'}
            </button>
          ))}
        </div>

        <Label>{typeLabel}일</Label>
        <input
          className="input-field"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{ marginBottom: 16 }}
        />

        <Label>수량 ({unitLabel})</Label>
        <input
          className="input-field"
          type="number"
          inputMode="numeric"
          placeholder="10"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          style={{ marginBottom: 16 }}
        />

        <Label>{typeLabel}가 (1주당)</Label>
        <input
          className="input-field"
          type="number"
          inputMode="decimal"
          placeholder="75000"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          style={{ marginBottom: 16 }}
        />

        <Label>메모 (선택)</Label>
        <input
          className="input-field"
          placeholder={type === 'SELL' ? '부분 매도, 익절 등' : '분할매수 2차 등'}
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          style={{ marginBottom: 16 }}
        />

        {error && (
          <div style={{ color: '#dc2626', fontSize: 14, marginBottom: 12 }}>⚠️ {error}</div>
        )}

        <button className="btn-primary" onClick={handleSubmit} style={{ marginBottom: 10 }}>
          {isEdit ? '수정 저장' : `${typeLabel} 추가`}
        </button>

        {isEdit && !confirm && (
          <button
            onClick={() => setConfirm(true)}
            style={{
              width: '100%', padding: 14, background: 'none', border: '2px solid #fee2e2',
              color: '#dc2626', borderRadius: 14, fontSize: 15, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            이 거래 삭제
          </button>
        )}

        {isEdit && confirm && (
          <div style={{ background: '#fef2f2', borderRadius: 12, padding: 16 }}>
            <p style={{ fontSize: 14, color: '#dc2626', marginBottom: 12, textAlign: 'center' }}>
              정말 삭제하시겠습니까?
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-secondary" onClick={() => setConfirm(false)} style={{ flex: 1 }}>
                취소
              </button>
              <button
                onClick={onDelete}
                style={{
                  flex: 1, padding: 14, background: '#dc2626', color: 'white',
                  border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                삭제 확인
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Label({ children }) {
  return <div style={{ fontSize: 14, fontWeight: 600, color: '#475569', marginBottom: 6 }}>{children}</div>;
}
