import React, { useState } from 'react';
import useGetAllCollections from '../hooks/useGetAllCollections';
import usePostPrices from '../hooks/usePostPrices';
import { useUpdatePriceList } from '../hooks/useUpdatePriceList';
import { useDeletePriceList } from '../hooks/useDeletePriceList';
import type { Width, PriceList } from '../types';

const AddPrice: React.FC = () => {
  const { data: collections = [] } = useGetAllCollections();

  const createPrice = usePostPrices();
  const updatePrice = useUpdatePriceList();
  const deletePrice = useDeletePriceList();

  // Form State
  const [widthId, setWidthId] = useState('');
  const [carat, setCarat] = useState('18K');
  const [isDiamonds, setIsDiamonds] = useState(false);
  const [biggerSizePrice, setBiggerSizePrice] = useState('');
  const [smallerSizePrice, setSmallerSizePrice] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!widthId || !carat.trim() || !biggerSizePrice.trim() || !smallerSizePrice.trim()) {
      showStatus('Please fill in all price list fields', 'error');
      return;
    }

    const pricePayload: Partial<PriceList> = {
      widthId,
      carat,
      isDiamonds,
      biggerSizePrice,
      smallerSizePrice,
    };

    try {
      if (editingId) {
        await updatePrice.mutateAsync({ id: editingId, data: pricePayload });
        showStatus('Price tier updated successfully!');
      } else {
        await createPrice.mutateAsync(pricePayload);
        showStatus('Price tier created successfully!');
      }
      handleCancel();
    } catch (err: unknown) {
      showStatus(String(err), 'error');
    }
  };

  const handleEdit = (price: PriceList) => {
    if (!price.id) return;
    setEditingId(price.id);
    setWidthId(price.widthId);
    setCarat(price.carat);
    setIsDiamonds(price.isDiamonds);
    setBiggerSizePrice(price.biggerSizePrice);
    setSmallerSizePrice(price.smallerSizePrice);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this price list entry?')) return;
    try {
      await deletePrice.mutateAsync(id);
      showStatus('Price tier deleted successfully!');
    } catch (err: unknown) {
      showStatus(String(err), 'error');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setCarat('18K');
    setIsDiamonds(false);
    setBiggerSizePrice('');
    setSmallerSizePrice('');
  };

  // Flatten options for selection and listing
  const widthsList: { width: Width; colorName: string; modelName: string; collectionName: string }[] = [];
  const pricesList: { price: PriceList; widthValue: string; colorName: string; modelName: string }[] = [];

  collections.forEach((collection) => {
    if (collection.models && Array.isArray(collection.models)) {
      collection.models.forEach((model) => {
        if (model.colors && Array.isArray(model.colors)) {
          model.colors.forEach((color) => {
            if (color.widths && Array.isArray(color.widths)) {
              color.widths.forEach((width) => {
                widthsList.push({
                  width,
                  colorName: color.name,
                  modelName: model.name,
                  collectionName: collection.name,
                });
                if (width.priceLists && Array.isArray(width.priceLists)) {
                  width.priceLists.forEach((price) => {
                    pricesList.push({
                      price,
                      widthValue: width.value,
                      colorName: color.name,
                      modelName: model.name,
                    });
                  });
                }
              });
            }
          });
        }
      });
    }
  });

  return (
    <div>
      <div className="dashboard-header">
        <h1 className="dashboard-title">Price Lists Management</h1>
        <p className="dashboard-subtitle">Configure price matrices based on width dimensions, carat weight, and diamond options.</p>
      </div>

      {statusMsg && (
        <div
          style={{
            padding: '1rem',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            background: statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${statusMsg.type === 'success' ? '#10b981' : '#ef4444'}`,
            color: statusMsg.type === 'success' ? '#34d399' : '#f87171',
            fontSize: '0.9rem',
          }}
        >
          {statusMsg.text}
        </div>
      )}

      <div className="dashboard-grid">
        {/* Form Panel */}
        <div className="card-panel">
          <h2 className="card-title">{editingId ? 'Edit Price Entry' : 'Create Price Entry'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Parent Width Dimension</label>
              <select
                className="form-select"
                value={widthId}
                onChange={(e) => setWidthId(e.target.value)}
                required
              >
                <option value="">-- Select Width Option --</option>
                {widthsList.map(({ width, colorName, modelName, collectionName }) => (
                  <option key={width.id} value={width.id}>
                    Width {width.value}mm ({colorName} • Model {modelName} • {collectionName})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Carat Weight / Quality</label>
                <select
                  className="form-select"
                  value={carat}
                  onChange={(e) => setCarat(e.target.value)}
                  required
                >
                  <option value="9K">9K Gold</option>
                  <option value="14K">14K Gold</option>
                  <option value="18K">18K Gold</option>
                  <option value="PT950">Platinum PT950</option>
                  <option value="Silver">Silver</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ visibility: 'hidden' }}>Diamond Flag</label>
                <label style={{ display: 'flex', alignItems: 'center', height: '42px', gap: '0.5rem', fontSize: '0.95rem', cursor: 'pointer', fontWeight: 500 }}>
                  <input
                    type="checkbox"
                    checked={isDiamonds}
                    onChange={(e) => setIsDiamonds(e.target.checked)}
                  />
                  Has Diamonds
                </label>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Smaller Sizes Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  placeholder="e.g. 650"
                  value={smallerSizePrice}
                  onChange={(e) => setSmallerSizePrice(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Bigger Sizes Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  placeholder="e.g. 1200.5"
                  value={biggerSizePrice}
                  onChange={(e) => setBiggerSizePrice(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="btn-group">
              {editingId && (
                <button type="button" className="btn btn-ghost" onClick={handleCancel}>
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={createPrice.isPending || updatePrice.isPending}
              >
                {editingId ? 'Save Changes' : 'Add Price Entry'}
              </button>
            </div>
          </form>
        </div>

        {/* List Panel */}
        <div className="card-panel">
          <h2 className="card-title">Existing Price Matrices</h2>
          {pricesList.length === 0 ? (
            <div className="empty-state">No price settings found. Add pricing tiers to your widths.</div>
          ) : (
            <div className="list-container">
              {pricesList.map(({ price, widthValue, colorName, modelName }) => (
                <div key={price.id} className="list-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                    <div className="list-item-img" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', fontWeight: 'bold', color: '#3b82f6' }}>
                      {price.carat}
                    </div>
                    <div>
                      <h3 className="list-item-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {price.carat} {price.isDiamonds ? '• 💎 Diamonds' : ''}
                        <span className="badge-tag" style={{ background: 'rgba(16,185,129,0.1)' }}>{widthValue}mm Width</span>
                      </h3>
                      <p className="list-item-subtitle" style={{ fontSize: '0.75rem' }}>
                        Small Sizes: <strong>${price.smallerSizePrice}</strong> | Big Sizes: <strong>${price.biggerSizePrice}</strong>
                      </p>
                      <p className="list-item-subtitle" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Color: {colorName} • Model: {modelName}
                      </p>
                    </div>
                  </div>

                  <div className="list-item-actions">
                    <button className="btn btn-ghost" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => handleEdit(price)}>
                      Edit
                    </button>
                    {price.id && (
                      <button
                        className="btn btn-danger-outline"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                        onClick={() => handleDelete(price.id!)}
                        disabled={deletePrice.isPending}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddPrice;
