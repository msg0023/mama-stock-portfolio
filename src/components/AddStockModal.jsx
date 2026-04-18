import { useState } from 'react';
import { BROKERS, MARKETS } from '../utils/calculations';

const today = () => new Date().toISOString().slice(0, 10);

export default function AddStockModal({ onClose, onSubmit }) {
  const [step,       setStep]       = useState(1); // 1: 종목정보, 2: 첫 매수
  const [market,     setMarket]     = useState('KS');
  const [symbol,     setSymbol]     = useState('');
  const [name,       setName]       = useState('');
  const [broker,     setBroker]     = useState('');
  const [brokerEtc,  setBrokerEtc]  = useState('');
  const [fetching,   setFetching]   = useState(false);
  // 첫 매수
  const [date,       setDate]       = useState(today());
  const [quantity,   setQuantity]   = useState('');
  const [price,      setPrice]      = useState('');
  const [memo,       setMemo]       = useState('');
  const [error,      setError]      = useState('');

  const actualBroker = broker === '직접입력' ? brokerEtc : broker;

  const lookupName = async () => {
    if (!symbol.trim()) return;
    setFetching(true);
    try {
      const normalized = symbol.trim().toUpperCase();
      const yahoo = market === 'KS'
        ? `${normalized}.KS`
        : market === 'KQ'
          ? `${normalized}.KQ`
          : market === 'COIN'
            ? (normalized.includes('-') ? normalized : `${normalized}-USD`)
            : normalized;
      const res    = await fetch(`/api/stock-price?symbol=${encodeURIComponent(yahoo)}`);
      const data   = await res.json();
      if (data.name) setName(data.name);
    } catch (_) {}
    setFetching(false);
  };

  const handleStep1 = () => {
    if (!symbol.trim()) { setError('종목 코드를 입력해 주세요.'); return; }
    if (!name.trim())   { setError('종목명을 입력해 주세요.'); return; }
    if (!actualBroker)  { setError('증권사를 선택해 주세요.'); return; }
    setError('');
    setStep(2);
  };

  const handleSubmit = () => {
    if (!date)     { setError('매수일을 입력해 주세요.'); return; }
    if (!quantity || Number(quantity) <= 0) { setError('수량을 입력해 주세요.'); return; }
    if (!price    || Number(price) <= 0)    { setError('매수가를 입력해 주세요.'); return; }
    setError('');
    onSubmit({
      symbol, market, name: name.trim(), broker: actualBroker,
      firstTx: { type: 'BUY', date, quantity, price, memo },
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />

        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>
          {step === 1 ? '➕ 자산 추가' : '📅 첫 번째 매수 입력'}
        </h2>

        {step === 1 && (
          <>
            <Label>시장</Label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {MARKETS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMarket(m.value)}
                  style={{
                    flex: 1, padding: '12px 6px', borderRadius: 12, border: '2px solid',
                    borderColor: market === m.value ? '#2563eb' : '#e2e8f0',
                    background:  market === m.value ? '#eff6ff' : 'white',
                    color:       market === m.value ? '#2563eb' : '#64748b',
                    fontWeight:  market === m.value ? 700 : 400,
                    fontSize: 13, fontFamily: 'inherit', cursor: 'pointer',
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <Label>{market === 'COIN' ? '코인 심볼' : '종목 코드'}</Label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input
                className="input-field"
                placeholder={market === 'US' ? 'AAPL' : market === 'COIN' ? 'BTC 또는 BTC-USD' : '005930'}
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                style={{ flex: 1 }}
              />
              <button
                onClick={lookupName}
                disabled={fetching}
                style={{
                  padding: '0 18px', borderRadius: 12, border: 'none',
                  background: '#2563eb', color: 'white', fontWeight: 700,
                  fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
                  opacity: fetching ? 0.6 : 1, whiteSpace: 'nowrap',
                }}
              >
                {fetching ? '조회 중…' : '이름 조회'}
              </button>
            </div>

            <Label>{market === 'COIN' ? '코인명' : '종목명'}</Label>
            <input
              className="input-field"
              placeholder={market === 'COIN' ? '비트코인' : '삼성전자'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ marginBottom: 16 }}
            />

            <Label>{market === 'COIN' ? '거래소' : '증권사'}</Label>
            <select
              className="input-field"
              value={broker}
              onChange={(e) => setBroker(e.target.value)}
              style={{ marginBottom: broker === '직접입력' ? 8 : 16 }}
            >
              <option value="">선택해 주세요</option>
              {BROKERS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            {broker === '직접입력' && (
              <input
                className="input-field"
                placeholder={market === 'COIN' ? '거래소명 입력' : '증권사명 입력'}
                value={brokerEtc}
                onChange={(e) => setBrokerEtc(e.target.value)}
                style={{ marginBottom: 16 }}
              />
            )}
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ background: '#eff6ff', borderRadius: 12, padding: '12px 16px', marginBottom: 20 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#2563eb' }}>{name}</span>
              <span style={{ fontSize: 13, color: '#64748b', marginLeft: 8 }}>{symbol} · {actualBroker}</span>
            </div>

            <Label>매수일</Label>
            <input
              className="input-field"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ marginBottom: 16 }}
            />

            <Label>수량 ({market === 'COIN' ? '개' : '주'})</Label>
            <input
              className="input-field"
              type="number"
              inputMode="numeric"
              placeholder="10"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              style={{ marginBottom: 16 }}
            />

            <Label>매수가 (1주당)</Label>
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
              placeholder="분할매수 1차 등"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              style={{ marginBottom: 16 }}
            />
          </>
        )}

        {error && (
          <div style={{ color: '#dc2626', fontSize: 14, marginBottom: 12 }}>⚠️ {error}</div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          {step === 2 && (
            <button className="btn-secondary" onClick={() => setStep(1)} style={{ flex: 1 }}>
              이전
            </button>
          )}
          <button
            className="btn-primary"
            onClick={step === 1 ? handleStep1 : handleSubmit}
            style={{ flex: step === 2 ? 2 : 1 }}
          >
            {step === 1 ? '다음 →' : '종목 추가 완료'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Label({ children }) {
  return <div style={{ fontSize: 14, fontWeight: 600, color: '#475569', marginBottom: 6 }}>{children}</div>;
}
