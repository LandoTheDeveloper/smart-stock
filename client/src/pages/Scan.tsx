import { useState, useRef, useEffect, useCallback } from 'react';
import { BarcodeDetector } from 'barcode-detector';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { UNITS, getDefaultUnit } from '../lib/units';
import type { DefaultUnits } from '../lib/units';

const CATEGORIES = [
  'Dairy', 'Produce', 'Meat', 'Seafood', 'Bakery', 'Frozen',
  'Canned Goods', 'Grains & Pasta', 'Snacks', 'Beverages',
  'Condiments', 'Spices', 'Other',
] as const;

const STORAGE_LOCATIONS = ['Fridge', 'Freezer', 'Pantry', 'Counter'] as const;

type Category = (typeof CATEGORIES)[number];
type StorageLocation = (typeof STORAGE_LOCATIONS)[number];

interface ParsedReceiptItem {
  name: string;
  quantity: number;
  unit?: string;
  expected_expiration?: string;
}

const PRODUCT_SHELF_LIVES: Record<string, number> = {
  'milk': 7, 'whole milk': 7, 'skim milk': 7, '2% milk': 7, 'almond milk': 10, 'oat milk': 10,
  'yogurt': 14, 'greek yogurt': 14, 'butter': 90, 'cream cheese': 21, 'cheese': 30,
  'eggs': 28, 'bread': 7, 'bagels': 5, 'tortillas': 14,
  'apples': 28, 'oranges': 21, 'bananas': 5, 'grapes': 7, 'strawberries': 5, 'blueberries': 10,
  'lettuce': 7, 'spinach': 5, 'carrots': 21, 'broccoli': 7, 'tomatoes': 7, 'onions': 30,
  'chicken': 2, 'beef': 3, 'pork': 3, 'bacon': 7, 'fish': 2, 'salmon': 2, 'shrimp': 2,
  'ketchup': 180, 'mustard': 365, 'mayonnaise': 60, 'salsa': 14,
  'peanut butter': 90, 'jelly': 30, 'cereal': 180, 'rice': 365, 'pasta': 365,
};

const CATEGORY_SHELF_LIVES: Record<string, number> = {
  'dairy': 14, 'milks': 7, 'yogurts': 14, 'cheeses': 30, 'eggs': 28,
  'breads': 7, 'bread': 7, 'bakery': 5, 'pastries': 3,
  'fruits': 7, 'berries': 5, 'citrus-fruits': 21,
  'vegetables': 10, 'leafy-vegetables': 5, 'root-vegetables': 21,
  'meats': 3, 'meat': 3, 'poultry': 2, 'beef': 3, 'pork': 3, 'sausages': 5, 'bacon': 7,
  'seafood': 2, 'fish': 2, 'shellfish': 2,
  'beverages': 30, 'juices': 7, 'sodas': 90,
  'condiments': 90, 'sauces': 30, 'dressings': 60,
  'snacks': 60, 'chips': 60, 'crackers': 90, 'nuts': 180,
  'grains': 365, 'pasta': 365, 'rice': 365, 'cereals': 180,
  'canned-foods': 730, 'canned': 730,
  'frozen': 180, 'frozen-foods': 180,
};

interface ProductData {
  product_name?: string;
  brands?: string;
  quantity?: string;
  categories?: string;
  categories_tags?: string[];
  image_url?: string;
  nutriscore_grade?: string;
  nova_group?: number;
  ecoscore_grade?: string;
  allergens_tags?: string[];
  labels_tags?: string[];
  serving_size?: string;
  nutriments?: {
    'energy-kcal_100g'?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    sugars_100g?: number;
    fat_100g?: number;
    'saturated-fat_100g'?: number;
    fiber_100g?: number;
    sodium_100g?: number;
    'energy-kcal_serving'?: number;
    proteins_serving?: number;
    carbohydrates_serving?: number;
    sugars_serving?: number;
    fat_serving?: number;
    'saturated-fat_serving'?: number;
    fiber_serving?: number;
    sodium_serving?: number;
  };
}

function getSuggestedExpirationDate(productName?: string, categories?: string[]): string {
  let days: number | null = null;

  if (productName) {
    const n = productName.toLowerCase().trim();
    if (PRODUCT_SHELF_LIVES[n]) days = PRODUCT_SHELF_LIVES[n];
    else {
      for (const [p, d] of Object.entries(PRODUCT_SHELF_LIVES)) {
        if (n.includes(p) || p.includes(n)) { days = d; break; }
      }
    }
  }

  if (days === null && categories?.length) {
    for (const cat of categories) {
      const c = (cat.includes(':') ? cat.split(':')[1] : cat).toLowerCase().trim();
      if (CATEGORY_SHELF_LIVES[c]) { days = CATEGORY_SHELF_LIVES[c]; break; }
      for (const [k, d] of Object.entries(CATEGORY_SHELF_LIVES)) {
        if (c.includes(k) || k.includes(c)) { days = d; break; }
      }
      if (days !== null) break;
    }
  }

  const exp = new Date();
  exp.setDate(exp.getDate() + (days ?? 14));
  return exp.toISOString().split('T')[0];
}

function guessCategory(product: ProductData): Category {
  const tags = product.categories_tags || [];
  const str = (product.categories || '').toLowerCase();

  const checks: [string[], Category][] = [
    [['dairy', 'milk', 'cheese', 'yogurt'], 'Dairy'],
    [['meat', 'beef', 'pork', 'chicken'], 'Meat'],
    [['seafood', 'fish'], 'Seafood'],
    [['frozen'], 'Frozen'],
    [['bread', 'bakery'], 'Bakery'],
    [['canned'], 'Canned Goods'],
    [['pasta', 'rice', 'grain'], 'Grains & Pasta'],
    [['snack', 'chip', 'cookie'], 'Snacks'],
    [['beverage', 'drink', 'juice', 'soda'], 'Beverages'],
    [['sauce', 'condiment', 'ketchup', 'mustard'], 'Condiments'],
    [['spice', 'herb', 'seasoning'], 'Spices'],
    [['fruit', 'vegetable', 'produce'], 'Produce'],
  ];

  for (const [keywords, category] of checks) {
    if (tags.some(t => keywords.some(k => t.includes(k))) || keywords.some(k => str.includes(k))) {
      return category;
    }
  }
  return 'Other';
}

export default function Scan() {
  const nav = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeDetector | null>(null);
  const rafRef = useRef<number>(0);
  const scanningRef = useRef(false);

  const [mode, setMode] = useState<'camera' | 'manual' | 'receipt'>('camera');
  const [cameraError, setCameraError] = useState('');
  const [manualBarcode, setManualBarcode] = useState('');
  const [scanning, setScanning] = useState(false);

  const [loading, setLoading] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [lookupError, setLookupError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [receiptUploading, setReceiptUploading] = useState(false);

  const [defaultUnits, setDefaultUnits] = useState<DefaultUnits | undefined>();

  const [formData, setFormData] = useState({
    name: '',
    quantity: '1',
    unit: 'count',
    expirationDate: '',
    category: '' as Category | '',
    storageLocation: 'Pantry' as StorageLocation,
  });

  const [receiptItems, setReceiptItems] = useState<ParsedReceiptItem[]>([]);
  const [currentReceiptIndex, setCurrentReceiptIndex] = useState(0);
  const [receiptEditing, setReceiptEditing] = useState(false);
  const [receiptForm, setReceiptForm] = useState({
    name: '',
    quantity: '1',
    unit: 'count',
    expirationDate: '',
    category: '' as Category | '',
    storageLocation: 'Pantry' as StorageLocation,
  });

  useEffect(() => {
    api.get<{ success: boolean; data: { defaultUnits?: DefaultUnits } }>('/api/user/preferences')
      .then(res => {
        if (res.data.success && res.data.data?.defaultUnits) {
          setDefaultUnits(res.data.data.defaultUnits);
        }
      })
      .catch(() => {});
  }, []);

  const populateReceiptForm = useCallback((item: ParsedReceiptItem) => {
    setReceiptForm({
      name: item.name || '',
      quantity: String(item.quantity || 1),
      unit: item.unit || 'count',
      expirationDate: item.expected_expiration || '',
      category: '',
      storageLocation: 'Pantry',
    });
    setReceiptEditing(false);
  }, []);

  const fetchProduct = useCallback(async (barcode: string) => {
    setLoading(true);
    setLookupError('');
    setProductData(null);
    setScannedBarcode(barcode);

    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
      const data = await res.json();

      if (data.status === 1 && data.product) {
        const p = data.product as ProductData;
        setProductData(p);
        const cat = guessCategory(p);
        setFormData({
          name: p.product_name || '',
          quantity: '1',
          unit: getDefaultUnit(cat, defaultUnits),
          expirationDate: getSuggestedExpirationDate(p.product_name, p.categories_tags),
          category: cat,
          storageLocation: 'Pantry',
        });
      } else {
        setLookupError('Product not found in OpenFoodFacts database. You can still add it manually.');
        setFormData({
          name: '',
          quantity: '1',
          unit: 'count',
          expirationDate: '',
          category: '',
          storageLocation: 'Pantry',
        });
      }
    } catch {
      setLookupError('Failed to look up product. You can still enter details manually.');
    } finally {
      setLoading(false);
    }
  }, [defaultUnits]);

  const stopScanner = useCallback(() => {
    scanningRef.current = false;
    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    detectorRef.current = null;
    setScanning(false);
  }, []);

  const startScanner = useCallback(async () => {
    setCameraError('');
    setScanning(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;

      await new Promise(r => setTimeout(r, 100));
      const video = videoRef.current;
      if (!video) { stopScanner(); return; }

      video.srcObject = stream;
      try {
        await video.play();
      } catch {
        stopScanner();
        setCameraError('No camera found on this device. Use manual entry instead.');
        return;
      }

      detectorRef.current = new BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'qr_code', 'code_128', 'code_39'],
      });

      scanningRef.current = true;
      setScanning(true);

      const detect = async () => {
        if (!scanningRef.current || !video || video.readyState < 2) {
          if (scanningRef.current) rafRef.current = requestAnimationFrame(detect);
          return;
        }
        try {
          const barcodes = await detectorRef.current!.detect(video);
          if (barcodes.length > 0) {
            stopScanner();
            fetchProduct(barcodes[0].rawValue);
            return;
          }
        } catch {}
        rafRef.current = requestAnimationFrame(detect);
      };

      rafRef.current = requestAnimationFrame(detect);
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes('Permission') || msg.includes('NotAllowed')) {
        setCameraError('Camera permission denied. Please allow camera access in your browser settings, or use manual entry instead.');
      } else if (msg.includes('NotFound') || msg.includes('device')) {
        setCameraError('No camera found on this device. Use manual entry instead.');
      } else {
        setCameraError(`Could not start camera: ${msg}`);
      }
    }
  }, [stopScanner, fetchProduct]);

  const startReceiptCamera = useCallback(async () => {
    setCameraError('');
    setScanning(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;

      await new Promise(r => setTimeout(r, 100));
      const video = videoRef.current;
      if (!video) { stopScanner(); return; }

      video.srcObject = stream;
      try {
        await video.play();
      } catch {
        stopScanner();
        setCameraError('No camera found on this device. Use file upload instead.');
        return;
      }

      scanningRef.current = true;
      setScanning(true);
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes('Permission') || msg.includes('NotAllowed')) {
        setCameraError('Camera permission denied. Please allow camera access in your browser settings, or use file upload instead.');
      } else if (msg.includes('NotFound') || msg.includes('device')) {
        setCameraError('No camera found on this device. Use file upload instead.');
      } else {
        setCameraError(`Could not start camera: ${msg}`);
      }
    }
  }, [stopScanner]);

  useEffect(() => {
    if (mode === 'camera' && !scannedBarcode && !successMsg) {
      startScanner();
    } else if (mode === 'receipt' && receiptItems.length === 0 && !successMsg) {
      startReceiptCamera();
    }

    return () => { stopScanner(); };
  }, [mode, scannedBarcode, successMsg, receiptItems.length, startScanner, startReceiptCamera, stopScanner]);

  const handleManualLookup = () => {
    const barcode = manualBarcode.trim();
    if (!barcode) return;
    fetchProduct(barcode);
  };

  const resetState = () => {
    setScannedBarcode(null);
    setProductData(null);
    setLookupError('');
    setSuccessMsg('');
    setCameraError('');
    setReceiptUploading(false);
    setReceiptItems([]);
    setCurrentReceiptIndex(0);
    setReceiptEditing(false);
    setReceiptForm({
      name: '',
      quantity: '1',
      unit: 'count',
      expirationDate: '',
      category: '',
      storageLocation: 'Pantry',
    });
    setFormData({
      name: '',
      quantity: '1',
      unit: 'count',
      expirationDate: '',
      category: '',
      storageLocation: 'Pantry',
    });
    setManualBarcode('');
  };

  const handleScanAgain = async () => {
    stopScanner();
    resetState();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSaving(true);
    try {
      const nutrition = productData?.nutriments ? {
        kcal: productData.nutriments['energy-kcal_100g'],
        protein: productData.nutriments.proteins_100g,
        carbs: productData.nutriments.carbohydrates_100g,
        fat: productData.nutriments.fat_100g,
        fiber: productData.nutriments.fiber_100g,
        sugar: productData.nutriments.sugars_100g,
        sodium: productData.nutriments.sodium_100g,
        saturatedFat: productData.nutriments['saturated-fat_100g'],
        serving: '100g',
        nutriScore: productData.nutriscore_grade,
        novaGroup: productData.nova_group,
      } : undefined;

      await api.post('/api/pantry', {
        name: formData.name.trim(),
        quantity: parseInt(formData.quantity) || 1,
        unit: formData.unit || undefined,
        expirationDate: formData.expirationDate || undefined,
        category: formData.category || undefined,
        storageLocation: formData.storageLocation,
        barcode: scannedBarcode || undefined,
        nutrition,
        offCategories: productData?.categories_tags || undefined,
      });

      setSuccessMsg(`${formData.name} added to pantry!`);
      setProductData(null);
      setScannedBarcode(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add item');
    } finally {
      setSaving(false);
    }
  };

  const moveToNextReceiptItem = useCallback(() => {
    const nextIndex = currentReceiptIndex + 1;

    if (nextIndex >= receiptItems.length) {
      setReceiptItems([]);
      setCurrentReceiptIndex(0);
      setReceiptEditing(false);
      setSuccessMsg('All receipt items added to pantry!');
      return;
    }

    setCurrentReceiptIndex(nextIndex);
    populateReceiptForm(receiptItems[nextIndex]);
  }, [currentReceiptIndex, receiptItems, populateReceiptForm]);

  const handleAddReceiptItem = async () => {
    if (!receiptForm.name.trim()) return;

    setSaving(true);
    try {
      await api.post('/api/pantry', {
        name: receiptForm.name.trim(),
        quantity: parseInt(receiptForm.quantity) || 1,
        unit: receiptForm.unit || undefined,
        expirationDate: receiptForm.expirationDate || undefined,
        category: receiptForm.category || undefined,
        storageLocation: receiptForm.storageLocation || 'Pantry',
      });

      moveToNextReceiptItem();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add item');
    } finally {
      setSaving(false);
    }
  };

  const handleSkipReceiptItem = () => {
    moveToNextReceiptItem();
  };

  const uploadReceiptFile = useCallback(async (file: File) => {
    setReceiptUploading(true);
    setLookupError('');
    setCameraError('');
    setSuccessMsg('');

    try {
      const formData = new FormData();
      formData.append('receipt', file);

      const res = await api.post('/api/receipt/upload', formData);
      const groceries: ParsedReceiptItem[] = res.data?.groceries || [];

      if (!groceries.length) {
        alert('No items were found on the receipt.');
        return;
      }

      setReceiptItems(groceries);
      setCurrentReceiptIndex(0);
      populateReceiptForm(groceries[0]);
      stopScanner();
    } catch (err: any) {
      console.error('Receipt upload error:', err.response?.data || err);
      alert(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to upload receipt'
      );
    } finally {
      setReceiptUploading(false);
    }
  }, [populateReceiptForm, stopScanner]);

  const handleCaptureReceipt = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || receiptUploading) return;
    if (video.readyState < 2) {
      alert('Camera is not ready yet. Please try again in a moment.');
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      alert('Could not access image capture.');
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', 0.92);
    });

    if (!blob) {
      alert('Failed to capture receipt image');
      return;
    }

    const file = new File([blob], 'receipt.jpg', { type: 'image/jpeg' });
    await uploadReceiptFile(file);
  }, [receiptUploading, uploadReceiptFile]);

  const handleReceiptFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadReceiptFile(file);
    e.target.value = '';
  };

  const nutriScoreColor = (grade?: string) => {
    switch (grade?.toLowerCase()) {
      case 'a': return '#1b8a2d';
      case 'b': return '#7ac143';
      case 'c': return '#f5c400';
      case 'd': return '#ef8200';
      case 'e': return '#e63312';
      default: return '#999';
    }
  };

  const currentReceiptItem = receiptItems[currentReceiptIndex];

  return (
    <>
      <style>{`
        .scan-page { max-width: 800px; margin: 0 auto; }
        .scan-tabs { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
        .scan-tab { padding: 0.5rem 1.25rem; border-radius: 8px; border: 1px solid var(--border);
          background: var(--bg-elev); cursor: pointer; font-weight: 500; transition: all 0.2s; }
        .scan-tab.active { background: var(--primary); color: #fff; border-color: var(--primary); }
        .camera-wrapper { width: 100%; border-radius: 12px; overflow: hidden; margin-bottom: 1rem;
          background: #111; min-height: 300px; position: relative; }
        .camera-wrapper video { width: 100%; height: 100%; object-fit: cover; border-radius: 12px; }
        .scan-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; }
        .scan-box { width: 280px; height: 180px; border: 2px solid rgba(76,175,80,0.8); border-radius: 12px;
          box-shadow: 0 0 0 9999px rgba(0,0,0,0.4); }
        .receipt-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; }
        .receipt-frame { width: min(88%, 420px); height: min(72%, 560px); border: 3px solid rgba(255,255,255,0.9);
          border-radius: 12px; box-shadow: 0 0 0 9999px rgba(0,0,0,0.45); }
        .product-card { display: flex; gap: 1rem; align-items: flex-start; }
        .product-img { width: 100px; height: 100px; object-fit: contain; border-radius: 8px;
          background: #f5f5f5; flex-shrink: 0; }
        .product-info { flex: 1; }
        .product-name { font-weight: 700; font-size: 1.1rem; margin-bottom: 0.25rem; }
        .product-brand { color: var(--muted); font-size: 0.85rem; margin-bottom: 0.5rem; }
        .nutri-badges { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .nutri-badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px;
          border-radius: 6px; font-size: 0.75rem; font-weight: 700; color: #fff; text-transform: uppercase; }
        .nutrition-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 0.5rem; margin-top: 1rem; }
        .nutrition-item { background: var(--bg); padding: 8px; border-radius: 8px; text-align: center; }
        .nutrition-value { font-weight: 700; font-size: 1rem; }
        .nutrition-label { font-size: 0.75rem; color: var(--muted); }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .receipt-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; justify-content: center; margin-top: 1rem; }
        .receipt-help { color: var(--muted); font-size: 0.9rem; text-align: center; margin-top: 0.75rem; }
        .receipt-summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-top: 1rem; }
        .receipt-summary-item { background: var(--bg); border: 1px solid var(--border); border-radius: 10px; padding: 0.75rem; }
        .receipt-summary-label { font-size: 0.8rem; color: var(--muted); margin-bottom: 0.25rem; }
        .receipt-summary-value { font-weight: 600; }
        @media (max-width: 600px) {
          .form-grid { grid-template-columns: 1fr; }
          .receipt-summary-grid { grid-template-columns: 1fr; }
          .product-card { flex-direction: column; align-items: center; text-align: center; }
          .nutri-badges { justify-content: center; }
        }
        .success-card { text-align: center; padding: 2rem; }
        .success-icon { font-size: 3rem; margin-bottom: 0.5rem; color: var(--primary); }
        .allergen-list { display: flex; flex-wrap: wrap; gap: 0.25rem; margin-top: 0.5rem; }
        .allergen-tag { background: #fff3e0; color: #e65100; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; }
      `}</style>

      <div className="scan-page">
        <div className="scan-tabs">
          <button
            className={`scan-tab ${mode === 'camera' ? 'active' : ''}`}
            onClick={() => {
              stopScanner();
              resetState();
              setMode('camera');
            }}
          >
            Camera Scan
          </button>

          <button
            className={`scan-tab ${mode === 'manual' ? 'active' : ''}`}
            onClick={() => {
              stopScanner();
              resetState();
              setMode('manual');
            }}
          >
            Manual Entry
          </button>

          <button
            className={`scan-tab ${mode === 'receipt' ? 'active' : ''}`}
            onClick={() => {
              stopScanner();
              resetState();
              setMode('receipt');
            }}
          >
            Receipt Scan
          </button>
        </div>

        {successMsg && (
          <div className="card success-card">
            <div className="success-icon">&#10003;</div>
            <div style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: '0.5rem' }}>{successMsg}</div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1rem', flexWrap: 'wrap' }}>
              <button className="btn-primary" onClick={handleScanAgain}>
                {mode === 'receipt' ? 'Scan Another Receipt' : 'Scan Another'}
              </button>
              <button className="btn-outline" onClick={() => nav('/pantry')}>
                Go to Pantry
              </button>
            </div>
          </div>
        )}

        {!successMsg && mode === 'camera' && !scannedBarcode && (
          <>
            <div className="camera-wrapper">
              <video ref={videoRef} playsInline muted />
              {scanning && (
                <div className="scan-overlay">
                  <div className="scan-box" />
                </div>
              )}
              {!scanning && !cameraError && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  Starting camera...
                </div>
              )}
            </div>
            {cameraError && (
              <div className="card" style={{ textAlign: 'center', color: '#dc2626' }}>
                {cameraError}
              </div>
            )}
          </>
        )}

        {!successMsg && mode === 'manual' && !scannedBarcode && (
          <div className="card">
            <div style={{ fontWeight: 600, marginBottom: '1rem' }}>Enter Barcode Number</div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <input
                className="input"
                placeholder="e.g. 5000112637922"
                value={manualBarcode}
                onChange={e => setManualBarcode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleManualLookup()}
                style={{ flex: 1 }}
              />
              <button
                className="btn-primary"
                onClick={handleManualLookup}
                disabled={!manualBarcode.trim() || loading}
              >
                {loading ? 'Looking up...' : 'Look Up'}
              </button>
            </div>
            <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
              Enter the barcode number printed on the product packaging and we'll look it up in the OpenFoodFacts database.
            </div>
          </div>
        )}

        {!successMsg && mode === 'receipt' && receiptItems.length === 0 && (
          <div className="card">
            <div style={{ fontWeight: 600, marginBottom: '1rem', textAlign: 'center' }}>
              Scan Receipt
            </div>

            <div className="camera-wrapper">
              <video ref={videoRef} playsInline muted />
              {scanning && (
                <div className="receipt-overlay">
                  <div className="receipt-frame" />
                </div>
              )}
              {!scanning && !cameraError && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  Starting camera...
                </div>
              )}
            </div>

            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {cameraError && (
              <div className="card" style={{ textAlign: 'center', color: '#dc2626', marginBottom: '1rem' }}>
                {cameraError}
              </div>
            )}

            <div className="receipt-actions">
              <button
                className="btn-primary"
                onClick={handleCaptureReceipt}
                disabled={!scanning || receiptUploading}
              >
                {receiptUploading ? 'Uploading...' : 'Take Picture'}
              </button>

              <button
                type="button"
                className="btn-outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={receiptUploading}
              >
                Upload From Device
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleReceiptFileUpload}
              style={{ display: 'none' }}
            />

            <div className="receipt-help">
              Line up the receipt inside the frame, make sure the text is clear, then take the picture.
            </div>
          </div>
        )}

        {!successMsg && mode === 'receipt' && currentReceiptItem && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <div style={{ fontWeight: 700 }}>Review Receipt Item</div>
              <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                Item {currentReceiptIndex + 1} of {receiptItems.length}
              </div>
            </div>

            {!receiptEditing ? (
              <>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                  {receiptForm.name || 'Unnamed item'}
                </div>

                <div className="receipt-summary-grid">
                  <div className="receipt-summary-item">
                    <div className="receipt-summary-label">Quantity</div>
                    <div className="receipt-summary-value">{receiptForm.quantity || '—'}</div>
                  </div>

                  <div className="receipt-summary-item">
                    <div className="receipt-summary-label">Unit</div>
                    <div className="receipt-summary-value">{receiptForm.unit || '—'}</div>
                  </div>

                  <div className="receipt-summary-item">
                    <div className="receipt-summary-label">Expiration Date</div>
                    <div className="receipt-summary-value">{receiptForm.expirationDate || '—'}</div>
                  </div>

                  <div className="receipt-summary-item">
                    <div className="receipt-summary-label">Category</div>
                    <div className="receipt-summary-value">{receiptForm.category || '—'}</div>
                  </div>

                  <div className="receipt-summary-item">
                    <div className="receipt-summary-label">Storage Location</div>
                    <div className="receipt-summary-value">{receiptForm.storageLocation || '—'}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <button type="button" className="btn-outline" onClick={handleSkipReceiptItem}>
                    Skip
                  </button>
                  <button type="button" className="btn-outline" onClick={() => setReceiptEditing(true)}>
                    Edit
                  </button>
                  <button type="button" className="btn-primary" onClick={handleAddReceiptItem} disabled={saving || !receiptForm.name.trim()}>
                    {saving ? 'Saving...' : 'Add to Pantry'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Edit Item Details</div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 500 }}>Item Name *</label>
                    <input
                      className="input"
                      required
                      value={receiptForm.name}
                      onChange={e => setReceiptForm(p => ({ ...p, name: e.target.value }))}
                    />
                  </div>

                  <div className="form-grid">
                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: 500 }}>Quantity</label>
                      <input
                        className="input"
                        type="number"
                        min="1"
                        value={receiptForm.quantity}
                        onChange={e => setReceiptForm(p => ({ ...p, quantity: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: 500 }}>Unit</label>
                      <select
                        className="input"
                        value={receiptForm.unit}
                        onChange={e => setReceiptForm(p => ({ ...p, unit: e.target.value }))}
                      >
                        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="form-grid">
                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: 500 }}>Category</label>
                      <select
                        className="input"
                        value={receiptForm.category}
                        onChange={e => {
                          const cat = e.target.value as Category;
                          setReceiptForm(p => ({
                            ...p,
                            category: cat,
                            unit: cat ? getDefaultUnit(cat, defaultUnits) : p.unit,
                          }));
                        }}
                      >
                        <option value="">Select...</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: 500 }}>Storage Location</label>
                      <select
                        className="input"
                        value={receiptForm.storageLocation}
                        onChange={e => setReceiptForm(p => ({ ...p, storageLocation: e.target.value as StorageLocation }))}
                      >
                        {STORAGE_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 500 }}>Expiration Date</label>
                    <input
                      className="input"
                      type="date"
                      value={receiptForm.expirationDate}
                      onChange={e => setReceiptForm(p => ({ ...p, expirationDate: e.target.value }))}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <button type="button" className="btn-outline" onClick={handleSkipReceiptItem}>
                    Skip
                  </button>
                  <button type="button" className="btn-outline" onClick={() => setReceiptEditing(false)}>
                    Cancel Edit
                  </button>
                  <button type="button" className="btn-primary" onClick={handleAddReceiptItem} disabled={saving || !receiptForm.name.trim()}>
                    {saving ? 'Saving...' : 'Add to Pantry'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {loading && (
          <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
            <div
              style={{
                width: 40,
                height: 40,
                border: '3px solid var(--border)',
                borderTopColor: 'var(--primary)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 1rem'
              }}
            />
            Fetching product information...
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {!loading && lookupError && (
          <div className="card" style={{ borderLeft: '4px solid #ef8200' }}>
            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{lookupError}</div>
            {scannedBarcode && (
              <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                Barcode: {scannedBarcode}
              </div>
            )}
          </div>
        )}

        {!loading && !successMsg && (scannedBarcode || lookupError) && mode !== 'receipt' && (
          <div className="card" style={{ marginTop: '1rem' }}>
            {productData && (
              <>
                <div className="product-card" style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                  {productData.image_url && (
                    <img src={productData.image_url} alt={productData.product_name} className="product-img" />
                  )}
                  <div className="product-info">
                    <div className="product-name">{productData.product_name}</div>
                    {productData.brands && <div className="product-brand">{productData.brands}</div>}
                    <div className="nutri-badges">
                      {productData.nutriscore_grade && (
                        <span className="nutri-badge" style={{ background: nutriScoreColor(productData.nutriscore_grade) }}>
                          Nutri-Score {productData.nutriscore_grade.toUpperCase()}
                        </span>
                      )}
                      {productData.nova_group && (
                        <span className="nutri-badge" style={{ background: productData.nova_group <= 2 ? '#4caf50' : productData.nova_group === 3 ? '#ff9800' : '#f44336' }}>
                          NOVA {productData.nova_group}
                        </span>
                      )}
                    </div>
                    {productData.allergens_tags && productData.allergens_tags.length > 0 && (
                      <div className="allergen-list">
                        {productData.allergens_tags.map(a => (
                          <span key={a} className="allergen-tag">{a.replace('en:', '')}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {productData.nutriments && (() => {
                  const n = productData.nutriments;
                  const hasServing = n['energy-kcal_serving'] != null || n.proteins_serving != null;
                  const kcal = hasServing ? n['energy-kcal_serving'] : n['energy-kcal_100g'];
                  const protein = hasServing ? n.proteins_serving : n.proteins_100g;
                  const carbs = hasServing ? n.carbohydrates_serving : n.carbohydrates_100g;
                  const fat = hasServing ? n.fat_serving : n.fat_100g;
                  const fiber = hasServing ? n.fiber_serving : n.fiber_100g;
                  const sugars = hasServing ? n.sugars_serving : n.sugars_100g;
                  const label = hasServing ? `per serving${productData.serving_size ? ` (${productData.serving_size})` : ''}` : 'per 100g';

                  return (
                    <>
                      <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>Nutrition {label}</div>
                      <div className="nutrition-grid" style={{ marginBottom: '1rem' }}>
                        {kcal != null && (
                          <div className="nutrition-item">
                            <div className="nutrition-value">{Math.round(kcal)}</div>
                            <div className="nutrition-label">kcal</div>
                          </div>
                        )}
                        {protein != null && (
                          <div className="nutrition-item">
                            <div className="nutrition-value">{protein.toFixed(1)}g</div>
                            <div className="nutrition-label">Protein</div>
                          </div>
                        )}
                        {carbs != null && (
                          <div className="nutrition-item">
                            <div className="nutrition-value">{carbs.toFixed(1)}g</div>
                            <div className="nutrition-label">Carbs</div>
                          </div>
                        )}
                        {fat != null && (
                          <div className="nutrition-item">
                            <div className="nutrition-value">{fat.toFixed(1)}g</div>
                            <div className="nutrition-label">Fat</div>
                          </div>
                        )}
                        {fiber != null && (
                          <div className="nutrition-item">
                            <div className="nutrition-value">{fiber.toFixed(1)}g</div>
                            <div className="nutrition-label">Fiber</div>
                          </div>
                        )}
                        {sugars != null && (
                          <div className="nutrition-item">
                            <div className="nutrition-value">{sugars.toFixed(1)}g</div>
                            <div className="nutrition-label">Sugars</div>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </>
            )}

            <form onSubmit={handleSave}>
              <div style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Add to Pantry</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 500 }}>Item Name *</label>
                  <input
                    className="input"
                    required
                    value={formData.name}
                    onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  />
                </div>

                <div className="form-grid">
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 500 }}>Quantity</label>
                    <input
                      className="input"
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={e => setFormData(p => ({ ...p, quantity: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 500 }}>Unit</label>
                    <select
                      className="input"
                      value={formData.unit}
                      onChange={e => setFormData(p => ({ ...p, unit: e.target.value }))}
                    >
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-grid">
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 500 }}>Category</label>
                    <select
                      className="input"
                      value={formData.category}
                      onChange={e => {
                        const cat = e.target.value as Category;
                        setFormData(p => ({ ...p, category: cat, unit: getDefaultUnit(cat, defaultUnits) }));
                      }}
                    >
                      <option value="">Select...</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 500 }}>Storage Location</label>
                    <select
                      className="input"
                      value={formData.storageLocation}
                      onChange={e => setFormData(p => ({ ...p, storageLocation: e.target.value as StorageLocation }))}
                    >
                      {STORAGE_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 500 }}>Expiration Date</label>
                  <input
                    className="input"
                    type="date"
                    value={formData.expirationDate}
                    onChange={e => setFormData(p => ({ ...p, expirationDate: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-outline" onClick={handleScanAgain}>
                  {mode === 'camera' ? 'Scan Again' : 'Clear'}
                </button>
                <button type="submit" className="btn-primary" disabled={saving || !formData.name.trim()}>
                  {saving ? 'Saving...' : 'Add to Pantry'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </>
  );
}