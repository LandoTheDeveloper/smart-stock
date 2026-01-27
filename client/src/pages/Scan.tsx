import { useState, useRef, useEffect, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = [
  'Dairy',
  'Produce',
  'Meat',
  'Seafood',
  'Bakery',
  'Frozen',
  'Canned Goods',
  'Grains & Pasta',
  'Snacks',
  'Beverages',
  'Condiments',
  'Spices',
  'Other',
] as const;

const STORAGE_LOCATIONS = ['Fridge', 'Freezer', 'Pantry', 'Counter'] as const;

const UNITS = [
  'count',
  'g',
  'kg',
  'ml',
  'L',
  'oz',
  'lb',
  'cups',
  'tbsp',
  'tsp',
  'pcs',
  'pack',
  'box',
  'can',
  'bottle',
  'bag',
] as const;

type Category = (typeof CATEGORIES)[number];
type StorageLocation = (typeof STORAGE_LOCATIONS)[number];

const PRODUCT_SHELF_LIVES: Record<string, number> = {
  milk: 7,
  'whole milk': 7,
  'skim milk': 7,
  '2% milk': 7,
  'almond milk': 10,
  'oat milk': 10,
  yogurt: 14,
  'greek yogurt': 14,
  butter: 90,
  'cream cheese': 21,
  cheese: 30,
  eggs: 28,
  bread: 7,
  bagels: 5,
  tortillas: 14,
  apples: 28,
  oranges: 21,
  bananas: 5,
  grapes: 7,
  strawberries: 5,
  blueberries: 10,
  lettuce: 7,
  spinach: 5,
  carrots: 21,
  broccoli: 7,
  tomatoes: 7,
  onions: 30,
  chicken: 2,
  beef: 3,
  pork: 3,
  bacon: 7,
  fish: 2,
  salmon: 2,
  shrimp: 2,
  ketchup: 180,
  mustard: 365,
  mayonnaise: 60,
  salsa: 14,
  'peanut butter': 90,
  jelly: 30,
  cereal: 180,
  rice: 365,
  pasta: 365,
};

const CATEGORY_SHELF_LIVES: Record<string, number> = {
  dairy: 14,
  milks: 7,
  yogurts: 14,
  cheeses: 30,
  eggs: 28,
  breads: 7,
  bread: 7,
  bakery: 5,
  pastries: 3,
  fruits: 7,
  berries: 5,
  'citrus-fruits': 21,
  vegetables: 10,
  'leafy-vegetables': 5,
  'root-vegetables': 21,
  meats: 3,
  meat: 3,
  poultry: 2,
  beef: 3,
  pork: 3,
  sausages: 5,
  bacon: 7,
  seafood: 2,
  fish: 2,
  shellfish: 2,
  beverages: 30,
  juices: 7,
  sodas: 90,
  condiments: 90,
  sauces: 30,
  dressings: 60,
  snacks: 60,
  chips: 60,
  crackers: 90,
  nuts: 180,
  grains: 365,
  pasta: 365,
  rice: 365,
  cereals: 180,
  'canned-foods': 730,
  canned: 730,
  frozen: 180,
  'frozen-foods': 180,
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
  serving_quantity?: number;
  product_quantity?: string;
  nutriments?: {
    'energy-kcal_100g'?: number;
    'energy-kcal_serving'?: number;
    proteins_100g?: number;
    proteins_serving?: number;
    carbohydrates_100g?: number;
    carbohydrates_serving?: number;
    sugars_100g?: number;
    sugars_serving?: number;
    fat_100g?: number;
    fat_serving?: number;
    'saturated-fat_100g'?: number;
    'saturated-fat_serving'?: number;
    fiber_100g?: number;
    fiber_serving?: number;
    sodium_100g?: number;
    sodium_serving?: number;
  };
}

function getSuggestedExpirationDate(
  productName?: string,
  categories?: string[]
): string {
  let days: number | null = null;

  if (productName) {
    const n = productName.toLowerCase().trim();
    if (PRODUCT_SHELF_LIVES[n]) days = PRODUCT_SHELF_LIVES[n];
    else {
      for (const [p, d] of Object.entries(PRODUCT_SHELF_LIVES)) {
        if (n.includes(p) || p.includes(n)) {
          days = d;
          break;
        }
      }
    }
  }

  if (days === null && categories?.length) {
    for (const cat of categories) {
      const c = (cat.includes(':') ? cat.split(':')[1] : cat)
        .toLowerCase()
        .trim();
      if (CATEGORY_SHELF_LIVES[c]) {
        days = CATEGORY_SHELF_LIVES[c];
        break;
      }
      for (const [k, d] of Object.entries(CATEGORY_SHELF_LIVES)) {
        if (c.includes(k) || k.includes(c)) {
          days = d;
          break;
        }
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
    if (
      tags.some((t) => keywords.some((k) => t.includes(k))) ||
      keywords.some((k) => str.includes(k))
    ) {
      return category;
    }
  }
  return 'Other';
}

const SCANNER_ID = 'html5-qrcode-scanner';

export default function Scan() {
  const nav = useNavigate();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scanningRef = useRef(false);

  const [mode, setMode] = useState<'camera' | 'manual'>('camera');
  const [cameraError, setCameraError] = useState('');
  const [manualBarcode, setManualBarcode] = useState('');
  const [scanning, setScanning] = useState(false);

  const [loading, setLoading] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [lookupError, setLookupError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [nutriView, setNutriView] = useState<'100g' | 'serving'>('100g');

  const [formData, setFormData] = useState({
    name: '',
    quantity: '1',
    unit: 'count',
    expirationDate: '',
    category: '' as Category | '',
    storageLocation: 'Pantry' as StorageLocation,
  });

  const hasServingData =
    productData?.nutriments?.['energy-kcal_serving'] != null;

  const fetchProduct = useCallback(async (barcode: string) => {
    setLoading(true);
    setLookupError('');
    setProductData(null);
    setScannedBarcode(barcode);
    setNutriView('100g');

    try {
      const res = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`
      );
      const data = await res.json();

      if (data.status === 1 && data.product) {
        const p = data.product as ProductData;
        setProductData(p);
        setFormData({
          name: p.product_name || '',
          quantity: '1',
          unit: p.quantity || 'count',
          expirationDate: getSuggestedExpirationDate(
            p.product_name,
            p.categories_tags
          ),
          category: guessCategory(p),
          storageLocation: 'Pantry',
        });
      } else {
        setLookupError(
          'Product not found in OpenFoodFacts database. You can still add it manually.'
        );
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
      setLookupError(
        'Failed to look up product. You can still enter details manually.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current && scanningRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {
        /* already stopped */
      }
      scanningRef.current = false;
    }
    setScanning(false);
  }, []);

  const startScanner = useCallback(async () => {
    setCameraError('');
    setScanning(false);

    await new Promise((r) => setTimeout(r, 150));

    const el = document.getElementById(SCANNER_ID);
    if (!el) return;

    try {
      // Clear any previous scanner instance to avoid conflicts
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch {
          /* ok */
        }
        scannerRef.current = null;
      }

      scannerRef.current = new Html5Qrcode(SCANNER_ID, {
        verbose: false,
        formatsToSupport: undefined, // support all formats
      });

      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 15,
          qrbox: undefined, // scan the entire video frame for better detection
          disableFlip: false,
        },
        (decodedText) => {
          stopScanner();
          fetchProduct(decodedText);
        },
        () => {
          /* scan miss */
        }
      );
      scanningRef.current = true;
      setScanning(true);
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes('Permission') || msg.includes('NotAllowed')) {
        setCameraError(
          'Camera permission denied. Please allow camera access in your browser settings, or use manual entry.'
        );
      } else if (msg.includes('NotFound') || msg.includes('device')) {
        setCameraError(
          'No camera found on this device. Use manual entry instead.'
        );
      } else {
        setCameraError(`Could not start camera: ${msg}`);
      }
    }
  }, [stopScanner, fetchProduct]);

  useEffect(() => {
    if (mode === 'camera' && !scannedBarcode && !successMsg) {
      startScanner();
    }
    return () => {
      stopScanner();
    };
  }, [mode, scannedBarcode, successMsg, startScanner, stopScanner]);

  const handleManualLookup = () => {
    const barcode = manualBarcode.trim();
    if (!barcode) return;
    fetchProduct(barcode);
  };

  const handleScanAgain = async () => {
    setScannedBarcode(null);
    setProductData(null);
    setLookupError('');
    setSuccessMsg('');
    setNutriView('100g');
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSaving(true);
    try {
      const nutrition = productData?.nutriments
        ? {
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
          }
        : undefined;

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

  const nutriScoreColor = (grade?: string) => {
    switch (grade?.toLowerCase()) {
      case 'a':
        return '#1b8a2d';
      case 'b':
        return '#7ac143';
      case 'c':
        return '#f5c400';
      case 'd':
        return '#ef8200';
      case 'e':
        return '#e63312';
      default:
        return '#999';
    }
  };

  const n = productData?.nutriments;
  const is100g = nutriView === '100g';

  const nutriItems = n
    ? [
        {
          value: is100g ? n['energy-kcal_100g'] : n['energy-kcal_serving'],
          label: 'Calories',
          unit: 'kcal',
          round: true,
        },
        {
          value: is100g ? n.proteins_100g : n.proteins_serving,
          label: 'Protein',
          unit: 'g',
        },
        {
          value: is100g ? n.carbohydrates_100g : n.carbohydrates_serving,
          label: 'Carbs',
          unit: 'g',
        },
        { value: is100g ? n.fat_100g : n.fat_serving, label: 'Fat', unit: 'g' },
        {
          value: is100g ? n.fiber_100g : n.fiber_serving,
          label: 'Fiber',
          unit: 'g',
        },
        {
          value: is100g ? n.sugars_100g : n.sugars_serving,
          label: 'Sugars',
          unit: 'g',
        },
      ].filter((i) => i.value != null)
    : [];

  return (
    <>
      <style>{`
        .scan-page { max-width: 800px; margin: 0 auto; }
        .scan-tabs { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
        .scan-tab { padding: 0.5rem 1.25rem; border-radius: 8px; border: 1px solid var(--border);
          background: var(--bg-elev); cursor: pointer; font-weight: 500; transition: all 0.2s; }
        .scan-tab.active { background: var(--primary); color: #fff; border-color: var(--primary); }
        .camera-wrapper { width: 100%; border-radius: 12px; overflow: hidden; margin-bottom: 1rem;
          background: #111; min-height: 300px; position: relative; }
        #${SCANNER_ID} { width: 100%; }
        #${SCANNER_ID} video { border-radius: 12px; }
        .scan-tip { text-align: center; padding: 0.75rem; color: var(--muted); font-size: 0.85rem;
          background: var(--bg-elev); border-radius: 8px; margin-bottom: 1rem;
          border: 1px dashed var(--border); }
        .product-card { display: flex; gap: 1rem; align-items: flex-start; }
        .product-img { width: 100px; height: 100px; object-fit: contain; border-radius: 8px;
          background: #f5f5f5; flex-shrink: 0; }
        .product-info { flex: 1; }
        .product-name { font-weight: 700; font-size: 1.1rem; margin-bottom: 0.25rem; }
        .product-brand { color: var(--muted); font-size: 0.85rem; margin-bottom: 0.5rem; }
        .nutri-badges { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .nutri-badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px;
          border-radius: 6px; font-size: 0.75rem; font-weight: 700; color: #fff; text-transform: uppercase; }
        .nutri-header { display: flex; align-items: center; justify-content: space-between;
          margin-top: 1rem; margin-bottom: 0.5rem; }
        .nutri-toggle { display: flex; gap: 0; border: 1px solid var(--border); border-radius: 6px; overflow: hidden; }
        .nutri-toggle button { padding: 4px 10px; font-size: 0.75rem; font-weight: 600; border: none;
          cursor: pointer; background: var(--bg-elev); color: var(--muted); transition: all 0.15s; }
        .nutri-toggle button.active { background: var(--primary); color: #fff; }
        .nutrition-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 0.5rem; }
        .nutrition-item { background: var(--bg); padding: 8px; border-radius: 8px; text-align: center; }
        .nutrition-value { font-weight: 700; font-size: 1rem; }
        .nutrition-label { font-size: 0.75rem; color: var(--muted); }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .scan-form-field input[type="date"] { box-sizing: border-box; width: 100%; max-width: 100%; }
        @media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; }
          .product-card { flex-direction: column; align-items: center; text-align: center; }
          .nutri-badges { justify-content: center; }
          .nutri-header { flex-direction: column; gap: 0.5rem; align-items: flex-start; } }
        .success-card { text-align: center; padding: 2rem; }
        .success-icon { font-size: 3rem; margin-bottom: 0.5rem; color: var(--primary); }
        .allergen-list { display: flex; flex-wrap: wrap; gap: 0.25rem; margin-top: 0.5rem; }
        .allergen-tag { background: #fff3e0; color: #e65100; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; }
      `}</style>

      <div className='scan-page'>
        <div className='scan-tabs'>
          <button
            className={`scan-tab ${mode === 'camera' ? 'active' : ''}`}
            onClick={() => {
              stopScanner();
              setMode('camera');
              setScannedBarcode(null);
              setProductData(null);
              setLookupError('');
              setSuccessMsg('');
            }}
          >
            Camera Scan
          </button>
          <button
            className={`scan-tab ${mode === 'manual' ? 'active' : ''}`}
            onClick={() => {
              stopScanner();
              setMode('manual');
              setScannedBarcode(null);
              setProductData(null);
              setLookupError('');
              setSuccessMsg('');
            }}
          >
            Manual Entry
          </button>
        </div>

        {/* Success message */}
        {successMsg && (
          <div className='card success-card'>
            <div className='success-icon'>&#10003;</div>
            <div
              style={{
                fontWeight: 700,
                fontSize: '1.2rem',
                marginBottom: '0.5rem',
              }}
            >
              {successMsg}
            </div>
            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'center',
                marginTop: '1rem',
              }}
            >
              <button className='btn-primary' onClick={handleScanAgain}>
                Scan Another
              </button>
              <button className='btn-outline' onClick={() => nav('/pantry')}>
                Go to Pantry
              </button>
            </div>
          </div>
        )}

        {/* Camera mode */}
        {!successMsg && mode === 'camera' && !scannedBarcode && (
          <>
            <div className='camera-wrapper'>
              <div id={SCANNER_ID} />
              {!scanning && !cameraError && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                  }}
                >
                  Starting camera...
                </div>
              )}
            </div>
            {scanning && (
              <div className='scan-tip'>
                Hold the barcode steady in front of the camera. The scanner
                reads the entire frame.
              </div>
            )}
            {cameraError && (
              <div
                className='card'
                style={{ textAlign: 'center', color: '#dc2626' }}
              >
                {cameraError}
              </div>
            )}
          </>
        )}

        {/* Manual mode */}
        {!successMsg && mode === 'manual' && !scannedBarcode && (
          <div className='card'>
            <div style={{ fontWeight: 600, marginBottom: '1rem' }}>
              Enter Barcode Number
            </div>
            <div
              style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}
            >
              <input
                className='input'
                placeholder='e.g. 5000112637922'
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualLookup()}
                style={{ flex: 1 }}
              />
              <button
                className='btn-primary'
                onClick={handleManualLookup}
                disabled={!manualBarcode.trim() || loading}
              >
                {loading ? 'Looking up...' : 'Look Up'}
              </button>
            </div>
            <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
              Enter the barcode number printed on the product packaging and
              we'll look it up in the OpenFoodFacts database.
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div
            className='card'
            style={{ textAlign: 'center', padding: '2rem' }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                border: '3px solid var(--border)',
                borderTopColor: 'var(--primary)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 1rem',
              }}
            />
            Fetching product information...
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Lookup error */}
        {!loading && lookupError && (
          <div className='card' style={{ borderLeft: '4px solid #ef8200' }}>
            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
              {lookupError}
            </div>
            {scannedBarcode && (
              <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                Barcode: {scannedBarcode}
              </div>
            )}
          </div>
        )}

        {/* Product info + form */}
        {!loading && !successMsg && (scannedBarcode || lookupError) && (
          <div className='card' style={{ marginTop: '1rem' }}>
            {productData && (
              <>
                <div
                  className='product-card'
                  style={{
                    marginBottom: '1rem',
                    paddingBottom: '1rem',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  {productData.image_url && (
                    <img
                      src={productData.image_url}
                      alt={productData.product_name}
                      className='product-img'
                    />
                  )}
                  <div className='product-info'>
                    <div className='product-name'>
                      {productData.product_name}
                    </div>
                    {productData.brands && (
                      <div className='product-brand'>{productData.brands}</div>
                    )}
                    <div className='nutri-badges'>
                      {productData.nutriscore_grade && (
                        <span
                          className='nutri-badge'
                          style={{
                            background: nutriScoreColor(
                              productData.nutriscore_grade
                            ),
                          }}
                        >
                          Nutri-Score{' '}
                          {productData.nutriscore_grade.toUpperCase()}
                        </span>
                      )}
                      {productData.nova_group && (
                        <span
                          className='nutri-badge'
                          style={{
                            background:
                              productData.nova_group <= 2
                                ? '#4caf50'
                                : productData.nova_group === 3
                                ? '#ff9800'
                                : '#f44336',
                          }}
                        >
                          NOVA {productData.nova_group}
                        </span>
                      )}
                    </div>
                    {productData.allergens_tags &&
                      productData.allergens_tags.length > 0 && (
                        <div className='allergen-list'>
                          {productData.allergens_tags.map((a) => (
                            <span key={a} className='allergen-tag'>
                              {a.replace('en:', '')}
                            </span>
                          ))}
                        </div>
                      )}
                  </div>
                </div>

                {nutriItems.length > 0 && (
                  <>
                    <div className='nutri-header'>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        Nutrition{' '}
                        {is100g
                          ? '(per 100g)'
                          : `(per serving${
                              productData.serving_size
                                ? ` — ${productData.serving_size}`
                                : ''
                            })`}
                      </div>
                      {hasServingData && (
                        <div className='nutri-toggle'>
                          <button
                            className={is100g ? 'active' : ''}
                            onClick={() => setNutriView('100g')}
                          >
                            Per 100g
                          </button>
                          <button
                            className={!is100g ? 'active' : ''}
                            onClick={() => setNutriView('serving')}
                          >
                            Per Serving
                          </button>
                        </div>
                      )}
                    </div>
                    <div
                      className='nutrition-grid'
                      style={{ marginBottom: '1rem' }}
                    >
                      {nutriItems.map((item) => (
                        <div className='nutrition-item' key={item.label}>
                          <div className='nutrition-value'>
                            {item.round
                              ? Math.round(item.value!)
                              : item.value!.toFixed(1)}
                            {item.unit !== 'kcal' ? item.unit : ''}
                          </div>
                          <div className='nutrition-label'>
                            {item.label}
                            {item.unit === 'kcal' ? ' (kcal)' : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            <form onSubmit={handleSave}>
              <div style={{ fontWeight: 600, marginBottom: '0.75rem' }}>
                Add to Pantry
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <div className='scan-form-field'>
                  <label style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                    Item Name *
                  </label>
                  <input
                    className='input'
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, name: e.target.value }))
                    }
                  />
                </div>

                <div className='form-grid'>
                  <div className='scan-form-field'>
                    <label style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                      Quantity
                    </label>
                    <input
                      className='input'
                      type='number'
                      min='1'
                      value={formData.quantity}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, quantity: e.target.value }))
                      }
                    />
                  </div>
                  <div className='scan-form-field'>
                    <label style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                      Unit
                    </label>
                    <select
                      className='input'
                      value={formData.unit}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, unit: e.target.value }))
                      }
                    >
                      {UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className='form-grid'>
                  <div className='scan-form-field'>
                    <label style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                      Category
                    </label>
                    <select
                      className='input'
                      value={formData.category}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          category: e.target.value as Category,
                        }))
                      }
                    >
                      <option value=''>Select...</option>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className='scan-form-field'>
                    <label style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                      Storage Location
                    </label>
                    <select
                      className='input'
                      value={formData.storageLocation}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          storageLocation: e.target.value as StorageLocation,
                        }))
                      }
                    >
                      {STORAGE_LOCATIONS.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className='scan-form-field'>
                  <label style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                    Expiration Date
                  </label>
                  <input
                    className='input'
                    type='date'
                    value={formData.expirationDate}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        expirationDate: e.target.value,
                      }))
                    }
                    style={{ boxSizing: 'border-box', width: '100%' }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  marginTop: '1rem',
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  type='button'
                  className='btn-outline'
                  onClick={handleScanAgain}
                >
                  {mode === 'camera' ? 'Scan Again' : 'Clear'}
                </button>
                <button
                  type='submit'
                  className='btn-primary'
                  disabled={saving || !formData.name.trim()}
                >
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
