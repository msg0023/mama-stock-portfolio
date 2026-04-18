import { useState, useEffect, useCallback } from 'react';
import {
  collection, doc, onSnapshot,
  addDoc, updateDoc, deleteDoc,
  serverTimestamp, writeBatch,
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { toYahooSymbol, CHART_COLORS } from '../utils/calculations';

function normalizeEmail(email) {
  return (email || '').trim().toLowerCase();
}

function getCacheKey(uid, email) {
  if (uid) return `portfolio-cache:uid:${uid}`;
  if (email) return `portfolio-cache:email:${email}`;
  return 'portfolio-cache:guest';
}

function getRecoveryKey(email) {
  return `portfolio-recovery:${normalizeEmail(email)}`;
}

function getGlobalRecoveryIndexKey() {
  return 'portfolio-recovery:index';
}

function readJSON(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (_) {
    // localStorage can fail in private mode or when full.
  }
}

function buildRecoveryPayload(stocks, user) {
  return {
    email: normalizeEmail(user?.email),
    updatedAt: Date.now(),
    stocks,
  };
}

function saveRecoverySnapshot(stocks, user) {
  const payload = buildRecoveryPayload(stocks, user);
  const emailKey = getRecoveryKey(user?.email);
  writeJSON(emailKey, payload);

  const indexKey = getGlobalRecoveryIndexKey();
  const index = readJSON(indexKey) || [];
  const nextIndex = [
    emailKey,
    ...index.filter((item) => item !== emailKey),
  ].slice(0, 5);
  writeJSON(indexKey, nextIndex);
}

function loadRecoverySnapshot(user) {
  const emailKey = getRecoveryKey(user?.email);
  const directMatch = readJSON(emailKey);
  if (directMatch?.stocks?.length) return directMatch;

  const index = readJSON(getGlobalRecoveryIndexKey()) || [];
  for (const key of index) {
    const candidate = readJSON(key);
    if (candidate?.stocks?.length) return candidate;
  }
  return null;
}

function normalizeImportedStocks(stocks) {
  return (stocks || []).map((stock, index) => ({
    symbol: stock.symbol,
    market: stock.market || 'KS',
    name: stock.name || stock.symbol,
    broker: stock.broker || '',
    color: stock.color || CHART_COLORS[index % CHART_COLORS.length],
    transactions: (stock.transactions || []).map((tx) => ({
      id: tx.id || uuidv4(),
      type: (tx.type || 'BUY').toUpperCase(),
      date: tx.date,
      quantity: Number(tx.quantity),
      price: Number(tx.price),
      memo: tx.memo || '',
    })),
    currentPrice: stock.currentPrice ?? null,
    currentCurrency: stock.currentCurrency || ((stock.market || 'KS') === 'US' ? 'USD' : 'KRW'),
  }));
}

export function usePortfolio() {
  const { user } = useAuth();
  const [stocks,        setStocks]        = useState([]);
  const [prices,        setPrices]        = useState({});
  const [loading,       setLoading]       = useState(true);
  const [priceLoading,  setPriceLoading]  = useState(false);
  const [recoveredOnce, setRecoveredOnce] = useState(false);

  // Firestore 실시간 리스너
  useEffect(() => {
    if (!user) {
      setStocks([]);
      setPrices({});
      setLoading(false);
      setRecoveredOnce(false);
      return;
    }

    const cacheKeys = [
      getCacheKey(user.uid, user.email),
      getCacheKey('', normalizeEmail(user.email)),
    ];

    const cached = cacheKeys
      .map((key) => readJSON(key))
      .find((value) => Array.isArray(value));

    if (cached?.length) {
      setStocks(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    const colRef = collection(db, 'users', user.uid, 'stocks');
    const unsub  = onSnapshot(
      colRef,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        // 정렬: 등록 순
        data.sort((a, b) => (a.createdAt?.seconds ?? 0) - (b.createdAt?.seconds ?? 0));

        if (!data.length && !recoveredOnce) {
          const recovery = loadRecoverySnapshot(user);
          if (recovery?.stocks?.length) {
            const recoveredStocks = normalizeImportedStocks(recovery.stocks);
            importStocks(recoveredStocks).catch(() => {});
            setStocks(recoveredStocks);
            cacheKeys.forEach((key) => writeJSON(key, recoveredStocks));
            setRecoveredOnce(true);
            setLoading(false);
            return;
          }
        }

        setStocks(data);
        cacheKeys.forEach((key) => writeJSON(key, data));
        if (data.length) {
          saveRecoverySnapshot(data, user);
        }
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );
    return unsub;
  }, [user]);

  // 현재가 불러오기
  const fetchPrices = useCallback(async (stockList) => {
    if (!stockList.length) return;
    setPriceLoading(true);
    const results = {};

    await Promise.allSettled(
      stockList.map(async (stock) => {
        const yahoo = toYahooSymbol(stock.symbol, stock.market);
        try {
          const res  = await fetch(`/api/stock-price?symbol=${encodeURIComponent(yahoo)}`);
          const data = await res.json();
          if (data.price) {
            results[yahoo] = { price: data.price, currency: data.currency, name: data.name };
            // Firestore에 백그라운드로 캐시 (await 하지 않음)
            if (user) {
              const ref = doc(db, 'users', user.uid, 'stocks', stock.id);
              updateDoc(ref, {
                currentPrice:    data.price,
                currentCurrency: data.currency,
                lastPriceUpdate: serverTimestamp(),
              }).catch(() => {});
            }
          }
        } catch (_) { /* 실패 무시 */ }
      })
    );

    setPrices((prev) => ({ ...prev, ...results }));
    setPriceLoading(false);
  }, [user]);

  // 자동 가격 조회 없음 — Firestore 캐시 가격을 바로 사용
  // 사용자가 "현재가 새로고침" 버튼을 누를 때만 조회

  // ── CRUD ──────────────────────────────────────────────

  const addStock = async ({ symbol, market, name, broker, firstTx }) => {
    if (!user) return;
    const colorIdx = stocks.length % CHART_COLORS.length;
    const colRef   = collection(db, 'users', user.uid, 'stocks');
    const newStock = {
      symbol:      symbol.toUpperCase().trim(),
      market,
      name:        name.trim(),
      broker:      broker.trim(),
      color:       CHART_COLORS[colorIdx],
      transactions: firstTx
        ? [{
            id: uuidv4(),
            type: (firstTx.type || 'BUY').toUpperCase(),
            date: firstTx.date,
            quantity: Number(firstTx.quantity),
            price: Number(firstTx.price),
            memo: firstTx.memo || '',
          }]
        : [],
      currentPrice:    null,
      currentCurrency: market === 'US' ? 'USD' : 'KRW',
      createdAt:       serverTimestamp(),
    };
    await addDoc(colRef, newStock);
  };

  const updateStock = async (stockId, updates) => {
    if (!user) return;
    const ref = doc(db, 'users', user.uid, 'stocks', stockId);
    await updateDoc(ref, updates);
  };

  const deleteStock = async (stockId) => {
    if (!user) return;
    const ref = doc(db, 'users', user.uid, 'stocks', stockId);
    await deleteDoc(ref);
  };

  const addTransaction = async (stockId, tx) => {
    if (!user) return;
    const stock = stocks.find((s) => s.id === stockId);
    if (!stock) return;
    const newTx   = {
      id: uuidv4(),
      type: (tx.type || 'BUY').toUpperCase(),
      date: tx.date,
      quantity: Number(tx.quantity),
      price: Number(tx.price),
      memo: tx.memo || '',
    };
    const updated = [...(stock.transactions || []), newTx];
    updated.sort((a, b) => new Date(a.date) - new Date(b.date));
    await updateStock(stockId, { transactions: updated });
  };

  const updateTransaction = async (stockId, txId, updates) => {
    const stock = stocks.find((s) => s.id === stockId);
    if (!stock) return;
    const updated = stock.transactions.map((t) =>
      t.id === txId
        ? {
            ...t,
            ...updates,
            type: (updates.type || t.type || 'BUY').toUpperCase(),
            quantity: Number(updates.quantity),
            price: Number(updates.price),
          }
        : t
    );
    updated.sort((a, b) => new Date(a.date) - new Date(b.date));
    await updateStock(stockId, { transactions: updated });
  };

  const deleteTransaction = async (stockId, txId) => {
    const stock = stocks.find((s) => s.id === stockId);
    if (!stock) return;
    const updated = stock.transactions.filter((t) => t.id !== txId);
    await updateStock(stockId, { transactions: updated });
  };

  const setManualPrice = async (stockId, price) => {
    await updateStock(stockId, { currentPrice: Number(price), lastPriceUpdate: serverTimestamp() });
  };

  // 백업에서 복원
  const importStocks = async (backupStocks) => {
    if (!user) return;
    const colRef = collection(db, 'users', user.uid, 'stocks');
    const batch  = writeBatch(db);
    normalizeImportedStocks(backupStocks).forEach((s, i) => {
      const ref = doc(colRef);
      batch.set(ref, {
        symbol:          s.symbol,
        market:          s.market || 'KS',
        name:            s.name,
        broker:          s.broker || '',
        color:           s.color || CHART_COLORS[i % CHART_COLORS.length],
        transactions:    s.transactions || [],
        currentPrice:    s.currentPrice || null,
        currentCurrency: s.currentCurrency || 'KRW',
        createdAt:       serverTimestamp(),
      });
    });
    await batch.commit();
  };

  return {
    stocks, prices, loading, priceLoading,
    fetchPrices: () => fetchPrices(stocks),
    addStock, updateStock, deleteStock,
    addTransaction, updateTransaction, deleteTransaction,
    setManualPrice, importStocks,
  };
}
