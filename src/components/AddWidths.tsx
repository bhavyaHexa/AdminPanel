import React, { useState } from 'react';
import useGetAllCollections from '../hooks/useGetAllCollections';
import usePostWidths from '../hooks/usePostWidths';
import { useUpdateWidth } from '../hooks/useUpdateWidth';
import { useDeleteWidth } from '../hooks/useDeleteWidth';
import { useDeletePriceList } from '../hooks/useDeletePriceList';
import { useDeleteTexture } from '../hooks/useDeleteTexture';
import { useDeleteAsset3D } from '../hooks/useDeleteAsset3D';
import usePostPrices from '../hooks/usePostPrices';
import { useUpdatePriceList } from '../hooks/useUpdatePriceList';
import type { Width, Color } from '../types';
import Loader from './Loader';

interface PriceGridRow {
  widthId: string;
  widthValue: string;
  isDiamonds: boolean;
  p18kId: string | null;
  p18kSmaller: string;
  p18kBigger: string;
  p14kId: string | null;
  p14kSmaller: string;
  p14kBigger: string;
  p9kId: string | null;
  p9kSmaller: string;
  p9kBigger: string;
}

const AddWidths: React.FC = () => {
  const { data: collections = [] } = useGetAllCollections();
  
  const createWidth = usePostWidths();
  const updateWidth = useUpdateWidth();
  const deleteWidth = useDeleteWidth();
  const deletePriceList = useDeletePriceList();
  const deleteTexture = useDeleteTexture();
  const deleteAsset3D = useDeleteAsset3D();
  const createPrice = usePostPrices();
  const updatePrice = useUpdatePriceList();

  // Form State
  const [selectedCollectionId, setSelectedCollectionId] = useState('');
  const [selectedModelId, setSelectedModelId] = useState('');
  const [colorId, setColorId] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Price Grid State
  const [priceGrid, setPriceGrid] = useState<PriceGridRow[]>([]);
  const [activeCaratTab, setActiveCaratTab] = useState<'18K' | '14K' | '9K'>('18K');
  const [savingPrices, setSavingPrices] = useState(false);

  // Derived options based on granular selection
  const selectedCollection = collections.find((c) => c.id === selectedCollectionId);
  const modelsOptions = selectedCollection?.models || [];
  const selectedModel = modelsOptions.find((m) => m.id === selectedModelId);
  const colorsOptions = selectedModel?.colors || [];

  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  // Sync the price grid whenever colorId or collections changes
  React.useEffect(() => {
    if (!colorId) {
      setPriceGrid([]);
      return;
    }

    let foundColor: Color | undefined;
    for (const col of collections) {
      for (const mod of col.models || []) {
        const c = mod.colors?.find(color => color.id === colorId);
        if (c) {
          foundColor = c;
          break;
        }
      }
      if (foundColor) break;
    }

    if (foundColor && foundColor.widths) {
      const gridRows: PriceGridRow[] = foundColor.widths.map(w => {
        const p18 = w.priceLists?.find(p => p.carat.toUpperCase() === '18K');
        const p14 = w.priceLists?.find(p => p.carat.toUpperCase() === '14K');
        const p9 = w.priceLists?.find(p => p.carat.toUpperCase() === '9K');

        return {
          widthId: w.id || '',
          widthValue: w.value,
          isDiamonds: p18?.isDiamonds || p14?.isDiamonds || p9?.isDiamonds || false,
          p18kId: p18?.id || null,
          p18kSmaller: p18?.smallerSizePrice || '',
          p18kBigger: p18?.biggerSizePrice || '',
          p14kId: p14?.id || null,
          p14kSmaller: p14?.smallerSizePrice || '',
          p14kBigger: p14?.biggerSizePrice || '',
          p9kId: p9?.id || null,
          p9kSmaller: p9?.smallerSizePrice || '',
          p9kBigger: p9?.biggerSizePrice || '',
        };
      });
      // Sort rows numerically ascending by width value
      gridRows.sort((a, b) => parseFloat(a.widthValue) - parseFloat(b.widthValue));
      setPriceGrid(gridRows);
    } else {
      setPriceGrid([]);
    }
  }, [colorId, collections]);

  const handleGridChange = (
    widthId: string,
    field: 'isDiamonds' | 'smaller' | 'bigger',
    carat: '18K' | '14K' | '9K',
    val: any
  ) => {
    setPriceGrid(prev => prev.map(row => {
      if (row.widthId !== widthId) return row;
      const updated = { ...row };
      if (field === 'isDiamonds') {
        updated.isDiamonds = val;
      } else if (carat === '18K') {
        if (field === 'smaller') updated.p18kSmaller = val;
        if (field === 'bigger') updated.p18kBigger = val;
      } else if (carat === '14K') {
        if (field === 'smaller') updated.p14kSmaller = val;
        if (field === 'bigger') updated.p14kBigger = val;
      } else if (carat === '9K') {
        if (field === 'smaller') updated.p9kSmaller = val;
        if (field === 'bigger') updated.p9kBigger = val;
      }
      return updated;
    }));
  };

  const handleSavePrices = async () => {
    if (priceGrid.length === 0) return;
    setSavingPrices(true);
    try {
      showStatus('Saving prices for all widths... Please wait.', 'success');
      for (const row of priceGrid) {
        // Save 18k Price
        if (row.p18kSmaller.trim() || row.p18kBigger.trim()) {
          const payload = {
            widthId: row.widthId,
            carat: '18K',
            isDiamonds: row.isDiamonds,
            smallerSizePrice: row.p18kSmaller || '0',
            biggerSizePrice: row.p18kBigger || '0',
          };
          if (row.p18kId) {
            await updatePrice.mutateAsync({ id: row.p18kId, data: payload });
          } else {
            await createPrice.mutateAsync(payload);
          }
        }

        // Save 14k Price
        if (row.p14kSmaller.trim() || row.p14kBigger.trim()) {
          const payload = {
            widthId: row.widthId,
            carat: '14K',
            isDiamonds: row.isDiamonds,
            smallerSizePrice: row.p14kSmaller || '0',
            biggerSizePrice: row.p14kBigger || '0',
          };
          if (row.p14kId) {
            await updatePrice.mutateAsync({ id: row.p14kId, data: payload });
          } else {
            await createPrice.mutateAsync(payload);
          }
        }

        // Save 9k Price
        if (row.p9kSmaller.trim() || row.p9kBigger.trim()) {
          const payload = {
            widthId: row.widthId,
            carat: '9K',
            isDiamonds: row.isDiamonds,
            smallerSizePrice: row.p9kSmaller || '0',
            biggerSizePrice: row.p9kBigger || '0',
          };
          if (row.p9kId) {
            await updatePrice.mutateAsync({ id: row.p9kId, data: payload });
          } else {
            await createPrice.mutateAsync(payload);
          }
        }
      }
      showStatus('All price configurations saved successfully!');
    } catch (err: unknown) {
      showStatus(String(err), 'error');
    } finally {
      setSavingPrices(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !colorId) {
      showStatus('Please specify Width Value', 'error');
      return;
    }

    if (editingId) {
      try {
        await updateWidth.mutateAsync({ id: editingId, data: { value: inputValue, colorId } });
        showStatus('Width dimension updated successfully!');
        handleCancel();
      } catch (err: unknown) {
        showStatus(String(err), 'error');
      }
    } else {
      const valuesToSubmit = inputValue.split(/[,\s]+/).map(part => part.trim()).filter(Boolean);
      const existingWidthsForColor = widthsList
        .filter((w) => w.width.colorId === colorId)
        .map((w) => w.width.value.trim());

      const uniqueValuesToSubmit = valuesToSubmit.filter(val => !existingWidthsForColor.includes(val));

      if (uniqueValuesToSubmit.length === 0) {
        alert('All specified widths already exist for this color variant.');
        showStatus('Widths already exist', 'error');
        return;
      }

      try {
        showStatus(`Creating ${uniqueValuesToSubmit.length} width variant(s)...`, 'success');
        for (const val of uniqueValuesToSubmit) {
          await createWidth.mutateAsync({
            value: val,
            colorId,
          });
        }
        showStatus('Width variant(s) created successfully!');
        handleCancel();
      } catch (err: unknown) {
        showStatus(String(err), 'error');
      }
    }
  };

  const handleEdit = (width: Width) => {
    if (!width.id) return;
    setEditingId(width.id);
    setInputValue(width.value);
    setColorId(width.colorId);

    // Pre-populate dependent dropdown states
    let foundCollectionId = '';
    let foundModelId = '';
    collections.forEach((collection) => {
      if (collection.models && Array.isArray(collection.models)) {
        collection.models.forEach((model) => {
          if (model.colors && Array.isArray(model.colors)) {
            if (model.colors.some((c) => c.id === width.colorId)) {
              foundCollectionId = collection.id || '';
              foundModelId = model.id || '';
            }
          }
        });
      }
    });
    setSelectedCollectionId(foundCollectionId);
    setSelectedModelId(foundModelId);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this width and all its configurations?')) return;
    try {
      showStatus('Deleting width variant and all associated configurations... Please wait.', 'success');

      // Find the fully populated width from the collections array
      let fullWidth: Width | undefined;
      for (const c of collections) {
        if (c.models) {
          for (const m of c.models) {
            if (m.colors) {
              for (const col of m.colors) {
                if (col.widths) {
                  const found = col.widths.find((w) => w.id === id);
                  if (found) {
                    fullWidth = found;
                    break;
                  }
                }
              }
            }
            if (fullWidth) break;
          }
        }
        if (fullWidth) break;
      }

      const targetWidth = fullWidth;
      if (targetWidth) {
        // Delete price lists
        if (targetWidth.priceLists && targetWidth.priceLists.length > 0) {
          for (const price of targetWidth.priceLists) {
            if (price.id) {
              await deletePriceList.mutateAsync(price.id);
            }
          }
        }
        // Delete texture
        if (targetWidth.texture && targetWidth.texture.id) {
          await deleteTexture.mutateAsync(targetWidth.texture.id);
        }
        // Delete asset3d
        if (targetWidth.asset3D && targetWidth.asset3D.id) {
          await deleteAsset3D.mutateAsync(targetWidth.asset3D.id);
        }
      }

      await deleteWidth.mutateAsync(id);
      showStatus('Width variant deleted successfully!');
    } catch (err: unknown) {
      showStatus(String(err), 'error');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setInputValue('');
  };

  // Traverse all models -> colors to fetch color details and colors list
  const colorsList: { color: Color; modelName: string; collectionName: string }[] = [];
  const widthsList: { width: Width; colorName: string; hex: string; modelName: string; collectionName: string }[] = [];

  // Filter states for width list
  const [filterCollectionId, setFilterCollectionId] = useState('');

  const [filterModelId, setFilterModelId] = useState('');
  const [filterColorId, setFilterColorId] = useState('');

  React.useEffect(() => {
    setFilterCollectionId(selectedCollectionId);
    setFilterModelId(selectedModelId);
    setFilterColorId(colorId);
  }, [selectedCollectionId, selectedModelId, colorId]);

  collections.forEach((collection) => {
    if (collection.models && Array.isArray(collection.models)) {
      collection.models.forEach((model) => {
        if (model.colors && Array.isArray(model.colors)) {
          model.colors.forEach((color) => {
            colorsList.push({ color, modelName: model.name, collectionName: collection.name });
            if (color.widths && Array.isArray(color.widths)) {
              color.widths.forEach((width) => {
                widthsList.push({
                  width,
                  colorName: color.name,
                  hex: color.hex,
                  modelName: model.name,
                  collectionName: collection.name,
                });
              });
            }
          });
        }
      });
    }
  });

  // Apply filters to widthsList
  const filteredWidths = widthsList.filter(({ width }) => {
    const matchesCollection = filterCollectionId ? width.colorId && colorsList.find(c => c.color.id === width.colorId)?.collectionName && collections.find(c => c.id === filterCollectionId)?.name === colorsList.find(c => c.color.id === width.colorId)?.collectionName : true;
    const matchesModel = filterModelId ? colorsList.find(c => c.color.id === width.colorId)?.modelName === modelsOptions.find(m => m.id === filterModelId)?.name : true;
    const matchesColor = filterColorId ? width.colorId === filterColorId : true;
    return matchesCollection && matchesModel && matchesColor;
  });


  const isAnyActionPending = 
    createWidth.isPending || 
    updateWidth.isPending || 
    deleteWidth.isPending || 
    deletePriceList.isPending || 
    deleteTexture.isPending || 
    deleteAsset3D.isPending || 
    createPrice.isPending || 
    updatePrice.isPending || 
    savingPrices;

  return (
    <div>
      {isAnyActionPending && (
        <Loader 
          message={
            deleteWidth.isPending || deletePriceList.isPending || deleteTexture.isPending || deleteAsset3D.isPending
              ? "Deleting variant..."
              : savingPrices || createPrice.isPending || updatePrice.isPending
              ? "Saving prices..."
              : "Saving width..."
          } 
        />
      )}
      <div className="dashboard-header">
        <h1 className="dashboard-title">Widths Management</h1>
        <p className="dashboard-subtitle">Define physical widths (in millimeters) associated with specific gold or metal color variants.</p>
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
        {/* Form Panel */}
        <div className="card-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* Section 1: Selection Dropdowns */}
          <div>
            <h2 className="card-title" style={{ marginBottom: '1.25rem' }}>Select Variant</h2>
            
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Collection</label>
              <select
                className="form-select"
                value={selectedCollectionId}
                onChange={(e) => {
                  setSelectedCollectionId(e.target.value);
                  setSelectedModelId('');
                  setColorId('');
                }}
                required
              >
                <option value="">-- Select Collection --</option>
                {collections.map((coll) => (
                  <option key={coll.id} value={coll.id}>
                    {coll.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Model</label>
              <select
                className="form-select"
                value={selectedModelId}
                onChange={(e) => {
                  setSelectedModelId(e.target.value);
                  setColorId('');
                }}
                disabled={!selectedCollectionId}
                required
              >
                <option value="">-- Select Model --</option>
                {modelsOptions.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Color Variant</label>
              <select
                className="form-select"
                value={colorId}
                onChange={(e) => setColorId(e.target.value)}
                disabled={!selectedModelId}
                required
              >
                <option value="">-- Select Color --</option>
                {colorsOptions.map((color) => (
                  <option key={color.id} value={color.id}>
                    {color.name} ({color.sku})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 2: Create Width Option */}
          {colorId && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 0.75rem 0' }}>
                {editingId ? 'Edit Width Option' : 'Create Width Option'}
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Width Value (mm)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 2.5 (or comma separated, e.g. 2, 2.5, 3)"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    required
                  />
                </div>
                <div className="btn-group" style={{ marginTop: '1rem' }}>
                  {editingId && (
                    <button type="button" className="btn btn-ghost" onClick={handleCancel}>
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={createWidth.isPending || updateWidth.isPending}
                  >
                    {editingId ? 'Save Changes' : 'Create Width(s)'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Section 3: Price Matrix Configuration Table */}
          {colorId && priceGrid.length > 0 && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Price Matrix Configuration</h3>
                
                {/* Carat selection tabs */}
                <div style={{ display: 'flex', gap: '1rem', background: 'rgba(255,255,255,0.03)', padding: '0.25rem 0.75rem', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.07)' }}>
                  {(['18K', '14K', '9K'] as const).map((c) => {
                    const isActive = activeCaratTab === c;
                    const label = c === '18K' ? '18 carat' : c === '14K' ? '14 carat' : '9 carat';
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setActiveCaratTab(c)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: isActive ? '#fff' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: isActive ? '600' : 'normal',
                          padding: '0.1rem 0',
                          position: 'relative',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '2px'
                        }}
                      >
                        {label}
                        <span style={{ 
                          width: '4px', 
                          height: '4px', 
                          borderRadius: '50%', 
                          background: isActive ? 'var(--primary)' : 'transparent',
                          transition: 'background-color 0.2s ease'
                        }} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Table */}
              <div style={{ overflowX: 'auto', marginBottom: '1.25rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-primary)', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                      <th style={{ padding: '0.4rem 0.25rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Width (mm)</th>
                      <th style={{ padding: '0.4rem 0.25rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Size &lt;= 57 Price</th>
                      <th style={{ padding: '0.4rem 0.25rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Size &gt; 57 Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {priceGrid.map((row) => {
                      const smallerVal = activeCaratTab === '18K' ? row.p18kSmaller : activeCaratTab === '14K' ? row.p14kSmaller : row.p9kSmaller;
                      const biggerVal = activeCaratTab === '18K' ? row.p18kBigger : activeCaratTab === '14K' ? row.p14kBigger : row.p9kBigger;

                      return (
                        <tr key={row.widthId} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '0.4rem 0.25rem', fontWeight: 'bold' }}>{row.widthValue} mm</td>
                          <td style={{ padding: '0.4rem 0.25rem' }}>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="e.g. 1649"
                              value={smallerVal}
                              onChange={(e) => handleGridChange(row.widthId, 'smaller', activeCaratTab, e.target.value)}
                              style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', borderRadius: '6px' }}
                            />
                          </td>
                          <td style={{ padding: '0.4rem 0.25rem' }}>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="e.g. 1885"
                              value={biggerVal}
                              onChange={(e) => handleGridChange(row.widthId, 'bigger', activeCaratTab, e.target.value)}
                              style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', borderRadius: '6px' }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSavePrices}
                  disabled={savingPrices}
                  style={{ width: '100%' }}
                >
                  {savingPrices ? 'Saving Price Grid...' : 'Save Price Grid'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* List Panel */}
        <div className="card-panel">
          {/* Filter Controls */}
          <div className="card-panel">
            <h2 className="card-title">Filter Widths</h2>
            <div className="form-group">
              <label className="form-label">Collection</label>
              <select
                className="form-select"
                value={filterCollectionId}
                onChange={(e) => {
                  setFilterCollectionId(e.target.value);
                  setFilterModelId('');
                  setFilterColorId('');
                }}
              >
                <option value="">-- All Collections --</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Model</label>
              <select
                className="form-select"
                value={filterModelId}
                onChange={(e) => {
                  setFilterModelId(e.target.value);
                  setFilterColorId('');
                }}
                disabled={!filterCollectionId}
              >
                <option value="">-- All Models --</option>
                {collections
                  .find((c) => c.id === filterCollectionId)
                  ?.models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Color</label>
              <select
                className="form-select"
                value={filterColorId}
                onChange={(e) => setFilterColorId(e.target.value)}
                disabled={!filterModelId}
              >
                <option value="">-- All Colors --</option>
                {colorsOptions
                  .filter((c) => {
                    if (filterModelId) {
                      const model = modelsOptions.find((m) => m.id === filterModelId);
                      return model?.colors?.some((col) => col.id === c.id);
                    }
                    return true;
                  })
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.sku})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="card-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h2 className="card-title" style={{ margin: 0 }}>Existing Width Specifications</h2>
              <div style={{ display: 'flex', gap: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.4rem 1.2rem', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.07)' }}>
                {(['18K', '14K', '9K'] as const).map((c) => {
                  const isActive = activeCaratTab === c;
                  const label = c === '18K' ? '18 carat' : c === '14K' ? '14 carat' : '9 carat';
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setActiveCaratTab(c)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: isActive ? '#fff' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: isActive ? '600' : 'normal',
                        padding: '0.2rem 0',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {label}
                      <span style={{ 
                        width: '6px', 
                        height: '6px', 
                        borderRadius: '50%', 
                        background: isActive ? 'var(--primary)' : 'transparent',
                        transition: 'background-color 0.2s ease'
                      }} />
                    </button>
                  );
                })}
              </div>
            </div>

            {filteredWidths.length === 0 ? (
              <div className="empty-state">No widths found. Add widths to your color variants.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-primary)', fontSize: '0.9rem', minWidth: '450px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                      <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Width (mm)</th>
                      <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Diamonds</th>
                      <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Size &lt;= 57</th>
                      <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Size &gt; 57</th>
                      <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWidths.map(({ width, colorName, hex, modelName }) => {
                      // Find the price list matching the active carat tab (case-insensitive)
                      const priceList = width.priceLists?.find(p => p.carat.toUpperCase() === activeCaratTab.toUpperCase());
                      const smallerPrice = priceList ? `€${priceList.smallerSizePrice}` : '—';
                      const biggerPrice = priceList ? `€${priceList.biggerSizePrice}` : '—';
                      const hasDiamonds = priceList?.isDiamonds ? '💎' : '—';

                      return (
                        <tr key={width.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '0.75rem 0.5rem' }}>
                            <div style={{ fontWeight: '500', color: '#10b981' }}>{width.value} mm</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                              {modelName} • {colorName} <span className="color-dot" style={{ backgroundColor: hex, display: 'inline-block', width: '8px', height: '8px', verticalAlign: 'middle', marginLeft: '2px' }}></span>
                            </div>
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem', fontSize: '1rem' }}>{hasDiamonds}</td>
                          <td style={{ padding: '0.75rem 0.5rem', fontWeight: '500' }}>{smallerPrice}</td>
                          <td style={{ padding: '0.75rem 0.5rem', fontWeight: '500' }}>{biggerPrice}</td>
                          <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                              <button 
                                className="btn btn-ghost" 
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', height: 'auto', minHeight: 'unset' }} 
                                onClick={() => handleEdit(width)}
                              >
                                Edit
                              </button>
                              <button
                                className="btn btn-danger-outline"
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', height: 'auto', minHeight: 'unset' }}
                                onClick={() => handleDelete(width.id!)}
                                disabled={deleteWidth.isPending}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddWidths;
