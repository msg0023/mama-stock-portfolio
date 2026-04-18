import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePortfolioCtx as usePortfolio } from '../contexts/PortfolioContext';
import {
  calcStockStats, fmtPct, fmtPrice, getAssetGroupMeta, getAssetUnit, toYahooSymbol,
} from '../utils/calculations';
import AddTransactionModal from '../components/AddTransactionModal';
import SingleAssetTrendChart from '../components/SingleAssetTrendChart';
import { ArrowLeft, Pencil, Plus, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';

export default function StockDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    stocks, prices,
    updateStock, deleteStock,
    addTransaction, updateTransaction, deleteTransaction,
    setManualPrice,
  } = usePortfolio();

  const stock = stocks.find((s) => s.id === id);

  const [showAddTx,   setShowAddTx]   = useState(false);
  const [editTx,      setEditTx]      = useState(null);
  const [editName,    setEditName]    = useState(false);
  const [nameVal,     setNameVal]     = useState('');
  const [manualInput, setManualInput] = useState('');
  const [showDelete,  setShowDelete]  = useState(false);
  const [txFilter,    setTxFilter]    = useState('ALL');

  if (!stock) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60dvh] gap-4 p-8 text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-secondary">
          <AlertTriangle size={28} className="text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">종목을 찾을 수 없습니다.</p>
        <button className="btn-secondary" onClick={() => navigate(-1)} style={{ maxWidth: 160 }}>
          돌아가기
        </button>
      </div>
    );
  }

  const yahoo     = toYahooSymbol(stock.symbol, stock.market);
  const cp        = prices[yahoo]?.price ?? stock.currentPrice;
  const currency  = stock.currentCurrency || 'KRW';
  const unitLabel = getAssetUnit(stock.market);
  const groupMeta = getAssetGroupMeta(stock.market);
  const stats     = calcStockStats(stock.transactions, cp);
  const { totalQty, totalInvested, avgPrice, currentValue, pl, realizedPL, totalPL, plPct } = stats;
  const isProfit  = pl >= 0;

  const filteredTransactions = (stock.transactions || []).filter((tx) => {
    if (txFilter === 'ALL') return true;
    return (tx.type || 'BUY').toUpperCase() === txFilter;
  });

  const handleDeleteStock = async () => {
    await deleteStock(id);
    navigate('/portfolio');
  };

  const handleManualPrice = async () => {
    const v = parseFloat(manualInput.replace(/,/g, ''));
    if (!v || v <= 0) return;
    await setManualPrice(id, v);
    setManualInput('');
  };

  return (
    <div className="min-h-dvh bg-background">
      {/* 히어로 헤더 */}
      <div
        className="px-4 pt-5 pb-7 text-white"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 40%, #1d4ed8 100%)' }}
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 mb-5 border-none bg-transparent cursor-pointer p-0"
          style={{ color: 'rgba(255,255,255,0.65)', fontFamily: 'inherit', fontSize: 14 }}
        >
          <ArrowLeft size={18} />
          <span>뒤로</span>
        </button>

        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0 mr-3">
            {editName ? (
              <div className="flex gap-2 mb-1">
                <input
                  value={nameVal}
                  onChange={(e) => setNameVal(e.target.value)}
                  className="text-xl font-bold rounded-lg px-3 py-1.5 flex-1 min-w-0"
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: 'white',
                    fontFamily: 'inherit',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={async () => { await updateStock(id, { name: nameVal }); setEditName(false); }}
                  className="px-3 py-1.5 rounded-lg text-sm font-semibold cursor-pointer border-none"
                  style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontFamily: 'inherit' }}
                >
                  저장
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setNameVal(stock.name); setEditName(true); }}
                className="flex items-center gap-2 mb-1 text-left border-none bg-transparent cursor-pointer p-0"
              >
                <h1 className="text-[24px] font-bold text-white leading-tight">{stock.name}</h1>
                <Pencil size={14} style={{ color: 'rgba(255,255,255,0.5)', flexShrink: 0 }} />
              </button>
            )}

            <p className="text-[13px] mb-2" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {stock.symbol} · {stock.broker}
            </p>

            <span
              className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold text-white"
              style={{ background: groupMeta.color + '30', border: `1px solid ${groupMeta.color}50` }}
            >
              {groupMeta.label}
            </span>
          </div>

          {/* 수익률 */}
          <div className={cn(
            'flex-shrink-0 flex flex-col items-center px-3 py-2.5 rounded-xl',
            isProfit
              ? 'bg-emerald-500/20 border border-emerald-400/30'
              : 'bg-red-500/20 border border-red-400/30'
          )}>
            <div className={cn(
              'flex items-center gap-1 text-[18px] font-bold',
              isProfit ? 'text-emerald-300' : 'text-red-300'
            )}>
              {isProfit ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {fmtPct(plPct)}
            </div>
          </div>
        </div>

        {/* 요약 스탯 3개 */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          <HeaderStat label="평가금액"  value={fmtPrice(currentValue, currency)} />
          <HeaderStat label="평가손익"  value={(pl >= 0 ? '+' : '') + fmtPrice(pl, currency)} />
          <HeaderStat label="보유 수량" value={`${totalQty.toLocaleString()}${unitLabel}`} />
        </div>
      </div>

      {/* 본문 */}
      <div className="px-4 pt-4 pb-8 max-w-[960px] mx-auto">
        {/* 차트 */}
        <SingleAssetTrendChart stock={stock} currentPrice={cp} currencyLabel={currency} />

        {/* 상세 스탯 카드 */}
        <div className="card mb-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <DetailStat label="평균 단가" value={fmtPrice(avgPrice, currency)} />
            <DetailStat
              label={cp ? '현재가' : '현재가 ⚠️ 미조회'}
              value={cp ? fmtPrice(cp, currency) : '–'}
              dim={!cp}
            />
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <InlineStat label="남은 매수 원금"   value={fmtPrice(totalInvested, currency)} />
            <InlineStat
              label="실현손익"
              value={(realizedPL >= 0 ? '+' : '') + fmtPrice(realizedPL, currency)}
              color={realizedPL === 0 ? undefined : realizedPL > 0 ? '#16a34a' : '#dc2626'}
            />
            <InlineStat
              label="총 누적손익"
              value={(totalPL >= 0 ? '+' : '') + fmtPrice(totalPL, currency)}
              color={totalPL === 0 ? undefined : totalPL > 0 ? '#16a34a' : '#dc2626'}
            />
          </div>

          {/* 현재가 직접 입력 */}
          <div className="pt-4 border-t border-border">
            <p className="text-[12px] text-muted-foreground mb-2">현재가 직접 입력</p>
            <div className="flex gap-2">
              <input
                className="input-field flex-1"
                type="number"
                inputMode="decimal"
                placeholder="현재가 입력"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                style={{ padding: '10px 14px', fontSize: 14 }}
              />
              <button
                onClick={handleManualPrice}
                className="px-4 py-2 rounded-xl border-none bg-primary text-white text-[14px] font-semibold cursor-pointer whitespace-nowrap"
                style={{ fontFamily: 'inherit' }}
              >
                적용
              </button>
            </div>
          </div>
        </div>

        {/* 거래 내역 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-[17px] font-bold text-foreground">거래 내역</h2>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
              {(stock.transactions || []).length}건
            </span>
          </div>
          <button
            onClick={() => setShowAddTx(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-none bg-primary/10 text-primary text-[13px] font-semibold cursor-pointer"
            style={{ fontFamily: 'inherit' }}
          >
            <Plus size={15} strokeWidth={2.5} />
            거래 추가
          </button>
        </div>

        <div className="segmented-control mb-3">
          {[
            { key: 'ALL',  label: '전체' },
            { key: 'BUY',  label: '매수' },
            { key: 'SELL', label: '매도' },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              className={cn('segmented-control__button', txFilter === item.key && 'is-active')}
              onClick={() => setTxFilter(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {(stock.transactions || []).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">거래 내역이 없습니다.</div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">선택한 거래 유형이 없습니다.</div>
        ) : (
          <div className="space-y-2 mb-8">
            {[...filteredTransactions].reverse().map((tx) => {
              const isSell = (tx.type || 'BUY') === 'SELL';
              return (
                <div
                  key={tx.id}
                  className="card cursor-pointer flex items-center justify-between transition-all hover:shadow-card-hover active:scale-[0.99]"
                  style={{
                    borderLeft: `3px solid ${isSell ? '#f59e0b' : '#2563eb'}`,
                    background: isSell ? '#fffbeb' : 'white',
                    padding: '12px 14px',
                    marginBottom: 0,
                  }}
                  onClick={() => setEditTx(tx)}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[14px] font-semibold text-foreground">{tx.date}</span>
                      <span className={cn(
                        'text-[11px] font-bold px-2 py-0.5 rounded-full',
                        isSell ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                      )}>
                        {isSell ? '매도' : '매수'}
                      </span>
                    </div>
                    <p className="text-[12px] text-muted-foreground">
                      {tx.quantity.toLocaleString()}{unitLabel} × {fmtPrice(tx.price, currency)}
                    </p>
                    {tx.memo && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">{tx.memo}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="text-[14px] font-bold text-foreground">
                      {fmtPrice(tx.quantity * tx.price, currency)}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">수정 →</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 종목 삭제 */}
        <div className="mt-4">
          {!showDelete ? (
            <button
              onClick={() => setShowDelete(true)}
              className="w-full py-3.5 rounded-xl border border-red-200 bg-transparent text-red-500 text-[14px] font-semibold cursor-pointer transition-all hover:bg-red-50"
              style={{ fontFamily: 'inherit' }}
            >
              이 종목 삭제
            </button>
          ) : (
            <div className="p-5 rounded-xl border border-red-200 bg-red-50">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={16} className="text-red-500" />
                <p className="text-[14px] font-semibold text-red-600">정말 삭제하시겠어요?</p>
              </div>
              <p className="text-[12px] text-red-400 mb-4">
                '{stock.name}'의 모든 거래 내역이 삭제됩니다.
              </p>
              <div className="flex gap-2">
                <button className="btn-secondary flex-1" style={{ padding: '11px' }} onClick={() => setShowDelete(false)}>
                  취소
                </button>
                <button
                  onClick={handleDeleteStock}
                  className="flex-1 py-3 rounded-xl bg-red-500 text-white text-[14px] font-semibold border-none cursor-pointer transition-all hover:bg-red-600"
                  style={{ fontFamily: 'inherit' }}
                >
                  삭제 확인
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showAddTx && (
        <AddTransactionModal
          stock={stock}
          onClose={() => setShowAddTx(false)}
          onSubmit={async (tx) => { await addTransaction(id, tx); setShowAddTx(false); }}
        />
      )}

      {editTx && (
        <AddTransactionModal
          stock={stock}
          existing={editTx}
          onClose={() => setEditTx(null)}
          onSubmit={async (tx) => { await updateTransaction(id, editTx.id, tx); setEditTx(null); }}
          onDelete={async () => { await deleteTransaction(id, editTx.id); setEditTx(null); }}
        />
      )}
    </div>
  );
}

function HeaderStat({ label, value }) {
  return (
    <div>
      <p className="text-[11px] mb-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{label}</p>
      <p className="text-[14px] font-bold text-white">{value}</p>
    </div>
  );
}

function DetailStat({ label, value, dim }) {
  return (
    <div>
      <p className="text-[12px] text-muted-foreground mb-1">{label}</p>
      <p className={cn('text-[19px] font-bold', dim ? 'text-muted-foreground' : 'text-foreground')}>
        {value}
      </p>
    </div>
  );
}

function InlineStat({ label, value, color }) {
  return (
    <div className="p-3 rounded-xl bg-secondary border border-border">
      <p className="text-[11px] text-muted-foreground mb-1">{label}</p>
      <p className="text-[13px] font-bold" style={{ color: color || 'hsl(var(--foreground))' }}>
        {value}
      </p>
    </div>
  );
}
